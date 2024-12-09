/* eslint-disable import/no-unresolved */
import DA_SDK from 'https://da.live/nx/utils/sdk.js';
import './manager.js';

(async function init() {
  const marketoManager = document.createElement('da-marketo-manager');
  document.body.append(marketoManager);
}());
