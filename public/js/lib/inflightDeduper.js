/*
  WHAT: 
    Ensures only one in-flight Promise exists per `key`. If the same `key` is requested again while still running, the *same* Promise is returned instead of creating a duplicate.
  WHY:
    - Prevents duplicate network/API calls (e.g. multiple components asking for the same data)
    - Saves bandwidth and avoids inconsistent state
    - Once the Promise resolves/rejects, the entry is cleared
  HOW:
    - Keep a MAP<key, Promise>
    - On call:
      If key exists return stored Promise
      Else create Promise from factory(), store it
    - On settle (finally) remove from Map
  EXAMPLE:
    const data = await dedupe('user:42', () => fetch('/api/users/42').then(r => r.json()));
 
    // If called again with same key before first finishes,
    // it will return the SAME Promise instead of firing a new fetch.
*/
const inflight = new Map();
export default function dedupe(key, factory) {
  if (inflight.has(key)) return inflight.get(key);
  const p = Promise.resolve()
    .then(factory)
    .finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}
