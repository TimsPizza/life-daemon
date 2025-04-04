import { Request, Response, NextFunction } from "express";
import {
  NewSubscriptionRequest,
  Subscriber,
  TokenOperationRequest,
} from "@/api/subscription/model";
import { subscriptionService } from "@/api/subscription/service";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { StatusCodes } from "http-status-codes";
import cron from "node-cron";
import { v4 as uuidv4 } from "uuid";
import pino from "pino";

class SubscriptionController {
  // Cron jobs table for managing notifications
  private cronJobs: Map<string, cron.ScheduledTask>;
  private logger: pino.Logger;

  constructor() {
    this.cronJobs = new Map();
    this.logger = pino({
      name: "SubscriptionController",
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
    this.initializeCronJobs();
    this.scheduleDailyReset(); // Add daily reset job
  }

  // Schedule the daily flag reset job
  private scheduleDailyReset() {
    // Runs daily at 00:01 UTC
    cron.schedule(
      "1 0 * * *",
      async () => {
        this.logger.info("Running daily reset flags job...");
        try {
          await subscriptionService.resetAllFlags();
          this.logger.info("Daily flags reset successfully.");
        } catch (error) {
          this.logger.error("Error during daily flag reset:", error);
        }
      },
      {
        scheduled: true,
        timezone: "UTC",
      },
    );
    this.logger.info("Scheduled daily flag reset job for 00:01 UTC.");
  }

  // Initialize cron jobs for all active subscribers
  private async initializeCronJobs() {
    try {
      const subscribers = await subscriptionService.getAllActiveSubscribers();
      subscribers.forEach((subscriber) => {
        this.scheduleSubscriberNotification(subscriber);
      });
    } catch (error) {
      console.error("Failed to initialize cron jobs:", error);
    }
  }

  // Schedule notification for a single subscriber
  private scheduleSubscriberNotification(subscriber: Subscriber) {
    // Calculate local 6 AM for subscriber's timezone
    const adjustedHour = (6 + subscriber.timeOffset + 24) % 24;

    // Create cron job that runs at a random minute between 6 AM - 12 PM local time (UTC based)
    const job = cron.schedule(
      `${Math.floor(Math.random() * 60)} ${adjustedHour}-${adjustedHour + 6} * * *`,
      async () => {
        this.logger.info(
          `Cron job triggered for ${subscriber.email} (ID: ${subscriber._id})`,
        );
        try {
          // Re-fetch subscriber state before sending
          const currentSubscriber = await subscriptionService.getSubscriber(
            subscriber._id,
          );
          if (currentSubscriber?.isActive && !currentSubscriber.hasSent) {
            await subscriptionService.sendDailyNotification(currentSubscriber);
            this.logger.info(
              `Notification attempt successful for ${currentSubscriber.email}`,
            );
          } else if (!currentSubscriber) {
            this.logger.warn(
              `Subscriber ${subscriber._id} not found, skipping notification.`,
            );
            // Optionally remove the cron job if the user is deleted
            this.stopAndRemoveJob(subscriber._id);
          } else {
            this.logger.info(
              `Skipping notification for ${subscriber.email} (inactive: ${!currentSubscriber.isActive}, already sent: ${currentSubscriber.hasSent})`,
            );
          }
        } catch (error) {
          this.logger.error(
            `Failed to process notification job for ${subscriber.email}:`,
            error,
          );
        }
      },
      {
        scheduled: true,
        timezone: "UTC", // Explicitly set timezone to UTC
      },
    );

    this.cronJobs.set(subscriber._id, job);
    this.logger.info(
      `Scheduled notification job for ${subscriber.email} (ID: ${subscriber._id}) to run between ${adjustedHour}:00-${adjustedHour + 6}:59 UTC`,
    );
  }

  // Create new subscription
  async createNewSubscription(
    req: Request<{}, {}, NewSubscriptionRequest>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const subscriptionData = req.body;

      // Generate token and set expiration
      const token = uuidv4();
      const tokenExpires = new Date();
      tokenExpires.setHours(tokenExpires.getHours() + 24); // 24 hours expiration

      const subscriber = await subscriptionService.newSubscription({
        ...subscriptionData,
        token,
        tokenExpires,
        subscriptionDate: new Date(),
        isActive: false,
        sentCount: 0,
        hasSent: false,
      });
      this.logger.info(
        `New subscription created for ${subscriber.email} with token ${token}`,
      );

      // Send activation email
      await subscriptionService.sendActivationEmail(subscriber);

      // Return success response with subscriber data
      return res.status(StatusCodes.CREATED).json(
        ServiceResponse.success(
          "Subscription created successfully. Please check your email for activation.",
          {
            isActive: subscriber.isActive,
            email: subscriber.email,
            _id: subscriber._id,
            token: subscriber.token,
          },
        ),
      );
    } catch (error) {
      next(error);
    }
  }

  // Activate subscription
  async activateSubscription(
    req: Request<TokenOperationRequest>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id, token } = req.params;

      const subscriber = await subscriptionService.activateSubscription(
        id,
        token,
      );

      if (subscriber) {
        this.scheduleSubscriberNotification(subscriber);

        return res.status(StatusCodes.OK).json(
          ServiceResponse.success("Subscription activated successfully", {
            isActive: true,
            email: subscriber.email,
            operation: "activated" as const,
          }),
        );
      }

      return res.status(StatusCodes.BAD_REQUEST).json(
        ServiceResponse.failure("Invalid or expired activation link", {
          isActive: false,
          email: "",
          operation: "activated" as const,
        }),
      );
    } catch (error) {
      next(error);
    }
  }

  // Get subscription status
  async getSubscriptionStatus(
    req: Request<TokenOperationRequest>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id, token } = req.params;

      const subscriber = await subscriptionService.validateTokenByUserId(
        id,
        token,
      );

      if (subscriber) {
        return res.status(StatusCodes.OK).json(
          ServiceResponse.success("Subscription status retrieved", {
            isActive: subscriber.isActive,
            email: subscriber.email,
            subscriptionDate: subscriber.subscriptionDate,
            lastSent: subscriber.hasSent ? new Date() : undefined,
          }),
        );
      }

      return res.status(StatusCodes.NOT_FOUND).json(
        ServiceResponse.failure("Invalid subscription or token", {
          isActive: false,
          email: "",
          subscriptionDate: new Date(),
        }),
      );
    } catch (error) {
      next(error);
    }
  }

  // Cancel subscription
  async cancelSubscription(
    req: Request<TokenOperationRequest>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id, token } = req.params;

      const subscriber = await subscriptionService.cancelSubscription(
        id,
        token,
      );

      if (subscriber) {
        // Stop and remove the cron job
        this.stopAndRemoveJob(id);

        return res.status(StatusCodes.OK).json(
          ServiceResponse.success("Subscription cancelled successfully", {
            isActive: false,
            email: subscriber.email,
            operation: "unsubscribed" as const,
          }),
        );
      }

      return res.status(StatusCodes.BAD_REQUEST).json(
        ServiceResponse.failure("Invalid unsubscribe request", {
          isActive: false,
          email: "",
          operation: "unsubscribed" as const,
        }),
      );
    } catch (error) {
      next(error);
    }
  }

  // Suspend subscription
  async suspendSubscription(
    req: Request<TokenOperationRequest, {}, { days: number }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id, token } = req.params;
      const { days } = req.body;

      const subscriber = await subscriptionService.suspendSubscriptionByDays(
        id,
        token,
        days,
      );

      if (subscriber) {
        // Temporarily stop the cron job
        const job = this.cronJobs.get(id);
        if (job) {
          job.stop();
          this.logger.info(`Temporarily stopped job for suspended user ${id}`);
          // Note: Resuming suspended jobs automatically after server restart is not handled here.
          // A more robust solution might involve storing suspension end dates and checking on startup.
        }

        return res.status(StatusCodes.OK).json(
          ServiceResponse.success(`Subscription suspended for ${days} days`, {
            isActive: false,
            email: subscriber.email,
            operation: "suspended" as const,
          }),
        );
      }

      return res.status(StatusCodes.BAD_REQUEST).json(
        ServiceResponse.failure("Invalid suspension request", {
          isActive: false,
          email: "",
          operation: "suspended" as const,
        }),
      );
    } catch (error) {
      next(error);
    }
  }

  // Helper to stop and remove a cron job
  private stopAndRemoveJob(id: string) {
    const job = this.cronJobs.get(id);
    if (job) {
      job.stop();
      this.cronJobs.delete(id);
      this.logger.info(`Stopped and removed cron job for ID: ${id}`);
    }
  }
}

export const subscriptionController = new SubscriptionController();
