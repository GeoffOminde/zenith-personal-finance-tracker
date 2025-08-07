// --- PATCH: Block any service worker that is not our local one ---
// This safeguard prevents the @google/genai SDK from attempting to register
// its own service workers from external origins, which would cause a security error.
// This code must run before any other modules, especially those importing @google/genai.
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  const originalRegister = navigator.serviceWorker.register.bind(navigator.serviceWorker);

  // Override the native register function.
  // The 'any' type is necessary because we are intentionally monkey-patching
  // a built-in browser API for security purposes.
  (navigator.serviceWorker as any).register = (scriptURL: string | URL, options?: any) => {
    // Resolve the scriptURL to a full URL for robust comparison.
    const registrationUrl = new URL(scriptURL, window.location.origin).href;
    const allowedUrl = new URL('/service-worker.js', window.location.origin).href;

    if (registrationUrl === allowedUrl) {
      // If the URL is our own service worker, proceed with the original function.
      return originalRegister(scriptURL, options);
    } else {
      // If it's an external URL, block it, log a warning, and return a rejected promise.
      const warningMessage = `[Zenith Safeguard] Blocked an attempt to register a service worker from an unauthorized URL: ${registrationUrl}`;
      console.warn(warningMessage);
      return Promise.reject(new Error('Registration of external service workers is not allowed.'));
    }
  };
}
// --- END PATCH ---

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);