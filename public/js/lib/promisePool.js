/*
  WHAT:
    Runs an array of async tasks with a maximum of `limit` running at once. Preserves result order (results[i] corresponds to tasks[i]).
  WHY:
    Avoids overloading the network/CPU (e.g. fetch 100 URLs with concurrency 5). Still finishes as fast as possible by starting a new task whenever one ends.
  HOW:
    - Keep counters: next task index `i`, `active` running, `done` completed.
    - Start up to `limit` tasks; when any finishes, start the next (if any).
    - Store each outcome like `Promise.allSettled`:
      { status: "fulfilled", value } or { status: "rejected", reason }.
    - Call `onProgress({ done, total, active})` after each completion.
  EXAMPLE:
    const tasks = urls.map(u => () => fetch(u).then(r => r.text()));
    const results = await promisePool(tasks, 5, ({done,total}) => {
    console.log(`Done ${done}/${total}`);
    });
    // results is an array of settled results in the original order
*/
export default async function promisePool(
  tasks,
  limit = 5,
  onProgress = () => {}
) {
  let i = 0,
    active = 0,
    done = 0;
  const results = new Array(tasks.length);
  return new Promise((resolve) => {
    const next = () => {
      if (done === tasks.length) return resolve(results);
      while (active < limit && i < tasks.length) {
        const idx = i++;
        active++;
        tasks[idx]()
          .then(
            (v) => (results[idx] = { status: "fulfilled", value: v }),
            (e) => (results[idx] = { status: "rejected", reason: e })
          )
          .finally(() => {
            active--;
            done++;
            onProgress({ done, total: tasks.length, active });
            next();
          });
      }
    };
    next();
  });
}
