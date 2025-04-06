import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// More verbose logging
console.log('===== APPLICATION STARTUP =====');
console.log('Main.tsx is executing - starting application...');

try {
  // Error handlers
  window.addEventListener('error', (event) => {
    console.error('GLOBAL ERROR:', event.error);
    // Display error on page if possible
    const errorDiv = document.createElement('div');
    errorDiv.style.color = 'red';
    errorDiv.style.padding = '20px';
    errorDiv.style.margin = '20px';
    errorDiv.style.border = '2px solid red';
    errorDiv.textContent = `Error: ${event.error?.message || 'Unknown error'}`;
    document.body.prepend(errorDiv);
  });

  // Log DOM state
  console.log('Document ready state:', document.readyState);
  console.log('Body exists:', !!document.body);
  
  const rootElement = document.getElementById("root");
  console.log('Root element found:', !!rootElement);
  
  if (rootElement) {
    console.log('Attempting to render app...');
    createRoot(rootElement).render(<App />);
    console.log('Render call completed');
  } else {
    console.error('Root element not found!');
    // Try to display a visible error
    if (document.body) {
      const errorMessage = document.createElement('div');
      errorMessage.style.color = 'red';
      errorMessage.style.padding = '20px';
      errorMessage.textContent = 'Root element not found!';
      document.body.appendChild(errorMessage);
    }
  }
} catch (err) {
  console.error('CRITICAL ERROR IN MAIN.TSX:', err);
  // Try to display the error
  if (document.body) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    document.body.innerHTML = `<div style="color:red;padding:20px;">Critical error: ${errorMessage}</div>`;
  }
}
