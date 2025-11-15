// backend/server.js
import express from "express";
import { WebSocketServer } from "ws";

const app = express();
const HTTP_PORT = 3000;
const WS_PORT = 3001;

// Serve static files if needed
app.use(express.static("../frontend/dist"));

// Start HTTP server
app.listen(HTTP_PORT, () => {
  console.log(`HTTP server running on http://localhost:${HTTP_PORT}`);
});

// Start WebSocket server on its own port
const wss = new WebSocketServer({ port: WS_PORT });
console.log(`WebSocket server running on ws://localhost:${WS_PORT}`);

// Handle WebSocket connections
wss.on("connection", (ws) => {
  console.log("Client connected via WebSocket");

  ws.on("message", (message) => {
    console.log("Received:", message.toString());

    // Echo back for testing
    ws.send(JSON.stringify({ echo: message.toString() }));
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});
