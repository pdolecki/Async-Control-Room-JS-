/**
Parallel Demo (allSettled + retry/backoff)
WHAT:
  Fetch several endpoints in parallel and show per-request results, timing,
  and an overall summary. Uses allSettled so errors don't block successes.

WHY:
  - Real apps call multiple services at once
  - You want partial results instead of "all or nothing"
  - Surface retries/errors clearly for debugging and UX

HOW:
  - Render one "card" per endpoint
  - Kick off all requests together (parallel)
  - On each completion, update its card (status + ms + snippet)
  - Track overall progress and show a final summary
 */
import fetchWithRetry from "../lib/fetchWithRetry.js";

const endpoints = [
  {
    name: "JS Info",
    url: "https://api.github.com/repos/javascript-tutorial/en.javascript.info/commits?per_page=1",
  },
  {
    name: "MDN Content",
    url: "https://api.github.com/repos/mdn/content/commits?per_page=1",
  },
  {
    name: "Node.js",
    url: "https://api.github.com/repos/nodejs/node/commits?per_page=1",
  },
  {
    name: "TC39 Proposals",
    url: "https://api.github.com/repos/tc39/proposals/commits?per_page=1",
  },
];

export default function initParallelDemo(root) {
  root.innerHTML = `
    <h2>Parallel Demo</h2>
    <p class="muted">Runs all requests at once; updates each card as it finishes. Retries with backoff. Uses <code>Promise.allSettled</code> for a final summary.</p>

    <div class="row">
      <button id="refresh" type="button">Refresh all</button>
      <span id="status" aria-live="polite"></span>
    </div>

    <ul id="grid" class="grid"></ul>

    <small class="muted">Tip: This demonstrates parallelism, resilience, and error isolation.</small>
  `;

  const grid = root.querySelector("#grid");
  const status = root.querySelector("#status");
  const btn = root.querySelector("#refresh");

  // Render cards
  grid.innerHTML = endpoints
    .map(
      (e, i) => `
      <li class="card" id="card-${i}">
        <div class="card__header">
          <strong>${e.name}</strong>
          <span class="tag tag--idle" id="tag-${i}">idle</span>
        </div>
        <div class="card__body" id="body-${i}">—</div>
        <div class="card__meta" id="meta-${i}"></div>
      </li>`
    )
    .join("");

  const setCard = (i, { state, text, ms }) => {
    const tag = root.querySelector(`#tag-${i}`);
    const body = root.querySelector(`#body-${i}`);
    const meta = root.querySelector(`#meta-${i}`);

    const classes = {
      loading: "tag--loading",
      ok: "tag--ok",
      err: "tag--err",
      idle: "tag--idle",
    };
    tag.className = `tag ${classes[state] ?? "tag--idle"}`;
    tag.textContent = state;

    body.innerHTML = text;
    meta.textContent = ms != null ? `${ms | 0} ms` : "";
  };

  async function refresh() {
    btn.disabled = true;
    status.textContent = `Loading… (0/${endpoints.length})`;

    const startedAt = performance.now();
    let done = 0;

    // Start all requests in parallel
    const promises = endpoints.map((ep, i) => {
      setCard(i, { state: "loading", text: "Fetching…", ms: null });
      const t0 = performance.now();

      return fetchWithRetry(ep.url, { retries: 2, base: 250, parse: "json" })
        .then((json) => {
          // GitHub commits API returns an array; take first commit message line
          const msg = json?.[0]?.commit?.message?.split("\n")[0] ?? "OK";
          const ms = performance.now() - t0;
          setCard(i, { state: "ok", text: escapeHtml(msg), ms });
        })
        .catch((err) => {
          const ms = performance.now() - t0;
          const msg = err?.message ?? "Request failed";
          setCard(i, {
            state: "err",
            text: `<span class="bad">${escapeHtml(msg)}</span>`,
            ms,
          });
        })
        .finally(() => {
          done++;
          status.textContent = `Loading… (${done}/${endpoints.length})`;
        });
    });

    // Wait for everything to settle for a final summary
    await Promise.allSettled(promises);
    const totalMs = performance.now() - startedAt;
    const errs = [...grid.querySelectorAll(".tag--err")].length;
    const oks = endpoints.length - errs;
    status.textContent = `Done: ${oks} ok, ${errs} error • ${
      totalMs | 0
    } ms total`;
    btn.disabled = false;
  }

  btn.addEventListener("click", refresh);
  refresh();
}

// Basic HTML escaping for safety when inserting API text
function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
