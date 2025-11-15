import React, { useState, useRef } from "react";

const PROXY_BASE = "http://localhost:8080/proxy?url=";

export default function App() {
  const [inputUrl, setInputUrl] = useState("");
  const [proxiedUrl, setProxiedUrl] = useState("");
  const iframeRef = useRef();

  const go = (raw) => {
    let url = raw.trim();
    if (!/^https?:\/\//i.test(url)) {
      // If not a URL, search DuckDuckGo
      url = `https://duckduckgo.com/?q=${encodeURIComponent(raw)}`;
    }
    setProxiedUrl(PROXY_BASE + encodeURIComponent(url));
  };

  const goBack = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow.history.back();
    }
  };
  const goForward = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow.history.forward();
    }
  };
  const refresh = () => {
    if (iframeRef.current) {
      iframeRef.current.src = proxiedUrl;
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-blue-100">
      {!proxiedUrl && (
        <div className="flex-grow flex flex-col justify-center items-center">
          <h1 className="text-5xl font-bold text-blue-800 mb-6">Blue Proxy</h1>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              go(inputUrl);
            }}
            className="flex w-full max-w-lg"
          >
            <input
              type="text"
              placeholder="Search DuckDuckGo or input a URL"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="flex-1 p-3 rounded-l-lg border border-blue-300"
            />
            <button
              type="submit"
              className="px-4 bg-blue-500 text-white rounded-r-lg"
            >
              Go
            </button>
          </form>
        </div>
      )}

      {proxiedUrl && (
        <>
          <div className="p-2 bg-blue-200 flex items-center space-x-2">
            <button onClick={goBack} className="px-2">◀</button>
            <button onClick={goForward} className="px-2">▶</button>
            <button onClick={refresh} className="px-2">⟳</button>
            <input
              type="text"
              value={proxiedUrl.replace(PROXY_BASE, "")}
              readOnly
              className="flex-1 p-1 border rounded text-sm"
            />
          </div>
          <iframe
            ref={iframeRef}
            src={proxiedUrl}
            className="flex-1 w-full border-none"
            title="BlueProxy"
          />
        </>
      )}
    </div>
  );
}
