// Minimal test mock of milo's real libs/features/placeholders.js — not a full reimplementation.
// Real replaceKey/replaceKeyArray fetch a remote placeholders sheet; tests only ever supply
// placeholders inline via config.placeholders, so this mock reads directly from there.

const keyToStr = (key) => key;

export async function replaceKey(key, config) {
  if (typeof key !== 'string' || !key.length) return '';
  return config?.placeholders?.[key] ?? keyToStr(key);
}

export async function replaceKeyArray(keys, config) {
  return Promise.all(keys.map((key) => replaceKey(key, config)));
}
