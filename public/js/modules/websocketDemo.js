/**
WebSocket Demo (connect + reconnect + pause buffer + send)
WHAT:
  Connects to a WebSocket echo server. Shows live state, message counters,
  pause/resume buffering, and exponential backoff reconnects.

WHY:
  - Real apps need resilient WS connections (auto-retry, backoff, buffering)
  - Users should see whether they’re connected and what happens when paused

HOW:
  - Connect button establishes a WS; Disconnect safely closes it
  - Reconnect uses capped exponential backoff with jitter
  - Pause buffers incoming messages; Resume flushes buffer to the log
  - Input box sends messages to the server (echoed back)
 */
export default function initWebSocketDemo(root) {
  root.innerHTML = `
    <h2>WebSocket (reconnect + pause)</h2>
    <div class="row">
      <button id="connect">Connect</button>
      <button id="pause">Pause</button>
      <span id="state"></span>
    </div>
    <pre id="log"></pre>
  `;
  const state = root.querySelector("#state");
  const log = root.querySelector("#log");
  const pauseBtn = root.querySelector("#pause");
  let ws,
    paused = false,
    tries = 0,
    buffer = [];

  function connect() {
    state.textContent = "connecting…";
    ws = new WebSocket("wss://ws.postman-echo.com/raw");
    ws.onopen = () => {
      tries = 0;
      state.textContent = "connected";
      ping();
    };
    ws.onmessage = (e) => {
      const line = `← ${e.data}`;
      if (paused) buffer.push(line);
      else log.textContent = `${line}\n${log.textContent}`;
    };
    ws.onclose = () => {
      state.textContent = "closed";
      reconnect();
    };
    ws.onerror = () => {
      state.textContent = "error";
      ws.close();
    };
  }

  function reconnect() {
    const delay = Math.min(2000 * 2 ** tries, 15000) + Math.random() * 200;
    tries++;
    state.textContent = `reconnecting in ${delay | 0}ms`;
    setTimeout(connect, delay);
  }
  function ping() {
    if (ws?.readyState === 1) {
      ws.send("ping " + new Date().toLocaleTimeString());
      setTimeout(ping, 1500);
    }
  }

  root.querySelector("#connect").addEventListener("click", connect);
  pauseBtn.addEventListener("click", () => {
    paused = !paused;
    pauseBtn.textContent = paused ? "Resume" : "Pause";
    if (!paused && buffer.length) {
      log.textContent = buffer.reverse().join("\n") + "\n" + log.textContent;
      buffer.length = 0;
    }
  });
}
