import dotenv from "dotenv";
import { cleanEnv, host, num, port, str, testOnly, url } from "envalid";

dotenv.config();

export const env = cleanEnv(process.env, {
  NODE_ENV: str({
    devDefault: testOnly("test"),
    choices: ["development", "production", "test"],
  }),
  HOST: host({ devDefault: testOnly("localhost") }),
  PORT: port({ devDefault: testOnly(3000) }),
  APP_URL: url({
    devDefault: testOnly("http://localhost:3000"),
    desc: "Full URL of the application for email links",
  }),
  CORS_ORIGIN: str({ devDefault: testOnly("http://localhost:3000") }),
  COMMON_RATE_LIMIT_MAX_REQUESTS: num({ devDefault: testOnly(1000) }),
  COMMON_RATE_LIMIT_WINDOW_MS: num({ devDefault: testOnly(1000) }),
  SUBSCRIPTION_RATE_LIMIT_WINDOW_MS: num({
    devDefault: testOnly(1000),
  }),
  SUBSCRIPTION_RATE_LIMIT_MAX_REQUESTS: num({
    devDefault: testOnly(20),
  }),
  // MongoDB configuration
  MONGODB_URI: str({
    devDefault: testOnly("mongodb://localhost:27017/subscription"),
  }),
  // OpenAI API configuration
  OPENAI_API_KEY: str({
    devDefault: testOnly("sk-"),
  }),
  OPENAI_API_URL: str({
    devDefault: testOnly("https://api.openai.com/v1/chat/completions"),
  }),
  OPENAI_API_MODEL: str({
    devDefault: testOnly("gpt-4-turbo-preview"),
  }),

  // Mailgun configuration
  MAILGUN_API_KEY: str({
    devDefault: testOnly("key-"),
  }),
  MAILGUN_DOMAIN: str({
    devDefault: testOnly("example.com"),
  }),
});
