(function () {
  const params = new URLSearchParams(location.search);
  if (!params.has("tv")) return;
  const normalize = value => String(value || "").replace(/\D/g, "").slice(0, 6);
  let code = normalize(params.get("tv"));
  if (code.length !== 6) {
    const bytes = new Uint32Array(1); crypto.getRandomValues(bytes);
    code = String(100000 + (bytes[0] % 900000));
    params.set("tv", code); history.replaceState(null, "", `${location.pathname}?${params}`);
  }
  document.documentElement.classList.add("sailing-tv-mode");
  const style = document.createElement("style");
  style.textContent = `.sailing-tv-mode,.sailing-tv-mode body{cursor:none;background:#031824}#tv-pairing{position:fixed;z-index:10000;right:28px;top:24px;min-width:270px;padding:16px 20px;border:2px solid #46d7ef;border-radius:15px;background:rgba(2,20,31,.92);color:white;font:600 18px/1.25 system-ui;text-align:center;box-shadow:0 8px 30px #0007;transition:opacity .4s}#tv-pairing strong{display:block;margin:5px 0;color:#ffe66b;font-size:38px;letter-spacing:9px}#tv-pairing small{display:block;color:#a7dce7;font-weight:500}#tv-pairing.connected{opacity:.55;min-width:0;font-size:14px}#tv-pairing.connected strong,#tv-pairing.connected small{display:none}`;
  document.head.appendChild(style);
  const panel = document.createElement("div"); panel.id = "tv-pairing";
  panel.innerHTML = `IPHONE REMOTE<strong>${code}</strong><small>Open Remote on your iPhone and enter this code</small>`;
  document.body.appendChild(panel);
  const loadPeer = () => new Promise((resolve, reject) => {
    if (window.Peer) return resolve();
    const script = document.createElement("script"); script.src = "https://unpkg.com/peerjs@1.5.5/dist/peerjs.min.js";
    script.onload = resolve; script.onerror = reject; document.head.appendChild(script);
  });
  const dispatchKey = message => {
    const canvas = document.getElementById("canvas"); if (!canvas) return;
    canvas.focus(); canvas.dispatchEvent(new KeyboardEvent(message.down ? "keydown" : "keyup", {key:message.key,code:message.code,bubbles:true,cancelable:true,repeat:false}));
  };
  loadPeer().then(() => {
    const peer = new Peer(`sailtv-${code}`);
    peer.on("open", () => panel.querySelector("small").textContent = "Ready for iPhone connection");
    peer.on("connection", connection => {
      connection.on("open", () => { panel.classList.add("connected"); panel.firstChild.textContent = "IPHONE REMOTE CONNECTED"; setTimeout(() => panel.style.opacity = "0", 2200); });
      connection.on("data", message => { if (message?.type === "key") dispatchKey(message); });
      connection.on("close", () => { panel.classList.remove("connected"); panel.style.opacity = "1"; panel.innerHTML = `IPHONE REMOTE<strong>${code}</strong><small>Connection lost — reconnect with this code</small>`; });
    });
    peer.on("error", error => { panel.style.opacity = "1"; panel.querySelector("small").textContent = error.type === "unavailable-id" ? "Code in use. Reload TV Mode for a new code." : "Remote service unavailable. Check the TV internet connection."; });
  }).catch(() => panel.querySelector("small").textContent = "Remote service could not load. Check the TV internet connection.");
})();
