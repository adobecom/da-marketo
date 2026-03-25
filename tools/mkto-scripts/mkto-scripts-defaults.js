/**
 * Shared Marketo getForm tool defaults (host, munchkin, form list).
 */

export const MKTO_DEFAULTS = {
  host: 'engage.adobe.com',
  munchkinId: '360-KCI-804',
  pageUrl: 'https://milo.adobe.com/tools/marketo',
};

export const DEFAULT_FORM_ID = 2277;

export const FORM_OPTIONS = [
  { id: 1723, label: 'MCZ Staging — Stage testing', subFolders: true },
  { id: 2259, label: 'MCZ Short Form — Staging', subFolders: false },
  { id: 2277, label: 'MCZ Production — PRODUCTION', subFolders: false },
  { id: 2945, label: 'DA Sandbox — Development', subFolders: false },
  { id: 3131, label: 'Data Layer Testing', subFolders: false },
  { id: 3410, label: 'Stage Clone', subFolders: false },
  { id: 3577, label: 'Magma Stage', subFolders: false },
  { id: 3770, label: 'Magma Sandbox', subFolders: false },
  { id: 3844, label: 'Progressive Profiling', subFolders: true },
];

export function subFoldersForFormId(formIdStr) {
  const id = parseInt(formIdStr, 10);
  const opt = FORM_OPTIONS.find((o) => o.id === id);
  return opt ? opt.subFolders : false;
}
