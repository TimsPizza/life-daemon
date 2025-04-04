import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, {
  Router,
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from "express";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";

import {
  NewSubscriptionRequestSchema,
  TokenOperationRequestSchema,
  SubscriptionResponseSchema,
} from "@/api/subscription/model";
import { subscriptionController } from "@/api/subscription/controller";
import { validateRequest } from "@/common/utils/httpHandlers";
import { env } from "@/common/utils/envConfig";
import { handleProcessError } from "@/common/middleware/errorHandler";

export const subscriptionRegistry = new OpenAPIRegistry();
export const subscriptionRouter: Router = express.Router();

// Subscription specific rate limiter
const subscriptionRateLimit = rateLimit({
  windowMs: env.SUBSCRIPTION_RATE_LIMIT_WINDOW_MS,
  limit: env.SUBSCRIPTION_RATE_LIMIT_MAX_REQUESTS,
  message: "Too many requests. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Register schemas for OpenAPI documentation
subscriptionRegistry.register(
  "NewSubscriptionRequest",
  NewSubscriptionRequestSchema,
);
subscriptionRegistry.register("TokenOperation", TokenOperationRequestSchema);
subscriptionRegistry.register(
  "SubscriptionResponse",
  SubscriptionResponseSchema,
);

// Wrapper to handle async errors and bind 'this'
const asyncHandler = (
  fn: (
    req: Request<any, any, any>,
    res: Response,
    next: NextFunction,
  ) => Promise<any>,
): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn.call(subscriptionController, req, res, next)).catch(
      next,
    );
  };
};

// Create new subscription
subscriptionRouter.post(
  "/new",
  subscriptionRateLimit,
  validateRequest({
    schema: NewSubscriptionRequestSchema,
    location: "body",
  }),
  asyncHandler(subscriptionController.createNewSubscription),
  handleProcessError
);

// Activate subscription
subscriptionRouter.get(
  "/activate/:id/:token",
  validateRequest({
    schema: TokenOperationRequestSchema,
    location: "params",
  }),
  asyncHandler(subscriptionController.activateSubscription),
);

// Get subscription status
subscriptionRouter.get(
  "/status/:id/:token",
  subscriptionRateLimit,
  validateRequest({
    schema: TokenOperationRequestSchema,
    location: "params",
  }),
  asyncHandler(subscriptionController.getSubscriptionStatus),
);

// Cancel subscription
subscriptionRouter.post(
  "/unsubscribe/:id/:token",
  subscriptionRateLimit,
  validateRequest({
    schema: TokenOperationRequestSchema,
    location: "params",
  }),
  asyncHandler(subscriptionController.cancelSubscription),
);

// Suspend subscription
const suspendBodySchema = z
  .object({
    days: z.number().int().positive(),
  })
  .strict();

subscriptionRouter.post(
  "/suspend/:id/:token",
  subscriptionRateLimit,
  validateRequest({
    schema: TokenOperationRequestSchema,
    location: "params",
  }),
  validateRequest({
    schema: suspendBodySchema,
    location: "body",
  }),
  asyncHandler(subscriptionController.suspendSubscription),
  handleProcessError
);
