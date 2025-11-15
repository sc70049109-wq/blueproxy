// server.js
import http from "http";
import WebSocket, { WebSocketServer } from "ws";
import { RTCPeerConnection, nonstandard } from "wrtc";
const { RTCVideoSource } = nonstandard;

// ----- HTTP server -----
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("BlueProxy Backend Running\n");
});

server.listen(3000, () => {
  console.log("HTTP server running on http://localhost:3000");
});

// ----- WebSocket server -----
const wss = new WebSocketServer({ server: server, path: "/ws" });
console.log("WebSocket server running on ws://localhost:3000/ws");

wss.on("connection", (ws) => {
  console.log("Client connected via WebSocket");

  // ----- WebRTC PeerConnection -----
  const pc = new RTCPeerConnection();

  const width = 640;
  const height = 480;

  const videoSource = new RTCVideoSource();
  const track = videoSource.createTrack();
  pc.addTrack(track);

  // Send black video frames at 30 FPS
  const frameData = Buffer.alloc((width * height * 3) >> 1); // I420
  const interval = setInterval(() => {
    // Y plane = 0 (black)
    frameData.fill(0, 0, width * height);
    // U + V planes = 128 (neutral)
    frameData.fill(128, width * height);
    videoSource.onFrame({ data: frameData, width, height });
  }, 1000 / 30);

  // ----- WebSocket signaling -----
  ws.on("message", async (msg) => {
    let data;
    try {
      data = JSON.parse(msg.toString());
    } catch {
      console.log("Received non-JSON message:", msg.toString());
      return;
    }

    if (data.type === "offer") {
      await pc.setRemoteDescription(data);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      ws.send(JSON.stringify(answer));
    } else if (data.type === "ice") {
      if (data.candidate && data.candidate.candidate !== "") {
        try {
          await pc.addIceCandidate(data.candidate);
        } catch (err) {
          console.error("Error adding ICE candidate:", err);
        }
      }
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    clearInterval(interval);
    pc.close();
  });
});
