import { expect } from '@esm-bundle/chai';
import { mapHeader, migrateRow } from '../../../tools/translations/migrate/parse-workbook.js';

describe('parse-workbook: mapHeader', () => {
  it('maps known helper headers', () => {
    expect(mapHeader('Sort Position')).to.equal('sortPosition');
    expect(mapHeader('Value')).to.equal('value');
    expect(mapHeader('Active Translation')).to.equal('activeTranslation');
  });
  it('lowercases language headers unchanged', () => {
    expect(mapHeader('en_US')).to.equal('en_us');
  });
});

describe('parse-workbook: migrateRow', () => {
  const langCols = ['en_us', 'de'];
  it('strips matching |VALUE and stores label only', () => {
    const raw = {
      Label: 'CXO/EVP',
      Value: 'CXO_EVP',
      'Sort Position': '2',
      en_us: 'CXO/EVP|CXO_EVP',
      de: 'Geschäftsführer|CXO_EVP',
    };
    const { row, issues } = migrateRow(raw, langCols);
    expect(row.value).to.equal('CXO_EVP');
    expect(row.label).to.equal('CXO/EVP');
    expect(row.sortPosition).to.equal('2');
    expect(row.en_us).to.equal('CXO/EVP');
    expect(row.de).to.equal('Geschäftsführer');
    expect(issues).to.eql([]);
  });
  it('records an issue when |VALUE does not match value', () => {
    const raw = { Label: 'X', Value: 'CXO_EVP', en_us: 'X|WRONG', de: '' };
    const { row, issues } = migrateRow(raw, langCols);
    expect(row.en_us).to.equal('X|WRONG'); // left as-is, flagged
    expect(issues).to.deep.include({ value: 'CXO_EVP', lang: 'en_us', cell: 'X|WRONG', reason: 'value-mismatch' });
    expect(issues).to.deep.include({ value: 'CXO_EVP', lang: 'de', cell: '', reason: 'blank' });
  });
});
