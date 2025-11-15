// frontend/src/index.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css"; // optional, in case you want global styles

// Find the root div in your HTML
const container = document.getElementById("root");
const root = createRoot(container);

// Render the App
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
