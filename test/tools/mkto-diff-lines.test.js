import { expect } from '@esm-bundle/chai';
import {
  normalizeNewlines,
  splitLines,
  unifiedDiffWithStats,
  unifiedDiff,
  lineCount,
} from '../../tools/mkto-diff/mkto-diff-lines.js';

describe('normalizeNewlines', () => {
  it('converts CRLF to LF', () => {
    expect(normalizeNewlines('a\r\nb\r\nc')).to.equal('a\nb\nc');
  });

  it('converts lone CR to LF', () => {
    expect(normalizeNewlines('a\rb\rc')).to.equal('a\nb\nc');
  });

  it('leaves LF untouched', () => {
    expect(normalizeNewlines('a\nb\nc')).to.equal('a\nb\nc');
  });
});

describe('splitLines', () => {
  it('returns an empty array for an empty string', () => {
    expect(splitLines('')).to.deep.equal([]);
  });

  it('returns a single-element array for a line with no newline', () => {
    expect(splitLines('foo')).to.deep.equal(['foo']);
  });

  it('splits a multi-line string', () => {
    expect(splitLines('a\nb\nc')).to.deep.equal(['a', 'b', 'c']);
  });

  it('normalizes CRLF input before splitting', () => {
    expect(splitLines('a\r\nb\r\nc')).to.deep.equal(['a', 'b', 'c']);
  });
});

describe('lineCount', () => {
  it('is 0 for an empty string', () => {
    expect(lineCount('')).to.equal(0);
  });

  it('matches splitLines(...).length for a single line', () => {
    expect(lineCount('foo')).to.equal(splitLines('foo').length);
  });

  it('matches splitLines(...).length for a multi-line string', () => {
    const str = 'a\nb\nc\nd';
    expect(lineCount(str)).to.equal(splitLines(str).length);
  });
});

describe('unifiedDiffWithStats', () => {
  it('reports no changes for identical input', () => {
    const str = 'a\nb\nc';
    const { diffText, stats } = unifiedDiffWithStats(str, str);
    expect(stats).to.deep.equal({ added: 0, removed: 0, unchanged: 3 });
    const bodyLines = diffText.split('\n').slice(2);
    expect(bodyLines).to.deep.equal([' a', ' b', ' c']);
  });

  it('counts a single changed line as one removal and one addition', () => {
    const a = 'a\nb\nc';
    const b = 'a\nx\nc';
    const { stats } = unifiedDiffWithStats(a, b);
    expect(stats).to.deep.equal({ added: 1, removed: 1, unchanged: 2 });
  });

  it('counts a pure addition', () => {
    const a = 'a\nc';
    const b = 'a\nb\nc';
    const { stats } = unifiedDiffWithStats(a, b);
    expect(stats).to.deep.equal({ added: 1, removed: 0, unchanged: 2 });
  });

  it('counts a pure removal', () => {
    const a = 'a\nb\nc';
    const b = 'a\nc';
    const { stats } = unifiedDiffWithStats(a, b);
    expect(stats).to.deep.equal({ added: 0, removed: 1, unchanged: 2 });
  });

  it('uses default labels when labelA/labelB are falsy', () => {
    const { diffText } = unifiedDiffWithStats('a', 'a', '', undefined);
    const headers = diffText.split('\n').slice(0, 2);
    expect(headers).to.deep.equal(['--- formA', '+++ formB']);
  });

  it('uses custom labels when provided', () => {
    const { diffText } = unifiedDiffWithStats('a', 'a', 'left.js', 'right.js');
    const headers = diffText.split('\n').slice(0, 2);
    expect(headers).to.deep.equal(['--- left.js', '+++ right.js']);
  });

  it('prefixes removed lines from a with "-" and added lines from b with "+"', () => {
    const a = 'a\nb\nc';
    const b = 'a\nx\nc';
    const { diffText } = unifiedDiffWithStats(a, b);
    const bodyLines = diffText.split('\n').slice(2);
    expect(bodyLines).to.deep.equal([' a', '-b', '+x', ' c']);
  });

  it('treats a whitespace-only change as a diff by default', () => {
    const a = '  foo();\nbar();';
    const b = 'foo();\nbar();';
    const { stats } = unifiedDiffWithStats(a, b);
    expect(stats.added).to.be.greaterThan(0);
    expect(stats.removed).to.be.greaterThan(0);
  });

  it('ignores a whitespace-only change when given a whitespace-stripping lineKey', () => {
    const a = '  foo();\nbar();';
    const b = 'foo();\nbar();';
    const lineKey = (l) => l.replace(/\s+/g, '');
    const { stats } = unifiedDiffWithStats(a, b, undefined, undefined, { lineKey });
    expect(stats.added).to.equal(0);
    expect(stats.removed).to.equal(0);
  });

  it('completes within a generous time budget on a large input with a lineKey', () => {
    const lineCountTotal = 1500;
    const aLines = [];
    const bLines = [];
    for (let i = 0; i < lineCountTotal; i += 1) {
      const code = `const value${i} = doSomething(${i});`;
      aLines.push(i % 5 === 0 ? `  ${code}` : code);
      bLines.push(code);
    }
    const a = aLines.join('\n');
    const b = bLines.join('\n');
    const lineKey = (l) => l.replace(/\s+/g, '');

    const start = Date.now();
    const { stats } = unifiedDiffWithStats(a, b, undefined, undefined, { lineKey });
    const elapsed = Date.now() - start;

    expect(elapsed).to.be.lessThan(2000);
    expect(stats.added).to.equal(0);
    expect(stats.removed).to.equal(0);
  });
});

describe('unifiedDiff', () => {
  it('delegates to unifiedDiffWithStats and returns its diffText', () => {
    const a = 'a\nb\nc';
    const b = 'a\nx\nc';
    const expected = unifiedDiffWithStats(a, b, 'left.js', 'right.js').diffText;
    expect(unifiedDiff(a, b, 'left.js', 'right.js')).to.equal(expected);
  });
});
