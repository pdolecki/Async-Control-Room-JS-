/**
Promise Pool Demo (concurrency limiter + per-task status)
WHAT:
  Runs N async tasks with a max of `limit` running at once. Shows queue/active/done,
  per-task status + duration, total time, and optional fail-fast + error simulation.

WHY:
  - Visualizes controlled concurrency (like a downloader or job runner)
  - Makes progress obvious and teaches backpressure

HOW:
  - Use promisePool(tasks, limit, onProgress)
  - Render a small table: id | status | ms
  - Track total elapsed via performance.now()
 */
import promisePool from "../lib/promisePool.js";

export default function initPromisePoolDemo(root) {
  root.innerHTML = `
    <h2>Promise Pool Demo (concurrency limiter)</h2>

    <div class="row">
      <label>Concurrency
        <input id="limit" type="number" min="1" max="10" value="4" style="width:64px">
      </label>
      <label style="margin-left:12px;">
        <input id="failfast" type="checkbox"> Fail fast
      </label>
      <label style="margin-left:12px;">
        <input id="errors" type="checkbox"> Simulate errors (20%)
      </label>
      <button id="run">Run 20 tasks</button>
      <span id="summary" aria-live="polite"></span>
    </div>

    <div class="row" style="margin-top:8px;">
      <progress id="bar" value="0" max="20" style="width:260px;"></progress>
      <span id="counts">queued: 20 • active: 0 • done: 0</span>
      <span id="elapsed" class="muted"></span>
    </div>

    <table id="table" style="width:100%;margin-top:8px;border-collapse:collapse;">
      <thead>
        <tr>
          <th style="text-align:left;padding:6px;">#</th>
          <th style="text-align:left;padding:6px;">Status</th>
          <th style="text-align:left;padding:6px;">Duration</th>
          <th style="text-align:left;padding:6px;">Note</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  `;

  const limitInput = root.querySelector("#limit");
  const failfast = root.querySelector("#failfast");
  const simulateErrors = root.querySelector("#errors");
  const bar = root.querySelector("#bar");
  const counts = root.querySelector("#counts");
  const elapsed = root.querySelector("#elapsed");
  const summary = root.querySelector("#summary");
  const tbody = root.querySelector("#table tbody");
  const runBtn = root.querySelector("#run");

  const TOTAL = 20;

  function resetUI() {
    bar.max = TOTAL;
    bar.value = 0;
    counts.textContent = `queued: ${TOTAL} • active: 0 • done: 0`;
    elapsed.textContent = "";
    summary.textContent = "";
    tbody.innerHTML = Array.from({ length: TOTAL }, (_, i) =>
      rowHTML(i + 1)
    ).join("");
  }

  function rowHTML(id) {
    return `<tr id="row-${id}" style="border-top:1px solid #243041;">
      <td style="padding:6px;">${id}</td>
      <td style="padding:6px;"><span class="tag tag--idle" id="st-${id}">queued</span></td>
      <td style="padding:6px;" id="ms-${id}">—</td>
      <td style="padding:6px;" id="note-${id}"></td>
    </tr>`;
  }

  function setRow(id, { state, ms, note }) {
    const st = root.querySelector(`#st-${id}`);
    const tdMs = root.querySelector(`#ms-${id}`);
    const tdNote = root.querySelector(`#note-${id}`);
    const classes = {
      queued: "tag--idle",
      running: "tag--loading",
      ok: "tag--ok",
      err: "tag--err",
    };
    st.className = `tag ${classes[state] || "tag--idle"}`;
    st.textContent = state;
    if (ms != null) tdMs.textContent = `${ms | 0} ms`;
    if (note) tdNote.textContent = note;
  }

  function makeTask(id) {
    return async () => {
      setRow(id, { state: "running" });
      const t0 = performance.now();
      // random work 200–1000ms
      const ms = 200 + Math.random() * 800;
      await new Promise((r) => setTimeout(r, ms));

      // optional error path
      if (simulateErrors.checked && Math.random() < 0.2) {
        const err = new Error("boom");
        err._duration = performance.now() - t0;
        throw err;
      }
      return { id, ms: performance.now() - t0 };
    };
  }

  runBtn.addEventListener("click", async () => {
    runBtn.disabled = true;
    resetUI();

    const tasks = Array.from({ length: TOTAL }, (_, i) => makeTask(i + 1));
    let active = 0,
      done = 0,
      queued = TOTAL;
    const tStart = performance.now();

    try {
      const results = await promisePool(
        tasks,
        Number(limitInput.value),
        // onProgress after each completion
        ({ done: d, total, active: a }) => {
          done = d;
          active = a;
          queued = total - done - active;
          counts.textContent = `queued: ${queued} • active: ${active} • done: ${done}`;
          bar.value = done;
          elapsed.textContent = `• total: ${
            (performance.now() - tStart) | 0
          } ms`;
        }
      );

      // finalize rows
      results.forEach((r, idx) => {
        const id = idx + 1;
        if (r.status === "fulfilled") {
          setRow(id, { state: "ok", ms: r.value.ms });
        } else {
          const ms = r.reason?._duration;
          setRow(id, { state: "err", ms, note: r.reason?.message || "error" });
        }
      });

      const ok = results.filter((r) => r.status === "fulfilled").length;
      const er = TOTAL - ok;
      summary.textContent = `Done: ${ok} ok, ${er} error`;
    } catch (e) {
      summary.textContent = `Stopped early (fail-fast): ${e.message || e}`;
    } finally {
      runBtn.disabled = false;
    }
  });

  // initial paint
  resetUI();
}
