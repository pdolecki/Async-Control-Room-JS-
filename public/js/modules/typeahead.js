/**
Typeahead (debounce + cancel + dedupe)
WHAT:
  Debounced input that fetches suggestions. Cancels old requests and
  deduplicates identical in-flight queries.
WHY:
  - Avoid spamming the API on every keystroke
  - Prevent race conditions (late responses overriding newer ones)
  - Save bandwidth if the same query is requested twice quickly
HOW:
  - debounce(...) waits 300ms after the last keystroke
  - AbortController cancels previous fetch before starting a new one
  - dedupe(key, factory) returns the same Promise for identical in-flight keys
 */
import debounce from "../lib/debounce.js";
import fetchWithRetry from "../lib/fetchWithRetry.js";
import dedupe from "../lib/inflightDeduper.js";

export default function initTypeahead(root) {
  root.innerHTML = `
    <h2>Typeahead (debounce + cancel)</h2>
    <div class="row">
      <input id="q" placeholder="Search Wikipedia..." />
      <button id="abort">Abort</button>
    </div>
    <ul id="list"></ul>
    <small>Debounced 300ms, aborts in-flight on new input, dedupes identical queries.</small>
  `;
  const q = root.querySelector("#q");
  const list = root.querySelector("#list");
  let lastId = 0;
  let currentCtrl = null;

  const run = debounce(async () => {
    const query = q.value.trim();
    if (!query) {
      list.innerHTML = "";
      return;
    }
    const id = ++lastId;
    currentCtrl?.abort();
    currentCtrl = new AbortController();

    try {
      const res = await dedupe(`wiki:${query}`, () =>
        fetchWithRetry(
          `https://en.wikipedia.org/w/api.php?action=opensearch&origin=*&search=${encodeURIComponent(
            query
          )}`,
          { signal: currentCtrl.signal }
        )
      );
      if (id !== lastId) return; // a newer request exists
      const data = await res.json();
      list.innerHTML = data[1]
        .slice(0, 7)
        .map((s) => `<li>${s}</li>`)
        .join("");
    } catch (e) {
      if (currentCtrl.signal.aborted) return;
      list.innerHTML = `<li class="bad">${e.message}</li>`;
    }
  }, 300);

  q.addEventListener("input", run);
  root
    .querySelector("#abort")
    .addEventListener("click", () => currentCtrl?.abort());
}
