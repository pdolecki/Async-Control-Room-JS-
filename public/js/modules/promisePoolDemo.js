import promisePool from "../lib/promisePool.js";

export default function initPoolDemo(root) {
  root.innerHTML = `
    <h2>Promise Pool (concurrency limiter)</h2>
    <div class="row">
      <label>Concurrency <input id="limit" type="number" min="1" max="10" value="4" style="width:60px"></label>
      <button id="run">Run 20 tasks</button>
      <span id="prog"></span>
    </div>
    <pre id="log"></pre>
  `;
  const limitInput = root.querySelector("#limit");
  const prog = root.querySelector("#prog");
  const log = root.querySelector("#log");

  function makeTask(i) {
    return async () => {
      const ms = 200 + Math.random() * 800;
      await new Promise((r) => setTimeout(r, ms));
      return `#${i} done in ${ms | 0}ms`;
    };
  }

  root.querySelector("#run").addEventListener("click", async () => {
    const tasks = Array.from({ length: 20 }, (_, i) => makeTask(i + 1));
    log.textContent = "";
    await promisePool(
      tasks,
      Number(limitInput.value),
      ({ done, total, active }) => {
        prog.textContent = `Done ${done}/${total} (active ${active})`;
        if (done > 0) log.textContent += `✔︎ ${done}/${total}\n`;
      }
    );
    log.textContent += "All done.";
  });
}
