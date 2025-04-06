import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add error handling
window.addEventListener('error', (event) => {
  console.error('Global error handler:', event.error);
});

// Log when the app starts loading
console.log('Main.tsx is executing - starting application...');

const rootElement = document.getElementById("root");
if (rootElement) {
  console.log('Root element found, rendering app...');
  createRoot(rootElement).render(<App />);
} else {
  console.error('Root element not found! HTML structure might be incorrect.');
}
