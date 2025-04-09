import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import "@/styles/tailwind.output.css";
import '@/index.css';
import '@/i18n/config'; // Import and initialize i18n
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
