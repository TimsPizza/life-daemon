import { Request, Response, NextFunction } from "express";
import {
  NewSubscriptionRequest,
  Subscriber,
  TokenOperationRequest,
} from "@/api/subscription/model";
import { subscriptionService } from "@/api/subscription/service";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { StatusCodes } from "http-status-codes";
import { v4 as uuidv4 } from "uuid";
import pino from "pino";

class SubscriptionController {
  private logger: pino.Logger;

  constructor() {
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
