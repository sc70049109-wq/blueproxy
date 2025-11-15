// backend/server.js
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import cors from "cors";

const app = express();
const PORT = 8080;

// Enable CORS if needed
app.use(cors());

// Simple API to encode URL
app.get("/proxy", (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send("Missing 'url' query param");
  res.redirect(`/r/${encodeURIComponent(url)}`);
});

// Proxy route
app.use("/r/:url(*)", (req, res, next) => {
  const targetUrl = decodeURIComponent(req.params.url);

  // Use http-proxy-middleware
  createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    selfHandleResponse: false, // Let the proxy handle streaming
    secure: false,
  })(req, res, next);
});

// Start server
app.listen(PORT, () => {
  console.log(`BlueProxy backend running at http://localhost:${PORT}`);
});
