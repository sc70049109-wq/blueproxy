import React, { useRef, useEffect } from "react";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";

export default function App() {
  const videoRef = useRef(null);
  const wsRef = useRef(null);
  const pcRef = useRef(null);

  const particlesInit = async (engine) => {
    await loadFull(engine);
  };

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3001");
    wsRef.current = ws;

    const pc = new RTCPeerConnection();
    pcRef.current = pc;

    pc.ontrack = (event) => {
      videoRef.current.srcObject = event.streams[0];
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        ws.send(JSON.stringify({ type: "candidate", candidate: event.candidate }));
      }
    };

    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "answer") {
        await pc.setRemoteDescription(data.answer);
      }

      if (data.type === "candidate") {
        try {
          await pc.addIceCandidate(data.candidate);
        } catch (e) {
          console.error("Error adding candidate", e);
        }
      }
    };

    const initWebRTC = async () => {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      ws.send(JSON.stringify({ type: "offer", offer }));
    };

    initWebRTC();
  }, []);

  return (
    <div
      style={{
        height: "100vh",
        background: "linear-gradient(135deg, #1a1a1a, #0d0d0d)",
        color: "white",
        overflow: "hidden",
        position: "relative",
        paddingTop: "20px",
      }}
    >
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={{
          background: { color: { value: "transparent" } },
          fpsLimit: 60,
          particles: {
            number: { value: 50 },
            color: { value: "#ffffff" },
            links: { enable: true, color: "#ffffff" },
            move: { enable: true, speed: 2 },
            size: { value: 3 },
          },
        }}
      />

      <h1 style={{ textAlign: "center" }}>🌐 BlueProxy WebRTC</h1>

      <div style={{ display: "flex", justifyContent: "center", marginTop: "50px" }}>
        <video
          ref={videoRef}
          style={{
            width: "80%",
            maxHeight: "400px",
            borderRadius: "20px",
            boxShadow: "0 0 20px rgba(0,0,0,0.5)",
            background: "linear-gradient(90deg, #222, #111)",
            objectFit: "cover",
          }}
          autoPlay
          playsInline
          muted
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          marginTop: "50px",
          gap: "20px",
        }}
      >
        <div style={{ width: "150px", height: "150px", background: "#333", borderRadius: "15px" }} />
        <div style={{ width: "150px", height: "150px", background: "#444", borderRadius: "15px" }} />
        <div style={{ width: "150px", height: "150px", background: "#555", borderRadius: "15px" }} />
      </div>
    </div>
  );
}
