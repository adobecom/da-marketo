// Minimal test helper adapted from milo's test/helpers/waitfor.js (waitForElement only).

const waitForElement = (
  selector,
  {
    options = { childList: true, subtree: true },
    rootEl = document.body,
  } = {},
) => new Promise((resolve) => {
  const el = rootEl.querySelector(selector);
  if (el) {
    resolve(el);
    return;
  }

  const observer = new MutationObserver((mutations, obsv) => {
    const found = rootEl.querySelector(selector);
    if (found) {
      obsv.disconnect();
      resolve(found);
    }
  });

  observer.observe(rootEl, options);
});

export default waitForElement;
