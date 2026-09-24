import { expect } from '@esm-bundle/chai';

// Regression guard for MWPW-199968: several locale state_translate-*.js files
// only carried a partial set of JP prefecture entries (missing 北海道, 愛知県,
// 神奈川県, 埼玉県, etc). translateDDlbls (mkto/scripts/90_build/cleaning_validation.js)
// skips sorting for Country=JP but only re-adds options that already have a
// translateState entry, so any prefecture missing from a locale file was
// silently dropped from the State dropdown for that locale — not just
// mistranslated. This test asserts every locale carries the full, identical
// 47-prefecture set defined in state_translate-ja_jp.js.

function loadClassicScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

const PREFECTURE_KEY = /^[\u4E00-\u9FFF]+[都道府県]$/;

function extractPrefectures(translateState) {
  return Object.fromEntries(
    Object.entries(translateState).filter(([key]) => PREFECTURE_KEY.test(key)),
  );
}

async function loadTranslateState(locale) {
  window.translateState = undefined;
  await loadClassicScript(`/mkto/scripts/80_translations/state_translate-${locale}.js`);
  const { translateState } = window;
  expect(translateState, `${locale}: window.translateState should be defined`).to.exist;
  return extractPrefectures(translateState);
}

const OTHER_LOCALES = [
  'cs', 'da', 'de', 'es_es', 'fi', 'fr_fr', 'it', 'ko', 'nl',
  'no', 'pl', 'pt', 'ru', 'sv', 'tr', 'zh_cn', 'zh_tw',
];

describe('state_translate-*.js: JP prefecture completeness (MWPW-199968)', () => {
  let referencePrefectures;

  before(async () => {
    referencePrefectures = await loadTranslateState('ja_jp');
  });

  it('state_translate-ja_jp.js defines all 47 JP prefectures', () => {
    expect(Object.keys(referencePrefectures)).to.have.lengthOf(47);
  });

  it('includes the previously-missing prefectures (regression check)', () => {
    ['北海道', '愛知県', '神奈川県', '埼玉県'].forEach((key) => {
      expect(referencePrefectures).to.have.property(key);
    });
  });

  OTHER_LOCALES.forEach((locale) => {
    it(`state_translate-${locale}.js carries all 47 prefectures, matching ja_jp`, async () => {
      const localePrefectures = await loadTranslateState(locale);
      expect(Object.keys(localePrefectures), `${locale}: prefecture count`).to.have.lengthOf(47);
      expect(localePrefectures, `${locale}: prefecture keys/values`).to.deep.equal(referencePrefectures);
    });
  });
});
