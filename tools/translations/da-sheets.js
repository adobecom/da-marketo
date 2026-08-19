/* eslint-disable import/no-unresolved */
import { daFetch } from 'da-fetch';
import { normalizeSheet, toSheetFormat } from './translations-core.js';

export { normalizeSheet, toSheetFormat } from './translations-core.js';

const ORG = 'adobecom';
const REPO = 'da-marketo';
const ADMIN = 'https://admin.da.live';

const sourceUrl = (path) => `${ADMIN}/source/${ORG}/${REPO}${path}`;

export async function readFieldSheet(path, fetchImpl = daFetch) {
  const res = await fetchImpl(sourceUrl(path), { headers: { accept: 'application/json' } });
  if (!res.ok) return null;
  return normalizeSheet(await res.json());
}

export async function saveFieldSheet(path, rows, fetchImpl = daFetch) {
  const fd = new FormData();
  fd.append('data', new Blob([JSON.stringify(toSheetFormat(rows))], { type: 'application/json' }));
  const res = await fetchImpl(sourceUrl(path), { method: 'PUT', body: fd });
  return res.ok;
}
