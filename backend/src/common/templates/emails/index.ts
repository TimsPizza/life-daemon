import { activationEmailTemplates } from "./activation";
import { cancellationEmailTemplates } from "./cancellation";
import { suspensionEmailTemplates } from "./suspension";
import { dailyNotificationEmailTemplates } from "./dailyNotification";
import { Subscriber } from "@/api/subscription/model";

export type EmailTemplate = {
  subject: string;
  html: string;
};

export type SupportedLanguage = "en" | "fr" | "cn" | "jp";

class EmailTemplateManager {
  private getTemplateForLanguage<T>(
    templates: Record<SupportedLanguage, T>,
    language: SupportedLanguage,
  ): T {
    return templates[language] || templates["en"]; // Fallback to English if language not found
  }

  getActivationEmail(
    activationLink: string,
    language: SupportedLanguage,
  ): EmailTemplate {
    const template = this.getTemplateForLanguage(
      activationEmailTemplates,
      language,
    );
    return {
      subject: template.subject,
      html: template.html(activationLink),
    };
  }

  getCancellationEmail(language: SupportedLanguage): EmailTemplate {
    const template = this.getTemplateForLanguage(
      cancellationEmailTemplates,
      language,
    );
    return {
      subject: template.subject,
      html: template.html(),
    };
  }

  getSuspensionEmail(days: number, language: SupportedLanguage): EmailTemplate {
    const template = this.getTemplateForLanguage(
      suspensionEmailTemplates,
      language,
    );
    return {
      subject: template.subject,
      html: template.html(days),
    };
  }

  getDailyNotificationEmail(
    message: string,
    survivalDays: number,
    language: SupportedLanguage,
  ): EmailTemplate {
    const template = this.getTemplateForLanguage(
      dailyNotificationEmailTemplates,
      language,
    );
    // Replace newline characters with HTML line breaks
    const formattedMessage = message.replace(/\n/g, "<br>");
    return {
      subject: template.subject,
      html: template
        .html(formattedMessage, survivalDays)
        .replace("${survival_days}", survivalDays.toString()),
    };
  }

  // Helper method to get email with subscriber's preferred language
  getEmailForSubscriber(
    subscriber: Subscriber,
    type: "activation" | "cancellation" | "suspension" | "daily",
    params?: {
      activationLink?: string;
      days?: number;
      message?: string;
      survivalDays?: number;
    },
  ): EmailTemplate {
    const language = subscriber.preferredLanguage;

    switch (type) {
      case "activation":
        if (!params?.activationLink)
          throw new Error("Activation link is required");
        return this.getActivationEmail(params.activationLink, language);

      case "cancellation":
        return this.getCancellationEmail(language);

      case "suspension":
        if (!params?.days)
          throw new Error("Days is required for suspension email");
        return this.getSuspensionEmail(params.days, language);

      case "daily":
        if (!params?.message)
          throw new Error(
            "Message and survival days are required for daily notification",
          );
        return this.getDailyNotificationEmail(
          params.message,
          params.survivalDays ?? 0,
          language,
        );

      default:
        throw new Error(`Unsupported email type: ${type}`);
    }
  }
}

export const emailTemplateManager = new EmailTemplateManager();
