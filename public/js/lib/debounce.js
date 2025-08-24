/*
  WHAT:
    Returns a new function that delays calling `fn` until no calls happen for `ms` milliseconds.
  WHY: 
    Prevents spamming an expensive function (e.g. API call on keypress). Only the *last* call after a quiet period is executed.
  HOW:
    Each time the returned function is called:
    - clearTimeout cancels the previous pending call
    - setTimeout schedules a new one after `ms` ms
    If no new calls arrive in that time, `fn` runs with the last args.
  EXAMPLE:
   const search = debounce(runSearch, 300);
    input.addEventListener('input', e => search(e.target.value));
 */

export default function debounce(fn, ms = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}
