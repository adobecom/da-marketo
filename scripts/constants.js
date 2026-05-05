export const [setLibs, getLibs] = (() => {
  let libs;
  return [
    (prodLibs, location) => {
      libs = (() => {
        const { hostname, search, origin } = location || window.location;
        if (!['.aem.', '.hlx.', '.stage.', 'local', '.da.'].some((i) => hostname.includes(i))) return `${origin}${prodLibs}`;
        const branch = new URLSearchParams(search).get('milolibs') || 'main';
        if (!/^[a-zA-Z0-9_-]+$/.test(branch)) throw new Error('Invalid branch name.');
        if (branch === 'local') return 'http://localhost:6456/libs';
        if (branch === 'main' && hostname.includes('.stage.')) return `${origin}/libs`;
        return branch.includes('--') ? `https://${branch}.aem.live/libs` : `https://${branch}--milo--adobecom.aem.live/libs`;
      })();
      return libs;
    }, () => libs,
  ];
})();

export const LIBS = setLibs('/libs');
