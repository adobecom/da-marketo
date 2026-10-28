import { PoiManager } from './poi-manager.js';
import mountManager from './ui.js';

const root = document.querySelector('main');

async function init() {
  try {
    if (window.parent === window) {
      throw new Error('Open this app through https://da.live/app/adobecom/da-marketo/tools/poi-manager/index?ref=local (port 3000), or use your code branch as ref. Check DA sign-in and site permissions.');
    }
    // The SDK handshake supplies both the context and authenticated daFetch.
    const sdkUrl = 'https://da.live/nx/utils/sdk.js';
    const { default: sdk } = await import(sdkUrl);
    const app = mountManager(root, new PoiManager(await sdk));
    await app.load();
  } catch (error) {
    const alert = document.createElement('p');
    alert.setAttribute('role', 'alert');
    alert.textContent = error.message;
    root.append(alert);
  }
}

init();
