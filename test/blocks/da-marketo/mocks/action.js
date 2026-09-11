// Minimal test mock of milo's real libs/utils/action.js — not a full reimplementation.
// Copied verbatim, it's self-contained already.

export function debounce(callback, time = 300) {
  if (typeof callback !== 'function') return undefined;

  let timer = null;

  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => callback(...args), time);
  };
}

export default { debounce };
