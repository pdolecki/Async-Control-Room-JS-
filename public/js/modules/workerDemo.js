/**
Web Worker Demo (offload vs main thread jank)
WHAT:
  Compare a CPU-heavy loop on the main thread vs in a Web Worker.
  A "UI heartbeat" ticks every 100ms. If the UI freezes, you'll see missed beats.

WHY:
  - Long CPU work on the main thread blocks rendering and input (jank)
  - Offloading to a worker keeps the UI responsive

HOW:
  - Start a heartbeat timer that increments a counter
  - Baseline: run heavy loop on main → heartbeat stalls
  - Worker: run heavy loop in worker → heartbeat keeps ticking
  - Show durations + missed beats for both paths
 */
export default function initWorker(root) {
  root.innerHTML = `
    <h2>Web Worker (offload)</h2>
    <p class="muted">Heavy math (~2M ops). Watch the heartbeat — it should keep ticking if work is offloaded.</p>
    <div class="row">
      <button id="run-main"  type="button">Run on Main</button>
      <button id="run-worker" type="button">Run in Worker</button>
      <span id="status" aria-live="polite"></span>
    </div>

    <div class="hb" style="margin:8px 0;">
      <span class="pill">UI heartbeat:</span>
      <span id="beats" class="mono">0</span>
      <span id="missed" class="pill muted">missed: 0</span>
    </div>

    <pre id="out" class="mono"></pre>
  `;

  const status = root.querySelector("#status");
  const out = root.querySelector("#out");
  const btnMain = root.querySelector("#run-main");
  const btnWorker = root.querySelector("#run-worker");
  const beatsEl = root.querySelector("#beats");
  const missedEl = root.querySelector("#missed");

  // --- Heartbeat to visualize jank ---
  let beats = 0,
    missed = 0,
    lastTick = performance.now();
  const hb = setInterval(() => {
    const now = performance.now();
    // If we missed >300ms since last tick, count how many 100ms "beats" were skipped
    const gap = now - lastTick;
    if (gap > 200) missed += Math.floor(gap / 100) - 1;
    lastTick = now;
    beats++;
    beatsEl.textContent = String(beats);
    missedEl.textContent = `missed: ${missed}`;
    missedEl.className = "pill " + (missed ? "bad" : "muted");
  }, 100);

  // --- Heavy CPU task ---
  function heavyCompute(n = 2_000_000) {
    const t0 = performance.now();
    let sum = 0;
    for (let i = 0; i < n; i++) sum += Math.sqrt(i % 1000);
    return { sum, ms: performance.now() - t0 };
  }

  function setBusy(isBusy) {
    btnMain.disabled = btnWorker.disabled = isBusy;
  }

  // --- Run on main thread (expect jank) ---
  btnMain.addEventListener("click", () => {
    setBusy(true);
    status.textContent = "Running on main…";
    const beforeBeats = beats,
      beforeMissed = missed;
    const { sum, ms } = heavyCompute();
    const dBeats = beats - beforeBeats;
    const dMissed = missed - beforeMissed;
    status.textContent = `Done on main in ${ms | 0} ms`;
    out.textContent =
      `MAIN THREAD\n` +
      `sum=${sum | 0}  time=${ms | 0}ms\n` +
      `heartbeat during run: +${dBeats} beats, missed +${dMissed}\n`;
    setBusy(false);
  });

  // --- Run in worker (UI should stay smooth) ---
  const workerCode = `
    self.onmessage = (e) => {
      const n = e.data?.n ?? 2_000_000;
      const t0 = performance.now();
      let sum = 0;
      for (let i = 0; i < n; i++) sum += Math.sqrt(i % 1000);
      self.postMessage({ sum, ms: performance.now() - t0 });
    };
  `;
  const workerURL = URL.createObjectURL(
    new Blob([workerCode], { type: "text/javascript" })
  );

  btnWorker.addEventListener("click", () => {
    setBusy(true);
    status.textContent = "Running in worker…";
    const beforeBeats = beats,
      beforeMissed = missed;

    const w = new Worker(workerURL);
    const tStart = performance.now();
    w.onmessage = (e) => {
      const { sum, ms } = e.data;
      const total = performance.now() - tStart;
      const dBeats = beats - beforeBeats;
      const dMissed = missed - beforeMissed;
      status.textContent = `Done in worker in ${total | 0} ms`;
      out.textContent =
        `WEB WORKER\n` +
        `sum=${sum | 0}  worker time=${ms | 0}ms  wall time=${total | 0}ms\n` +
        `heartbeat during run: +${dBeats} beats, missed +${dMissed}\n`;
      w.terminate();
      setBusy(false);
    };
    w.onerror = (e) => {
      status.textContent = "Worker error";
      out.textContent = String(e.message || e);
      w.terminate();
      setBusy(false);
    };
    w.postMessage({ n: 2_000_000 });
  });

  // Cleanup if this module ever gets torn down (optional in this demo)
  root.addEventListener("DOMNodeRemoved", (e) => {
    if (e.target === root) clearInterval(hb);
  });
}
