import express from "express";
import fetch from "node-fetch";
import { load } from "cheerio";
import { Buffer } from "buffer";

const app = express();
const PORT = process.env.PORT || 8080;

// helper: encode/decode base64 URL
const encodeUrl = (s) => Buffer.from(s, "utf8").toString("base64url");
const decodeUrl = (s) => Buffer.from(s, "base64url").toString("utf8");

// optional delay helper
const wait = (ms) => new Promise((res) => setTimeout(res, ms || 0));

app.get("/r/:b64", async (req, res) => {
  try {
    const target = decodeUrl(req.params.b64);
    const delay = parseInt(req.query.delay || "0", 10) || 0;
    const enableAudio = req.query.audio === "1";

    if (!/^https?:\/\//i.test(target)) {
      return res.status(400).send("Only http(s) URLs are supported");
    }

    if (delay > 0) await wait(delay);

    const upstreamRes = await fetch(target, {
      headers: {
        "User-Agent": req.headers["user-agent"] || "BlueProxy/1.0",
      },
    });

    const contentType = upstreamRes.headers.get("content-type") || "";

    if (contentType.includes("text/html")) {
      const html = await upstreamRes.text();
      const $ = load(html);

      // rewrite links, images, forms to go through proxy
      $("a[href]").each((i, el) => {
        try {
          const href = $(el).attr("href");
          const resolved = new URL(href, target).toString();
          $(el).attr(
            "href",
            `/r/${encodeUrl(resolved)}?delay=${delay}&audio=${
              enableAudio ? "1" : "0"
            }`
          );
        } catch {}
      });

      $("[src]").each((i, el) => {
        try {
          const src = $(el).attr("src");
          const resolved = new URL(src, target).toString();
          $(el).attr(
            "src",
            `/r/${encodeUrl(resolved)}?delay=${delay}&audio=${
              enableAudio ? "1" : "0"
            }`
          );
        } catch {}
      });

      $("form[action]").each((i, el) => {
        try {
          const act = $(el).attr("action");
          const resolved = new URL(act, target).toString();
          $(el).attr(
            "action",
            `/r/${encodeUrl(resolved)}?delay=${delay}&audio=${
              enableAudio ? "1" : "0"
            }`
          );
        } catch {}
      });

      // optionally mute audio
      if (!enableAudio) {
        $("body").append(`
<script>
try {
  function muteAll() {
    document.querySelectorAll('audio,video').forEach(e => { e.muted = true; e.pause && e.pause(); });
  }
  muteAll();
  const obs = new MutationObserver(muteAll);
  obs.observe(document.documentElement||document.body, { childList:true, subtree:true });
} catch(e){}
</script>
        `);
      }

      res.set("Content-Type", "text/html");
      return res.send($.html());
    }

    // for non-HTML (images, scripts, etc.)
    const buffer = await upstreamRes.arrayBuffer();
    if (delay > 0) await wait(delay);
    res.set("Content-Type", contentType);
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error(err);
    res.status(500).send("Proxy error: " + String(err.message));
  }
});

// simple API to encode a URL to /r/:b64
app.get("/api/encode", (req, res) => {
  const url = req.query.url || "";
  if (!url) return res.status(400).json({ error: "url required" });
  try {
    const encoded = encodeUrl(url);
    res.json({ route: `/r/${encoded}` });
  } catch {
    res.status(400).json({ error: "invalid url" });
  }
});

app.listen(PORT, () => console.log(`BlueProxy backend running on http://localhost:${PORT}`));
