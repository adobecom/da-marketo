import { expect } from '@esm-bundle/chai';

function buildFixture() {
  document.body.innerHTML = `
    <div id="mkto-diff-status" hidden></div>
    <div id="mkto-diff-summary-section" hidden>
      <ul id="mkto-diff-summary"></ul>
    </div>
    <div id="mkto-diff-details"></div>
    <input id="mkto-diff-form-a" />
    <datalist id="mkto-diff-list-a"></datalist>
    <button id="mkto-diff-flip" type="button"></button>
    <input id="mkto-diff-form-b" />
    <datalist id="mkto-diff-list-b"></datalist>
    <input type="checkbox" id="mkto-diff-ignore-structural" checked />
    <input type="checkbox" id="mkto-diff-ignore-whitespace" />
  `;
}

describe('mkto-diff flip button', () => {
  let inA;
  let inB;
  let flipBtn;

  before(async () => {
    buildFixture();
    // Executing init() side effects requires the DOM to already exist, so the
    // fixture must be built before this module is imported.
    await import('../../tools/mkto-diff/mkto-diff.js');
    inA = document.getElementById('mkto-diff-form-a');
    inB = document.getElementById('mkto-diff-form-b');
    flipBtn = document.getElementById('mkto-diff-flip');
  });

  beforeEach(() => {
    inA.value = '';
    inB.value = '';
  });

  it('swaps two numeric form ids', () => {
    inA.value = '2277';
    inB.value = '1723';
    flipBtn.click();
    expect(inA.value).to.equal('1723');
    expect(inB.value).to.equal('2277');
  });

  it('swaps a form id (A) with a branch name (B)', () => {
    inA.value = '2277';
    inB.value = 'main';
    flipBtn.click();
    expect(inA.value).to.equal('main');
    expect(inB.value).to.equal('2277');
  });

  it('swaps a branch name (A) with a form id (B)', () => {
    inA.value = 'main';
    inB.value = '2277';
    flipBtn.click();
    expect(inA.value).to.equal('2277');
    expect(inB.value).to.equal('main');
  });

  it('swaps two branch names', () => {
    inA.value = 'main';
    inB.value = 'diff';
    flipBtn.click();
    expect(inA.value).to.equal('diff');
    expect(inB.value).to.equal('main');
  });

  it('swaps an empty side too', () => {
    inA.value = '2277';
    inB.value = '';
    flipBtn.click();
    expect(inA.value).to.equal('');
    expect(inB.value).to.equal('2277');
  });
});
