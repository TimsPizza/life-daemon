import mongoose, { mongo } from "mongoose";
import pino from "pino";
import { env } from "./envConfig";
const logger = pino({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  },
});
export const connectDB = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI as string);
    logger.info("MongoDB connected successfully");
  } catch (error) {
    logger.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

mongoose.connection.on("error", (error) => {
  logger.error("MongoDB connection error:", error);
});

mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB disconnected");
});

process.on("SIGINT", async () => {
  try {
    await mongoose.connection.close();
    logger.info("MongoDB connection closed through app termination");
    process.exit(0);
  } catch (error) {
    logger.error("Error closing MongoDB connection:", error);
    process.exit(1);
  }
});
