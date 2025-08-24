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
