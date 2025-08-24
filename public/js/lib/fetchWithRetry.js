/*
  WHAT:
   A wrapper around fetch() that automatically retries on failure, suppoorts cancellation via AbortController, and uses exponential backoff.
  WHY:
  - Network calls can fail (timeouts, 5xx errors, flasky WiFi)
  - Retrying with backoff avoids hammering the server
  - AbortController lets us cancel in-flight requests safely
  HOW:
  - Create an internal AbortController for each attempt
  - If outer singal aborts abort inner fetch
  - Retry up to `retries` times on errors or retrable status
  - Wait between retries: base * 2^attempt + jitter
  - Stop retrying on 4xx (client) errors
  EXAMPLE:
    const ctrl = new AbortController();
    try {
      const res = await fetchWithRetry('/api/data', { retries: 3, base: 200, signal: ctrl.signal });
      const data = await res.json();
    } catch (e) {
      console.error('Request failed:', e);
    }
    // ctrl.abort() cancels the request early
*/
export default async function fetchWithRetry(
  url,
  { retries = 3, base = 300, signal } = {}
) {
  let attempt = 0;
  while (true) {
    const ctrl = new AbortController();
    const onAbort = () => ctrl.abort();
    signal?.addEventListener("abort", onAbort, { once: true });

    try {
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) {
        if (res.status >= 400 && res.status < 500)
          throw new Error(`HTTP ${res.status}`);
        throw new Error(`Retryable ${res.status}`);
      }
      return res;
    } catch (err) {
      if (signal?.aborted || attempt >= retries) throw err;
      await new Promise((r) =>
        setTimeout(r, base * 2 ** attempt + Math.random() * 100)
      );
      attempt++;
    } finally {
      signal?.removeEventListener("abort", onAbort);
    }
  }
}
