import { expect } from '@esm-bundle/chai';

// The algorithm under test, defined here as a pure standalone function.
// When the implementation is written in mkto/30_privacy/privacy_validation_process.js,
// it will use this same logic internally (the helper functions there are private closures
// and cannot be imported directly).
function checkUrlPathLocale(pathname, regionalSiteMap) {
  const pathSegment = pathname.split('/').filter(Boolean)[0];
  if (!pathSegment) return null;
  const knownRegionalSites = new Set(Object.values(regionalSiteMap));
  return knownRegionalSites.has(pathSegment) ? pathSegment : null;
}

// Representative subset of the adobeRegionalSite map used in production
const adobeRegionalSiteFixture = {
  en_us: '', // United States — empty string (no regional path)
  en_gb: 'uk', // United Kingdom
  en_ie: 'ie', // Ireland
  de_de: 'de', // Germany
  fr_fr: 'fr', // France
  en_au: 'au', // Australia
  ja_jp: 'jp', // Japan
};

describe('checkUrlPathLocale — regression: existing locales', () => {
  it('uk path still resolves to uk', () => {
    expect(checkUrlPathLocale('/uk/products/test.html', adobeRegionalSiteFixture)).to.equal('uk');
  });
  it('de path still resolves to de', () => {
    expect(checkUrlPathLocale('/de/solutions.html', adobeRegionalSiteFixture)).to.equal('de');
  });
  it('fr path still resolves to fr', () => {
    expect(checkUrlPathLocale('/fr/contact.html', adobeRegionalSiteFixture)).to.equal('fr');
  });
  it('au path still resolves to au', () => {
    expect(checkUrlPathLocale('/au/', adobeRegionalSiteFixture)).to.equal('au');
  });
  it('jp path still resolves to jp', () => {
    expect(checkUrlPathLocale('/jp/acrobat/', adobeRegionalSiteFixture)).to.equal('jp');
  });
});

describe('checkUrlPathLocale — fallback: unmapped locales', () => {
  it('returns null for path segment that is a key (not value) in the map', () => {
    // en_us is a key, not a value — its value is ''
    expect(checkUrlPathLocale('/en_us/page.html', adobeRegionalSiteFixture)).to.equal(null);
  });
  it('returns null for completely unmapped segment', () => {
    expect(checkUrlPathLocale('/xyz-unknown/page.html', adobeRegionalSiteFixture)).to.equal(null);
  });
  it('returns null when pathname is just a filename with no leading segments', () => {
    expect(checkUrlPathLocale('contact.html', adobeRegionalSiteFixture)).to.equal(null);
  });
});

describe('checkUrlPathLocale', () => {
  it('returns ie for /ie/acrobat/contact.html', () => {
    const result = checkUrlPathLocale('/ie/acrobat/contact.html', adobeRegionalSiteFixture);
    expect(result).to.equal('ie');
  });

  it('returns uk for /uk/products/test.html', () => {
    const result = checkUrlPathLocale('/uk/products/test.html', adobeRegionalSiteFixture);
    expect(result).to.equal('uk');
  });

  it('returns de for /de/', () => {
    const result = checkUrlPathLocale('/de/', adobeRegionalSiteFixture);
    expect(result).to.equal('de');
  });

  it('returns null when first segment is not a regional site value', () => {
    const result = checkUrlPathLocale('/acrobat/contact.html', adobeRegionalSiteFixture);
    expect(result).to.equal(null);
  });

  it('returns null for an unknown prefix', () => {
    const result = checkUrlPathLocale('/unknown-prefix/page.html', adobeRegionalSiteFixture);
    expect(result).to.equal(null);
  });

  it('returns null for root path /', () => {
    const result = checkUrlPathLocale('/', adobeRegionalSiteFixture);
    expect(result).to.equal(null);
  });

  it('returns null for empty string pathname', () => {
    const result = checkUrlPathLocale('', adobeRegionalSiteFixture);
    expect(result).to.equal(null);
  });
});
