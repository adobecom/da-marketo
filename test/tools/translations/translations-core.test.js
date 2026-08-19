import { expect } from '@esm-bundle/chai';
import {
  FIELDS, LANGUAGES, validateLangCode, normalizeCell, isBlank, hasStrayPipe, countTranslated,
  addLanguageColumn, checkExportReady, composeExportColumn,
} from '../../../tools/translations/translations-core.js';

describe('translations-core: registry', () => {
  it('defines the 7 fields with unique keys and json paths', () => {
    expect(FIELDS).to.have.length(7);
    const keys = FIELDS.map((f) => f.key);
    expect(new Set(keys).size).to.equal(7);
    FIELDS.forEach((f) => expect(f.path).to.match(/^\/tools\/translations\/.+\.json$/));
  });
  it('flags job-role as the only field with regionalCols', () => {
    const jr = FIELDS.find((f) => f.key === 'job-role');
    expect(jr.regionalCols).to.eql(['anz', 'in', 'sea']);
    expect(FIELDS.filter((f) => f.regionalCols)).to.have.length(1);
  });
  it('lists 20 languages starting with en_us', () => {
    expect(LANGUAGES[0]).to.equal('en_us');
    expect(LANGUAGES).to.have.length(20);
  });
});

describe('translations-core: validateLangCode', () => {
  it('accepts and lowercases a two-letter code', () => {
    expect(validateLangCode('AR')).to.eql({ ok: true, code: 'ar' });
  });
  it('accepts a language_region code', () => {
    expect(validateLangCode('pt_br')).to.eql({ ok: true, code: 'pt_br' });
  });
  it('rejects a malformed code', () => {
    expect(validateLangCode('arabic').ok).to.be.false;
  });
  it('rejects a code already in LANGUAGES', () => {
    const res = validateLangCode('de', LANGUAGES);
    expect(res.ok).to.be.false;
    expect(res.error).to.match(/already/i);
  });
});

describe('translations-core: normalizeCell', () => {
  it('trims plain label input', () => {
    expect(normalizeCell('  Director  ', 'DIR')).to.eql({ value: 'Director', valid: true });
  });
  it('auto-strips a matching |VALUE suffix', () => {
    expect(normalizeCell('المدير|CXO_EVP', 'CXO_EVP')).to.eql({ value: 'المدير', valid: true });
  });
  it('flags a stray pipe whose suffix does not match value', () => {
    expect(normalizeCell('A|B|WRONG', 'CXO_EVP')).to.eql({ value: 'A|B|WRONG', valid: false });
  });
});

describe('translations-core: status', () => {
  const rows = [
    { value: 'A', ar: 'الف' },
    { value: 'B', ar: '' },
    { value: 'C', ar: '  ' },
    { value: 'D', ar: 'x|Y' },
  ];
  it('isBlank treats empty and whitespace as blank', () => {
    expect(isBlank('')).to.be.true;
    expect(isBlank('  ')).to.be.true;
    expect(isBlank('x')).to.be.false;
  });
  it('hasStrayPipe detects a pipe', () => {
    expect(hasStrayPipe('x|Y')).to.be.true;
    expect(hasStrayPipe('x')).to.be.false;
  });
  it('countTranslated counts non-blank, pipe-free cells', () => {
    expect(countTranslated(rows, 'ar')).to.eql({ done: 1, total: 4 });
  });
});

describe('translations-core: add/export', () => {
  it('addLanguageColumn adds an empty column immutably', () => {
    const rows = [{ value: 'A', label: 'Alpha' }];
    const next = addLanguageColumn(rows, 'ar');
    expect(next[0].ar).to.equal('');
    expect(rows[0].ar).to.be.undefined; // original untouched
  });
  it('checkExportReady counts blanks and stray pipes', () => {
    const rows = [
      { value: 'A', ar: 'x' }, { value: 'B', ar: '' }, { value: 'C', ar: 'y|Z' },
    ];
    expect(checkExportReady(rows, 'ar')).to.eql({ ready: false, blanks: 1, invalids: 1 });
  });
  it('composeExportColumn sorts by sortPosition and appends |value', () => {
    const rows = [
      { value: 'CXO_EVP', ar: 'المدير', sortPosition: '2' },
      { value: 'MGR', ar: 'مدير', sortPosition: '1' },
    ];
    expect(composeExportColumn(rows, 'ar')).to.equal('مدير|MGR\nالمدير|CXO_EVP');
  });
});
