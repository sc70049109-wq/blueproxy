// frontend/src/App.jsx

import React, { useState, useRef, useEffect } from "react";

const PROXY_BASE = "http://localhost:8080/r/";

function App() {
  const [inputUrl, setInputUrl] = useState("");
  const [proxiedUrl, setProxiedUrl] = useState("");
  const [history, setHistory] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [delay, setDelay] = useState(0);
  const [enableAudio, setEnableAudio] = useState(false);

  const iframeRef = useRef();

  // helper: base64 encode
  const encodeUrl = (url) => btoa(url);

  const goToUrl = (url) => {
    if (!url.startsWith("http")) {
      // fallback: search DuckDuckGo
      url = `https://duckduckgo.com/?q=${encodeURIComponent(url)}`;
    }
    const proxied = `${PROXY_BASE}${encodeUrl(url)}?delay=${delay}&audio=${
      enableAudio ? "1" : "0"
    }`;
    setProxiedUrl(proxied);

    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(proxied);
    setHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProxiedUrl(history[currentIndex - 1]);
    }
  };

  const handleForward = () => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProxiedUrl(history[currentIndex + 1]);
    }
  };

  const handleRefresh = () => {
    if (currentIndex >= 0) {
      setProxiedUrl(history[currentIndex]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    goToUrl(inputUrl);
  };

  return (
    <div className="h-screen flex flex-col bg-blue-50">
      {/* URL bar and controls */}
      <div className="flex items-center p-2 bg-blue-500 text-white">
        <button onClick={handleBack} className="px-2">◀</button>
        <button onClick={handleForward} className="px-2">▶</button>
        <button onClick={handleRefresh} className="px-2">⟳</button>
        <form onSubmit={handleSubmit} className="flex flex-1 ml-2">
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="Input URL or search DuckDuckGo"
            className="flex-1 p-1 rounded text-black"
          />
        </form>
      </div>

      {/* Settings */}
      <div className="p-2 bg-blue-100 flex items-center space-x-4">
        <label>
          Delay (ms):
          <input
            type="number"
            value={delay}
            onChange={(e) => setDelay(parseInt(e.target.value) || 0)}
            className="ml-1 p-1 rounded w-20"
          />
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={enableAudio}
            onChange={() => setEnableAudio(!enableAudio)}
            className="mr-1"
          />
          Enable Audio
        </label>
      </div>

      {/* Iframe */}
      <div className="flex-1">
        {proxiedUrl ? (
          <iframe
            ref={iframeRef}
            src={proxiedUrl}
            title="BlueProxy"
            className="w-full h-full border-none"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-600">
            Enter a URL above to start browsing via proxy
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
