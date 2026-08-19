import { expect } from '@esm-bundle/chai';
import { normalizeSheet, toSheetFormat, readFieldSheet, saveFieldSheet } from '../../../tools/translations/da-sheets.js';

describe('da-sheets', () => {
  it('normalizeSheet extracts data from a sheet envelope', () => {
    const json = { ':type': 'sheet', data: [{ value: 'A' }] };
    expect(normalizeSheet(json)).to.eql([{ value: 'A' }]);
  });
  it('normalizeSheet returns [] for a non-sheet payload', () => {
    expect(normalizeSheet({})).to.eql([]);
  });
  it('toSheetFormat wraps rows in a single-sheet envelope', () => {
    const out = toSheetFormat([{ value: 'A' }]);
    expect(out[':type']).to.equal('sheet');
    expect(out.total).to.equal(1);
    expect(out.data).to.eql([{ value: 'A' }]);
  });
  it('readFieldSheet GETs the source URL and normalizes', async () => {
    let calledUrl;
    let opts;
    const fake = async (url, o) => { calledUrl = url; opts = o; return { ok: true, json: async () => ({ ':type': 'sheet', data: [{ value: 'A' }] }) }; };
    const rows = await readFieldSheet('/tools/translations/country.json', fake);
    expect(calledUrl).to.equal('https://admin.da.live/source/adobecom/da-marketo/tools/translations/country.json');
    expect(opts.headers.accept).to.equal('application/json');
    expect(rows).to.eql([{ value: 'A' }]);
  });
  it('readFieldSheet returns null on non-ok response', async () => {
    const fake = async () => ({ ok: false });
    const result = await readFieldSheet('/tools/translations/country.json', fake);
    expect(result).to.be.null;
  });
  it('saveFieldSheet PUTs FormData and returns response.ok', async () => {
    let opts;
    const fake = async (url, o) => { opts = o; return { ok: true }; };
    const ok = await saveFieldSheet('/tools/translations/country.json', [{ value: 'A' }], fake);
    expect(ok).to.be.true;
    expect(opts.method).to.equal('PUT');
    expect(opts.body).to.be.instanceOf(FormData);
    expect(opts.body.get('data')).to.be.instanceOf(Blob);
    expect(opts.body.get('data').type).to.equal('application/json');
  });
});
