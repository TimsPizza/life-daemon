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

class SubscriptionController {
  // Cron jobs table for managing notifications
  private cronJobs: Map<string, cron.ScheduledTask>;

  constructor() {
    this.cronJobs = new Map();
    this.initializeCronJobs();
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

    // Create cron job that runs at a random minute between 6 AM - 12 PM local time
    const job = cron.schedule(
      `${Math.floor(Math.random() * 60)} ${adjustedHour}-${adjustedHour + 6} * * *`,
      async () => {
        try {
          await subscriptionService.sendDailyNotification(subscriber);
        } catch (error) {
          console.error(
            `Failed to send notification to ${subscriber.email}:`,
            error,
          );
        }
      },
    );

    this.cronJobs.set(subscriber._id, job);
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

      // Send activation email
      await subscriptionService.sendActivationEmail(subscriber);

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
        const job = this.cronJobs.get(id);
        if (job) {
          job.stop();
          this.cronJobs.delete(id);
        }

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

          // Resume after suspension period
          setTimeout(
            () => {
              if (this.cronJobs.has(id)) {
                job.start();
              }
            },
            days * 24 * 60 * 60 * 1000,
          );
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
}

export const subscriptionController = new SubscriptionController();
