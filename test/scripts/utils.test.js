import { expect } from '@esm-bundle/chai';
import { setLibs, getMarketoLibs } from '../../scripts/scripts.js';

describe('Libs', () => {
  it('Default Libs', () => {
    const libs = setLibs('/libs');
    expect(libs).to.equal('https://main--milo--adobecom.aem.live/libs');
  });

  it('Does not support milolibs query param on prod', () => {
    const location = {
      hostname: 'business.adobe.com',
      search: '?milolibs=foo',
    };
    const libs = setLibs('/libs', location);
    expect(libs).to.equal('/libs');
  });

  it('Supports milolibs query param', () => {
    const location = {
      hostname: 'localhost',
      search: '?milolibs=foo',
    };
    const libs = setLibs('/libs', location);
    expect(libs).to.equal('https://foo--milo--adobecom.aem.live/libs');
  });

  it('Supports local milolibs query param', () => {
    const location = {
      hostname: 'localhost',
      search: '?milolibs=local',
    };
    const libs = setLibs('/libs', location);
    expect(libs).to.equal('http://localhost:6456/libs');
  });

  it('Supports forked milolibs query param', () => {
    const location = {
      hostname: 'localhost',
      search: '?milolibs=awesome--milo--forkedowner',
    };
    const libs = setLibs('/libs', location);
    expect(libs).to.equal('https://awesome--milo--forkedowner.aem.live/libs');
  });
});

describe('Marketo Libs', () => {
  const tests = [
    // Prod hosts always use the co-located pipeline, even with a param.
    ['https://business.adobe.com', '../mkto/libs.js'],
    ['https://business.adobe.com?marketolibs=foo', '../mkto/libs.js'],
    // aem/page hosts with no param: co-located.
    ['https://main--da-marketo--adobecom.aem.live/', '../mkto/libs.js'],
    ['https://main--da-marketo--adobecom.aem.page/', '../mkto/libs.js'],
    // aem/page hosts with a branch param: load the block + scripts from that branch origin.
    ['https://main--da-marketo--adobecom.aem.live/?marketolibs=fix-privacy-links', 'https://fix-privacy-links--da-marketo--adobecom.aem.live/mkto/libs.js'],
    ['https://main--da-marketo--adobecom.aem.page/?marketolibs=foo', 'https://foo--da-marketo--adobecom.aem.live/mkto/libs.js'],
    ['https://main--da-marketo--adobecom.aem.live/?marketolibs=local', 'http://localhost:6586/mkto/libs.js'],
    ['https://main--da-marketo--adobecom.aem.live/?marketolibs=awesome--da-marketo--forkedowner', 'https://awesome--da-marketo--forkedowner.aem.live/mkto/libs.js'],
    // localhost dev server.
    ['http://localhost:6586/', '../mkto/libs.js'],
    ['http://localhost:6586/?marketolibs=foo', 'https://foo--da-marketo--adobecom.aem.live/mkto/libs.js'],
    ['http://localhost:6586/?marketolibs=local', 'http://localhost:6586/mkto/libs.js'],
  ];

  tests.forEach(([url, expected]) => {
    it(`Resolves marketo libs for ${url}`, () => {
      expect(getMarketoLibs(new URL(url))).to.equal(expected);
    });
  });

  it('Throws on an invalid marketolibs branch name', () => {
    expect(() => getMarketoLibs(new URL('https://main--da-marketo--adobecom.aem.live/?marketolibs=foo.bar')))
      .to.throw('Invalid marketolibs branch name');
  });
});
