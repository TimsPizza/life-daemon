import { Subscriber } from "@/api/subscription/model";
import { subscriberRepository } from "@/api/subscription/repository";
import { sendEmail } from "@/common/utils/email";
import { sendOpenAIRequest } from "@/common/utils/openai";
import { emailTemplateManager } from "@/common/templates/emails";
import { env } from "@/common/utils/envConfig";
import pino from "pino";
import { v4 as uuidv4 } from "uuid";
import { FALLBACK_TEMPLATES, PROMPTS } from "@/common/utils/prompts";
import { TimeZoneGroupManager } from "@/common/utils/timeZoneManager";
import { dbEvents } from "@/common/utils/db";

class SubscriptionService {
  private static instance: SubscriptionService;
  private logger: pino.Logger;
  private todaysMessages: Record<Subscriber["preferredLanguage"], string>;
  private timeZoneManager: TimeZoneGroupManager;
  private templateRefreshInterval: NodeJS.Timeout | null = null;

  public static getInstance(): SubscriptionService {
    if (!this.instance) {
      this.instance = new SubscriptionService();
    }
    return this.instance;
  }

  private constructor() {
    this.logger = pino({
      name: "SubscriptionService",
      level: process.env.LOG_LEVEL || "info",
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      },
    });

    this.todaysMessages = {
      en: "",
      fr: "",
      cn: "",
      jp: "",
    };

    // Initialize TimeZoneManager with send callback
    this.timeZoneManager = new TimeZoneGroupManager(async (subscribers) => {
      for (const subscriber of subscribers) {
        await this.sendDailyNotification(subscriber);
      }
    });

    // Set up template refresh interval
    const currentTime = Date.now(); // Corrected to use Date.now()
    const millisecondsUntilMidnight =
      24 * 60 * 60 * 1000 - (currentTime % (24 * 60 * 60 * 1000));
    setTimeout(() => {
      this.startDailyTemplateUpdate();
      this.logger.info("Daily template update started");
    }, millisecondsUntilMidnight);

    // Initial connection - full initialization
    dbEvents.on("initialConnection", async () => {
      try {
        await this.tryUpdateDailyTemplate();
        await this.initializeTimeZoneManager();
        this.logger.info("SubscriptionService initialized successfully");
      } catch (error) {
        this.logger.error(
          { err: error },
          "Failed to initialize SubscriptionService",
        );
      }
    });

    // Handle reconnection - only reload subscribers
    dbEvents.on("reconnected", async () => {
      try {
        await this.initializeTimeZoneManager();
        this.logger.info("Reloaded subscribers after reconnection");
      } catch (error) {
        this.logger.error(
          { err: error },
          "Failed to reload subscribers after reconnection",
        );
      }
    });

    // Handle database disconnection
    dbEvents.on("disconnected", () => {
      this.logger.warn(
        "Database disconnected, service may be temporarily unavailable",
      );
    });
  }

  private async tryUpdateDailyTemplate(): Promise<void> {
    try {
      await this.updateTodaysMessageTemplates();
      this.logger.info("Today's message templates updated successfully");
    } catch (error) {
      this.logger.error("Error updating today's message templates:", error);
    }
  }

  private async startDailyTemplateUpdate(): Promise<void> {
    if (this.templateRefreshInterval) {
      clearInterval(this.templateRefreshInterval);
    }
    this.logger.info(
      "Starting daily template update interval for today's message templates",
    );
    this.templateRefreshInterval = setInterval(
      this.tryUpdateDailyTemplate,
      24 * 60 * 60 * 1000,
    ); // Update every 24 hours
  }

  // Initialize TimeZoneManager with all active subscribers
  private async initializeTimeZoneManager(): Promise<void> {
    try {
      const subscribers = await this.getAllActiveSubscribers();
      if (!Array.isArray(subscribers)) {
        throw new Error(
          "Invalid response from database: subscribers not an array",
        );
      }

      this.timeZoneManager.initializeWithSubscribers(subscribers);
      this.logger.info(
        `TimeZoneManager initialized with ${subscribers.length} subscribers`,
      );
    } catch (error) {
      this.logger.error({ err: error }, "Failed to initialize TimeZoneManager");
      throw error;
    }
  }

  // Create new subscription
  async newSubscription(data: Partial<Subscriber>): Promise<Subscriber> {
    const existingSubscriber = await subscriberRepository.findByEmail(
      data.email!,
    );
    if (existingSubscriber) {
      throw new Error("Email already registered");
    }
    const subscriber = await subscriberRepository.create(data);
    if (subscriber.isActive) {
      this.timeZoneManager.addOrUpdateSubscriber(subscriber);
    }
    return subscriber;
  }

  // Send activation email
  async sendActivationEmail(subscriber: Subscriber): Promise<void> {
    const activationLink = `${env.APP_URL}/activate/${subscriber._id}/${subscriber.token}`;

    const email = emailTemplateManager.getEmailForSubscriber(
      subscriber,
      "activation",
      {
        activationLink,
      },
    );

    await sendEmail({
      to: [subscriber.email],
      subject: email.subject,
      html: email.html,
    });
  }

  // Validate token by user ID
  async validateTokenByUserId(
    id: string,
    token: string,
  ): Promise<Subscriber | null> {
    return await subscriberRepository.validateTokenOperation(id, token);
  }

  // Get subscriber
  async getSubscriber(id: string): Promise<Subscriber | null> {
    return await subscriberRepository.findById(id);
  }

  // Get all active subscribers
  async getAllActiveSubscribers(): Promise<Subscriber[]> {
    return await subscriberRepository.findAllActive();
  }

  // Activate subscription
  async activateSubscription(
    id: string,
    token: string,
  ): Promise<Subscriber | null> {
    this.logger.info(
      `[Service] Attempting to activate subscription. ID: ${id}, Token: ${token}`,
    );
    const subscriber = await this.validateTokenByUserId(id, token);

    if (!subscriber) {
      this.logger.warn(
        "[Service] Activation failed: Token validation failed or expired",
      );
      return null;
    }

    if (subscriber.isActive) {
      this.logger.info(`[Service] Subscription ${id} is already active`);
      return subscriber;
    }

    // Generate new token with 1 year expiration
    const newToken = uuidv4();
    const tokenExpires = new Date();
    tokenExpires.setFullYear(tokenExpires.getFullYear() + 1);

    this.logger.info(
      `[Service] Updating subscription ${id} with new token: ${newToken}`,
    );
    const updatedSubscriber = await subscriberRepository.update(id, {
      isActive: true,
      token: newToken,
      tokenExpires,
    });

    if (updatedSubscriber) {
      // Add to time zone manager
      this.timeZoneManager.addOrUpdateSubscriber(updatedSubscriber);
    }

    return updatedSubscriber;
  }

  // Cancel subscription
  async cancelSubscription(
    id: string,
    token: string,
  ): Promise<Subscriber | null> {
    const subscriber = await this.validateTokenByUserId(id, token);
    if (!subscriber) return null;

    const updated = await subscriberRepository.update(id, {
      isActive: false,
    });

    if (updated) {
      // Remove from time zone manager
      this.timeZoneManager.removeSubscriber(id);

      const email = emailTemplateManager.getEmailForSubscriber(
        subscriber,
        "cancellation",
      );
      await sendEmail({
        to: [updated.email],
        subject: email.subject,
        html: email.html,
      });
    }

    return updated;
  }

  // Suspend subscription
  async suspendSubscriptionByDays(
    id: string,
    token: string,
    days: number,
  ): Promise<Subscriber | null> {
    const subscriber = await this.validateTokenByUserId(id, token);
    if (!subscriber) return null;

    const suspendUntil = new Date();
    suspendUntil.setDate(suspendUntil.getDate() + days);

    const updated = await subscriberRepository.update(id, {
      isActive: false,
      tokenExpires: suspendUntil,
    });

    if (updated) {
      const email = emailTemplateManager.getEmailForSubscriber(
        subscriber,
        "suspension",
        {
          days,
        },
      );
      await sendEmail({
        to: [updated.email],
        subject: email.subject,
        html: email.html,
      });
    }

    return updated;
  }

  // Send daily notification
  async sendDailyNotification(subscriber: Subscriber): Promise<void> {
    if (!subscriber.isActive) return;

    const template = this.todaysMessages[subscriber.preferredLanguage];
    const survivalDays = this.getUserSurvivalDays(subscriber.birthdate);
    const email = emailTemplateManager.getEmailForSubscriber(
      subscriber,
      "daily",
      {
        message: template
          .replace("${survival_days}", survivalDays.toString())
          .replace("${nickname}", subscriber.preferredName),
        survivalDays,
      },
    );

    try {
      await sendEmail({
        to: [subscriber.email],
        subject: email.subject,
        html: email.html,
      });

      await subscriberRepository.updateSentStatus(subscriber._id);

      // Update in memory
      this.timeZoneManager.addOrUpdateSubscriber({
        ...subscriber,
        hasSent: true,
        sentCount: subscriber.sentCount + 1,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send daily notification to ${subscriber.email}:`,
        error,
      );
      throw error;
    }
  }

  // Update today's message templates
  private async updateTodaysMessageTemplates(): Promise<void> {
    const languagePromises = Object.keys(this.todaysMessages).map(
      async (lang) => {
        const language = lang as Subscriber["preferredLanguage"];
        const prompt = this.getPromptByLanguage(language);
        let template = "";

        try {
          const response = await sendOpenAIRequest(prompt);
          template = response || "";
        } catch (error: any) {
          this.logger.error(
            `Error generating template for ${lang}:`,
            error.message,
            "Using fallback template",
          );
          template = this.getFallbackTemplateByLanguage(language);
        }

        this.todaysMessages[language] = template;
        this.logger.info(
          `Today's message template for ${lang} updated successfully`,
          template,
        );
      },
    );

    await Promise.all(languagePromises);
    this.logger.info(
      "All today's message templates have been updated successfully",
      this.todaysMessages,
    );
    // Removed resetDailySentFlags() call from here
  }

  // Reset daily sent flags for a specific time zone
  async resetAllFlags(): Promise<void> {
    try {
      // Reset in database
      await subscriberRepository.resetDailySentFlags();

      // Reset in memory for all time zones
      for (let offset = -12; offset <= 14; offset++) {
        this.timeZoneManager.resetGroupSentStatus(offset);
      }

      this.logger.info("[Service] Reset all daily sent flags successfully");
    } catch (error) {
      this.logger.error("[Service] Error resetting daily sent flags:", error);
      throw error;
    }
  }

  // Get prompt by language
  private getPromptByLanguage(
    language: Subscriber["preferredLanguage"],
  ): string {
    return (
      PROMPTS.find((item) => item["lang"] === language)?.prompt ||
      "Generate an inspirational message."
    );
  }

  // Get fallback template by language
  private getFallbackTemplateByLanguage(
    language: Subscriber["preferredLanguage"],
  ): string {
    console.log(FALLBACK_TEMPLATES);
    return (
      FALLBACK_TEMPLATES.find((item) => item["lang"] === language)?.template ||
      "Stay inspired! You've lived ${survival_days} days, ${nickname}!"
    );
  }

  // Calculate survival days
  private getUserSurvivalDays(from: Date): number {
    const today = new Date();
    const timeDiff = today.getTime() - from.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }
}

export const subscriptionService = SubscriptionService.getInstance();
