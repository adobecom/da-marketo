import { expect } from '@esm-bundle/chai';
import { setLibs, LIBS } from '../../mkto/constants.js';

describe('Libs', () => {
  const tests = [
    ['https://business.adobe.com', 'https://business.adobe.com/libs'],
    ['https://business.adobe.com?milolibs=foo', 'https://business.adobe.com/libs'],
    ['https://business.stage.adobe.com', 'https://business.stage.adobe.com/libs'],
    ['https://business.stage.adobe.com?milolibs=foo', 'https://foo--milo--adobecom.aem.live/libs'],
    ['https://business.stage.adobe.com?milolibs=awesome--milo--forkedowner', 'https://awesome--milo--forkedowner.aem.live/libs'],
    ['https://main--da-marketo--adobecom.aem.live/', 'https://main--milo--adobecom.aem.live/libs'],
    ['https://main--da-marketo--adobecom.aem.live/?milolibs=foo', 'https://foo--milo--adobecom.aem.live/libs'],
    ['https://main--da-marketo--adobecom.aem.live/?milolibs=local', 'http://localhost:6456/libs'],
    ['https://main--da-marketo--adobecom.aem.live/?milolibs=awesome--milo--forkedowner', 'https://awesome--milo--forkedowner.aem.live/libs'],
    ['https://main--da-marketo--adobecom.aem.page/', 'https://main--milo--adobecom.aem.live/libs'],
    ['https://main--da-marketo--adobecom.aem.page/?milolibs=foo', 'https://foo--milo--adobecom.aem.live/libs'],
    ['https://main--da-marketo--adobecom.aem.page/?milolibs=local', 'http://localhost:6456/libs'],
    ['http://localhost:6586', 'https://main--milo--adobecom.aem.live/libs'],
    ['http://localhost:6586?milolibs=foo', 'https://foo--milo--adobecom.aem.live/libs'],
    ['http://localhost:6586?milolibs=local', 'http://localhost:6456/libs'],
    ['http://localhost:6586?milolibs=awesome--milo--forkedowner', 'https://awesome--milo--forkedowner.aem.live/libs'],
    ['https://content.da.live/adobecom/da-marketo', 'https://main--milo--adobecom.aem.live/libs'],
    ['https://content.da.live/adobecom/da-marketo?milolibs=foo', 'https://foo--milo--adobecom.aem.live/libs'],
    ['https://content.da.live/adobecom/da-marketo?milolibs=local', 'http://localhost:6456/libs'],
  ];

  tests.forEach(([url, expected]) => {
    it(`Sets libs for ${url}`, () => {
      const location = new URL(url);
      const libs = setLibs('/libs', location);
      expect(libs).to.equal(expected);
    });
  });

  it('Sets LIBS', () => {
    expect(LIBS).to.equal('https://main--milo--adobecom.aem.live/libs');
  });
});
