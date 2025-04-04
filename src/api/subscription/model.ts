import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { ServiceResponseSchema } from "@/common/models/serviceResponse";

extendZodWithOpenApi(z);

// Base Subscriber Schema
export const SubscriberZodSchema = z
  .object({
    _id: z.string(),
    preferredName: z.string().min(1, "Preferred name is required"),
    preferredLanguage: z.enum(["en", "fr", "cn", "jp"]),
    timeOffset: z.number().int().min(-12).max(14), // UTC offset in hours
    birthdate: z.date(),
    email: z.string().email("Invalid email format"),
    subscriptionDate: z.date(),
    isActive: z.boolean(), // if inactive, the subscription is cancelled
    token: z.string().uuid(), // Universal token for all operations
    tokenExpires: z.date(), // Token expiration date
    sentCount: z.number().default(0),
    hasSent: z.boolean().default(false),
  })
  .strict();

// Request Schemas
export const NewSubscriptionRequestSchema = z
  .object({
    preferredName: z.string().min(1, "Preferred name is required"),
    preferredLanguage: z.enum(["en", "fr", "cn", "jp"]),
    timeOffset: z.number().int().min(-12).max(14),
    birthdate: z.date(),
    email: z.string().email("Invalid email format"),
  })
  .strict();

// Token Operation Schema (for activation/unsubscribe operations)
export const TokenOperationRequestSchema = z
  .object({
    id: z.string(),
    token: z.string().uuid(),
  })
  .strict();

// Response Schemas
export const SubscriptionResponseSchema =
  ServiceResponseSchema(SubscriberZodSchema);

export const TokenOperationResponseSchema = ServiceResponseSchema(
  z.object({
    success: z.boolean(),
    email: z.string().email(),
    operation: z.enum(["activated", "unsubscribed", "suspended"]),
  }),
);

export const SubscriptionStatusSchema = ServiceResponseSchema(
  z.object({
    isActive: z.boolean(),
    email: z.string().email(),
    subscriptionDate: z.date(),
    lastSent: z.date().optional(),
  }),
);

// Type Definitions
export type Subscriber = z.infer<typeof SubscriberZodSchema>;
export type NewSubscriptionRequest = z.infer<
  typeof NewSubscriptionRequestSchema
>;
export type TokenOperationRequest = z.infer<typeof TokenOperationRequestSchema>;
export type SubscriptionResponse = z.infer<typeof SubscriptionResponseSchema>;
export type TokenOperationResponse = z.infer<
  typeof TokenOperationResponseSchema
>;
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>;
