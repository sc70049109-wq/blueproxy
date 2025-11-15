import express from "express";
import { WebSocketServer } from "ws";
import puppeteer from "puppeteer";
import { RTCPeerConnection, RTCVideoSource, RTCVideoFrame } from "wrtc";

const app = express();
const HTTP_PORT = 3000;
const WS_PORT = 3001;

app.use(express.static("../frontend/dist"));

app.listen(HTTP_PORT, () => {
  console.log(`HTTP server running on http://localhost:${HTTP_PORT}`);
});

const wss = new WebSocketServer({ port: WS_PORT });

wss.on("connection", async (ws) => {
  console.log("Client connected via WebSocket");

  // Launch headless browser
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.goto("https://example.com"); // page to stream

  // Create WebRTC peer
  const pc = new RTCPeerConnection();
  const source = new RTCVideoSource();
  const track = source.createTrack();
  pc.addTrack(track);

  // Send ICE candidates
  pc.onicecandidate = ({ candidate }) => {
    if (candidate) ws.send(JSON.stringify({ type: "candidate", candidate }));
  };

  ws.on("message", async (msg) => {
    const data = JSON.parse(msg.toString());

    if (data.type === "offer") {
      await pc.setRemoteDescription(data.offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      ws.send(JSON.stringify({ type: "answer", answer: pc.localDescription }));
    }

    if (data.type === "candidate") {
      try { await pc.addIceCandidate(data.candidate); } catch (e) {}
    }
  });

  // Capture Puppeteer screenshots and feed to WebRTC track
  setInterval(async () => {
    const screenshot = await page.screenshot({ encoding: "binary" });
    const frame = new RTCVideoFrame(screenshot, 640, 480);
    source.onFrame(frame);
  }, 1000 / 10); // ~10 FPS

  ws.on("close", async () => {
    clearInterval();
    await browser.close();
    console.log("Client disconnected, browser closed");
  });
});
