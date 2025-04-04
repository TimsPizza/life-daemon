import { Subscriber } from "@/api/subscription/model";
import { subscriberRepository } from "@/api/subscription/repository";
import { sendEmail } from "@/common/utils/email";
import { sendOpenAIRequest } from "@/common/utils/openai";
import { readFallbackTemplates, readPrompts } from "@/common/utils/prompts";
import { emailTemplateManager } from "@/common/templates/emails";
import { env } from "@/common/utils/envConfig";
import pino from "pino";
import { v4 as uuidv4 } from "uuid";

const PROMPTS = readPrompts();
const FALLBACK_TEMPLATES = readFallbackTemplates();

class SubscriptionService {
  private logger: pino.Logger;
  private todaysMessages: Record<Subscriber["preferredLanguage"], string>;

  constructor() {
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

    this.updateTodaysMessageTemplates();
  }

  // Create new subscription
  async newSubscription(data: Partial<Subscriber>): Promise<Subscriber> {
    const existingSubscriber = await subscriberRepository.findByEmail(
      data.email!,
    );
    if (existingSubscriber) {
      throw new Error("Email already registered");
    }
    return await subscriberRepository.create(data);
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
    const subscriber = await this.validateTokenByUserId(id, token);
    if (!subscriber) return null;

    // Generate new token with 1 year expiration
    const newToken = uuidv4();
    const tokenExpires = new Date();
    tokenExpires.setFullYear(tokenExpires.getFullYear() + 1);

    return await subscriberRepository.update(id, {
      isActive: true,
      token: newToken,
      tokenExpires,
    });
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
    if (!subscriber.isActive || subscriber.hasSent) return;

    const template = this.todaysMessages[subscriber.preferredLanguage];
    const survivalDays = this.getUserSurvivalDays(subscriber.birthdate);
    const email = emailTemplateManager.getEmailForSubscriber(
      subscriber,
      "daily",
      {
        message: template,
        survivalDays,
      },
    );

    await sendEmail({
      to: [subscriber.email],
      subject: email.subject,
      html: email.html,
    });

    await subscriberRepository.updateSentStatus(subscriber._id);
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
        } catch (error) {
          this.logger.error(
            `Error generating template for ${lang}:`,
            error,
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
    await subscriberRepository.resetDailySentFlags();
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

export const subscriptionService = new SubscriptionService();
