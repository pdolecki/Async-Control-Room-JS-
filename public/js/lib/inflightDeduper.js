const inflight = new Map();
export default function dedupe(key, factory) {
  if (inflight.has(key)) return inflight.get(key);
  const p = Promise.resolve()
    .then(factory)
    .finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}
