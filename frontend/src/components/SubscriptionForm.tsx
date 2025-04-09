import React, { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { subscriptionApi } from "@/api/subscription";
import type { SubscriptionRequest } from "@/api/types";

const SubscriptionForm: React.FC = () => {
  const { t, i18n } = useTranslation(); // Add useTranslation hook
  // Map browser language code to supported language code
  const mapLanguageCode = (code: string): 'en' | 'fr' | 'cn' | 'jp' => {
    const languageMap: { [key: string]: 'en' | 'fr' | 'cn' | 'jp' } = {
      zh: 'cn',
      'zh-CN': 'cn',
      'zh-TW': 'cn',
      'zh-HK': 'cn',
      ja: 'jp',
      fr: 'fr',
      en: 'en'
    };
    return languageMap[code] || 'en';
  };

  const [formData, setFormData] = useState<SubscriptionRequest>({
    preferredName: "",
    email: "",
    birthdate: "",
    preferredLanguage: mapLanguageCode(i18n.language), // Initialize with mapped language code
    timeOffset: 0,
  });
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-detect timezone offset on component mount
  useEffect(() => {
    const getTimezoneOffset = () => {
      const offsetMinutes = new Date().getTimezoneOffset();
      return -offsetMinutes / 60;
    };
    setFormData((prev) => ({ ...prev, timeOffset: getTimezoneOffset() }));
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "timeOffset" ? parseInt(value, 10) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await subscriptionApi.createSubscription({
        ...formData,
        birthdate: new Date(formData.birthdate).toISOString(),
      });

      if (response.success && response.responseObject) {
        const details = [
          response.message, // Backend message might already be translated
          t('activationSuccessMessage'), // Generic success part
          '',
          `Subscription ID: ${response.responseObject._id}`,
          `Email: ${response.responseObject.email}`,
          response.responseObject.subscriptionDate ? `Created: ${new Date(response.responseObject.subscriptionDate).toLocaleString()}` : '',
        ]
          .filter(Boolean)
          .join("\n");

        setMessage({
          type: "success",
          text: details,
        });

        // Reset form
        setFormData({
          preferredName: "",
          email: "",
          birthdate: "",
          preferredLanguage: mapLanguageCode(i18n.language),
          timeOffset: new Date().getTimezoneOffset() / -60,
        });
      } else {
         // Handle potential case where response is success=true but no data
         throw new Error(response.message || t('activationFailedMessage'));
      }
    } catch (error: any) {
      setMessage({
        type: "error",
        text: `${t('errorPrefix')}: ${error.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-10 max-w-md rounded-lg bg-white p-8 shadow-md">
      <h1 className="mb-2 text-center text-2xl font-bold text-gray-800">
        {t('subscribeTitle')}
      </h1>
      <p className="mb-6 text-center text-gray-600">
        {t('subscribeDescription')}
      </p>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            htmlFor="preferredName"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            {t('preferredNameLabel')}
          </label>
          <input
            type="text"
            id="preferredName"
            name="preferredName"
            value={formData.preferredName}
            onChange={handleChange}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            {t('emailLabel')}
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="birthdate"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            {t('birthdateLabel')}
          </label>
          <input
            type="date"
            id="birthdate"
            name="birthdate"
            value={formData.birthdate}
            onChange={handleChange}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="preferredLanguage"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            {t('preferredLanguageLabel')}
          </label>
          <select
            id="preferredLanguage"
            name="preferredLanguage"
            value={formData.preferredLanguage}
            onChange={handleChange}
            required
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
          >
            <option value="en">{t('lang_en')}</option>
            <option value="fr">{t('lang_fr')}</option>
            <option value="cn">{t('lang_cn')}</option>
            <option value="jp">{t('lang_jp')}</option>
          </select>
        </div>
        <div className="mb-6">
          <label
            htmlFor="timeOffset"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            {t('timezoneOffsetLabel')}
          </label>
          <input
            type="number"
            id="timeOffset"
            name="timeOffset"
            min="-12"
            max="14"
            step="1"
            value={formData.timeOffset}
            onChange={handleChange}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            {t('timezoneOffsetHelp')}
          </p>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? t('subscribingButton') : t('subscribeButton')}
        </button>
      </form>
      {message && (
        <div
          className={`mt-4 whitespace-pre-line rounded-md p-3 text-sm font-medium ${
            message.type === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
};

export default SubscriptionForm;
