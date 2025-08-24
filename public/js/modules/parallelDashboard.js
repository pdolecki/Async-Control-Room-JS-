import fetchWithRetry from "../lib/fetchWithRetry.js";

const endpoints = [
  "https://api.github.com/repos/javascript-tutorial/en.javascript.info/commits?per_page=1",
  "https://api.github.com/repos/mdn/content/commits?per_page=1",
  "https://api.github.com/repos/nodejs/node/commits?per_page=1",
  "https://api.github.com/repos/tc39/proposals/commits?per_page=1",
];

export default function initParallel(root) {
  root.innerHTML = `
    <h2>Parallel Fetch (allSettled)</h2>
    <div class="row">
      <button id="refresh">Refresh</button>
      <span id="status"></span>
    </div>
    <ul id="out"></ul>
  `;
  const out = root.querySelector("#out");
  const status = root.querySelector("#status");

  async function refresh() {
    status.textContent = "Loading…";
    const settled = await Promise.allSettled(
      endpoints.map((u) =>
        fetchWithRetry(u, { retries: 2, base: 250 }).then((r) => r.json())
      )
    );
    status.textContent = "";
    out.innerHTML = settled
      .map((r, i) => {
        if (r.status === "fulfilled") {
          const msg = r.value[0]?.commit?.message?.split("\n")[0] ?? "ok";
          return `<li class="ok">${i + 1}. ${msg}</li>`;
        } else {
          return `<li class="bad">${i + 1}. ${r.reason}</li>`;
        }
      })
      .join("");
  }
  root.querySelector("#refresh").addEventListener("click", refresh);
  refresh();
}
