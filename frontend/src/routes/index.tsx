import SubscriptionForm from "@/components/SubscriptionForm";
import Layout from "@/routes/Layout";
import ActivationPage from "@/components/ActivationPage"; // Import the ActivationPage component
import { createBrowserRouter, RouteObject } from "react-router-dom";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Layout />,
    children: [
      // Add other routes here if needed
      {
        path: "/subscribe", // Define the path for the subscription form
        element: <SubscriptionForm />, // Render the SubscriptionForm component
      },
      {
        path: "/activate/:id/:token",
        element: <ActivationPage />, // Use the ActivationPage component
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
