// backend/server.js
import express from "express";
import { WebSocketServer } from "ws";
import http from "http";
import pkg from "wrtc";
const { RTCPeerConnection, RTCVideoSink, RTCVideoSource, RTCVideoFrame } = pkg;

const app = express();
const server = http.createServer(app);

// HTTP server
const PORT_HTTP = 3000;
server.listen(PORT_HTTP, () => {
  console.log(`HTTP server running on http://localhost:${PORT_HTTP}`);
});

// WebSocket server
const PORT_WS = 3001;
const wss = new WebSocketServer({ server, port: PORT_WS });
console.log(`WebSocket server running on ws://localhost:${PORT_WS}`);

wss.on("connection", (ws) => {
  console.log("Client connected via WebSocket");

  // Create WebRTC peer connection
  const pc = new RTCPeerConnection();

  // Optional: Video source for streaming dummy video or real frames
  const videoSource = new RTCVideoSource();
  const track = videoSource.createTrack();
  pc.addTrack(track);

  // Handle ICE candidates from the peer
  pc.onicecandidate = ({ candidate }) => {
    if (candidate) ws.send(JSON.stringify({ type: "ice", candidate }));
  };

  // Receive remote track (video from client)
  pc.ontrack = (event) => {
    console.log("Received remote track:", event.streams);
  };

  // Safe message parsing
  ws.on("message", async (message) => {
    let data;
    try {
      if (typeof message === "string") {
        data = JSON.parse(message);
      } else {
        data = message; // already object
      }
    } catch (err) {
      console.error("Failed to parse message:", message, err);
      return;
    }

    if (data.type === "offer") {
      await pc.setRemoteDescription(data);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      ws.send(JSON.stringify(answer));
    } else if (data.type === "ice") {
      try {
        await pc.addIceCandidate(data.candidate);
      } catch (err) {
        console.error("Error adding ICE candidate:", err);
      }
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    pc.close();
  });
});
