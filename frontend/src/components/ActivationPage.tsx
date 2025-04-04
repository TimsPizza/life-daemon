import React, { useState, useEffect, useRef } from "react"; // Import useRef
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { subscriptionApi } from "@/api/subscription";

const ActivationPage: React.FC = () => {
  const { t } = useTranslation();
  const { id, token } = useParams<{ id: string; token: string }>();
  const navigate = useNavigate();
  const effectRan = useRef(false); // Ref to track effect execution
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Prevent double execution in StrictMode (development only)
    if (import.meta.env.DEV && effectRan.current) {
      return;
    }
    effectRan.current = true; // Mark effect as run

    const activateSubscription = async () => {
      if (!id || !token) {
        setMessage({ type: "error", text: t("activationInvalidLinkMessage") });
        setIsLoading(false);
        return;
      }

      try {
        const response = await subscriptionApi.activateSubscription(id, token);
        if (response.success) {
          setMessage({
            type: "success",
            text: response.message || t("activationSuccessMessage"),
          });
          // Optionally redirect after a delay
          setTimeout(() => navigate("/"), 3000);
        } else {
          throw new Error(response.message || t("activationFailedMessage"));
        }
      } catch (error: any) {
        setMessage({
          type: "error",
          text: `${t("errorPrefix")}: ${error.message}`,
        });
      } finally {
        setIsLoading(false);
      }
    };

    activateSubscription();
  }, [id, token, navigate, t]); // Add t to dependency array

  return (
    <div className="mx-auto mt-10 max-w-md rounded-lg bg-white p-8 text-center shadow-md">
      <h1 className="mb-4 text-2xl font-bold text-gray-800">
        {t("activationTitle")}
      </h1>
      {isLoading && <p className="text-gray-600">{t("activatingMessage")}</p>}
      {message && (
        <div
          className={`mt-4 rounded-md p-3 text-sm font-medium ${
            message.type === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message.text}
          {message.type === "success" && (
            <p className="mt-2 text-xs">{t("redirectingMessage")}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ActivationPage;
