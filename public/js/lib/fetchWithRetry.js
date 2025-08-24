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
