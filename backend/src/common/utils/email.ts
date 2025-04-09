import Mailgun from "mailgun.js";
import { env } from "@/common/utils/envConfig";
import formData from "form-data";
import pino from "pino";

const MAILGUN_API_KEY = env.MAILGUN_API_KEY!;
const MAILGUN_DOMAIN = env.MAILGUN_DOMAIN!;

const mailgun = new Mailgun(formData);
const client = mailgun.client({ username: "api", key: MAILGUN_API_KEY });

const logger = pino({
  name: "MailgunClient",
  level: "info",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
      ignore: "pid,hostname",
    },
  },
});

interface SendEmailParams {
  to: string[];
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  from = `Life Daemon <subscription@${MAILGUN_DOMAIN}>`,
}: SendEmailParams) {
  // does not throw an error if the email is invalid
  try {
    const result = await client.messages.create(MAILGUN_DOMAIN, {
      from: from,
      to: to,
      subject: subject,
      html: html,
    });

    logger.info(`[MAILGUN_SEND_SUCCESS] To ${to}`);
  } catch (error) {
    logger.error("[MAILGUN_SEND_ERROR] To ${to}", {
      error: error,
    });
  }
}
