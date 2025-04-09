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

  // Convert markdown to HTML while preserving emojis
  private convertMarkdownToHtml(markdown: string): string {
    // Escape HTML special characters except for emojis
    const escapeHtml = (text: string) => {
      const htmlChars: Record<string, string> = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      };
      // Use negative lookahead to avoid escaping emoji characters
      return text.replace(/[&<>"'](?![^\\u0000-\\u007F])/g, char => htmlChars[char] || char);
    };

    let html = escapeHtml(markdown);

    // Convert markdown to HTML
    // Bold: Convert **text** to <strong>text</strong>
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Italic: Convert *text* to <em>text</em>, but only if it's not part of an emoji
    html = html.replace(/\*([^*\n]+)\*/g, (match, p1) => {
      // Check if the match is likely part of an emoji sequence
      if (p1.match(/[^\u0000-\u007F]/)) {
        return match; // Keep original if it contains emoji
      }
      return `<em>${p1}</em>`;
    });

    // Convert newlines to <br>
    html = html.replace(/\n/g, "<br>");

    return html;
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
    
    // Convert markdown to HTML while preserving emojis
    const formattedMessage = this.convertMarkdownToHtml(message);

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
