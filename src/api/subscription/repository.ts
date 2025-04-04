import { Subscriber } from "@/api/subscription/model";
import mongoose from "mongoose";

export const SubscriberSchema = new mongoose.Schema<Subscriber>({
  preferredName: {
    type: String,
    required: true,
    trim: true,
  },
  preferredLanguage: {
    type: String,
    required: true,
    enum: ["en", "fr", "cn", "jp"],
  },
  timeOffset: {
    type: Number,
    required: true,
    min: -12,
    max: 14,
  },
  birthdate: {
    type: Date,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  subscriptionDate: {
    type: Date,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  token: {
    type: String,
    required: true,
    index: true,
  },
  tokenExpires: {
    type: Date,
    required: true,
    index: true,
  },
  sentCount: {
    type: Number,
    default: 0,
  },
  hasSent: {
    type: Boolean,
    default: false,
  },
});

// Create compound index for token operations
SubscriberSchema.index({ token: 1, tokenExpires: 1 });
SubscriberSchema.index({ email: 1 }, { unique: true });
SubscriberSchema.index({ isActive: 1, timeOffset: 1 });

export const SubscriberModel = mongoose.model<Subscriber>(
  "Subscriber",
  SubscriberSchema,
);

class SubscriberRepository {
  // Create new subscriber
  async create(subscriber: Partial<Subscriber>): Promise<Subscriber> {
    const newSubscriber = new SubscriberModel(subscriber);
    return await newSubscriber.save();
  }

  // Find by ID
  async findById(id: string): Promise<Subscriber | null> {
    return await SubscriberModel.findById(id).exec();
  }

  // Find by email
  async findByEmail(email: string): Promise<Subscriber | null> {
    return await SubscriberModel.findOne({
      email: email.toLowerCase().trim(),
    }).exec();
  }

  // Find all active subscribers
  async findAllActive(): Promise<Subscriber[]> {
    return await SubscriberModel.find({
      isActive: true,
    }).exec();
  }

  // Validate token operation
  async validateTokenOperation(
    id: string,
    token: string,
  ): Promise<Subscriber | null> {
    return await SubscriberModel.findOne({
      _id: id,
      token: token,
      tokenExpires: { $gt: new Date() },
    }).exec();
  }

  // Update token
  async refreshToken(
    id: string,
    token: string,
    tokenExpires: Date,
  ): Promise<Subscriber | null> {
    return await SubscriberModel.findByIdAndUpdate(
      id,
      {
        $set: {
          token,
          tokenExpires,
        },
      },
      { new: true },
    ).exec();
  }

  // Update subscriber
  async update(
    id: string,
    update: Partial<Subscriber>,
  ): Promise<Subscriber | null> {
    return await SubscriberModel.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true },
    ).exec();
  }

  // Find subscribers by time offset for notification
  async findActiveByTimeOffset(offset: number): Promise<Subscriber[]> {
    return await SubscriberModel.find({
      timeOffset: offset,
      isActive: true,
      hasSent: false,
    }).exec();
  }

  // Update sent status
  async updateSentStatus(id: string): Promise<Subscriber | null> {
    return await SubscriberModel.findByIdAndUpdate(
      id,
      {
        $set: { hasSent: true },
        $inc: { sentCount: 1 },
      },
      { new: true },
    ).exec();
  }

  // Reset all daily sent flags
  async resetDailySentFlags(): Promise<void> {
    await SubscriberModel.updateMany(
      { hasSent: true },
      { $set: { hasSent: false } },
    ).exec();
  }
}

export const subscriberRepository = new SubscriberRepository();
