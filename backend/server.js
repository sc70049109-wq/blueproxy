// backend/server.js
import http from "http";
import WebSocket, { WebSocketServer } from "ws";
import { RTCPeerConnection, nonstandard } from "wrtc";

const { RTCVideoSource, RTCVideoFrame } = nonstandard;

// HTTP server (just for info, not serving files)
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("BlueProxy WebRTC Backend Running");
});

server.listen(3000, () => {
  console.log("HTTP server running on http://localhost:3000");
});

// WebSocket server for signaling
const wss = new WebSocketServer({ port: 3001 });
console.log("WebSocket server running on ws://localhost:3001");

wss.on("connection", (ws) => {
  console.log("Client connected via WebSocket");

  // Create a new peer connection per client
  const pc = new RTCPeerConnection();

  // Create a virtual video source
  const videoSource = new RTCVideoSource();
  const track = videoSource.createTrack();
  pc.addTrack(track);

  // Send fake frames at 30fps
  const width = 640;
  const height = 480;
  const frameInterval = setInterval(() => {
    const data = new Uint8ClampedArray(width * height * 4); // black frame
    videoSource.onFrame(new RTCVideoFrame(data, width, height));
  }, 1000 / 30);

  // Handle ICE candidates
  pc.onicecandidate = ({ candidate }) => {
    if (candidate) {
      ws.send(JSON.stringify({ type: "ice", candidate }));
    }
  };

  // Handle messages from client
  ws.on("message", async (msg) => {
    let data;
    try {
      data = JSON.parse(msg.toString());
    } catch (err) {
      console.error("Invalid JSON:", msg.toString());
      return;
    }

    if (data.type === "offer") {
      await pc.setRemoteDescription(data);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      ws.send(JSON.stringify(pc.localDescription));
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
    clearInterval(frameInterval);
    pc.close();
  });
});
