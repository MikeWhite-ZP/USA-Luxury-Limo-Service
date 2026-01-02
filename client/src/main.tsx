import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { i18nInitPromise } from "./lib/i18n";

i18nInitPromise.then(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('Service Worker registered successfully:', registration.scope);
      })
      .catch((error) => {
        console.log('Service Worker registration failed:', error);
      });
  });
}
