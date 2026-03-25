/**
 * Line-based LCS diff; unified-style text output. No external deps.
 */

export function normalizeNewlines(str) {
  return String(str).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

export function splitLines(str) {
  const n = normalizeNewlines(str);
  if (n.length === 0) return [];
  return n.split('\n');
}

/**
 * @param {string[]} oldLines
 * @param {string[]} newLines
 * @returns {{ type: 'same'|'del'|'add', line: string }[]}
 */
function buildEditScript(oldLines, newLines) {
  const m = oldLines.length;
  const n = newLines.length;
  const dp = new Array(m + 1);
  for (let i = 0; i <= m; i += 1) {
    dp[i] = new Array(n + 1);
    dp[i][0] = 0;
  }
  for (let j = 0; j <= n; j += 1) dp[0][j] = 0;
  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  const ops = [];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      ops.push({ type: 'same', line: oldLines[i - 1] });
      i -= 1;
      j -= 1;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.push({ type: 'add', line: newLines[j - 1] });
      j -= 1;
    } else {
      ops.push({ type: 'del', line: oldLines[i - 1] });
      i -= 1;
    }
  }
  ops.reverse();
  return ops;
}

/**
 * @param {string} a
 * @param {string} b
 * @param {string} labelA
 * @param {string} labelB
 * @returns {{ diffText: string, stats: { added: number, removed: number, unchanged: number } }}
 */
export function unifiedDiffWithStats(a, b, labelA, labelB) {
  const oldLines = splitLines(a);
  const newLines = splitLines(b);
  const ops = buildEditScript(oldLines, newLines);
  let added = 0;
  let removed = 0;
  let unchanged = 0;
  for (let k = 0; k < ops.length; k += 1) {
    const op = ops[k];
    if (op.type === 'add') added += 1;
    else if (op.type === 'del') removed += 1;
    else unchanged += 1;
  }
  const la = labelA || 'formA';
  const lb = labelB || 'formB';
  const lines = [`--- ${la}`, `+++ ${lb}`];
  for (let k = 0; k < ops.length; k += 1) {
    const op = ops[k];
    if (op.type === 'same') lines.push(` ${op.line}`);
    else if (op.type === 'del') lines.push(`-${op.line}`);
    else lines.push(`+${op.line}`);
  }
  return {
    diffText: lines.join('\n'),
    stats: { added, removed, unchanged },
  };
}

/**
 * @param {string} a
 * @param {string} b
 * @param {string} labelA
 * @param {string} labelB
 * @returns {string}
 */
export function unifiedDiff(a, b, labelA, labelB) {
  return unifiedDiffWithStats(a, b, labelA, labelB).diffText;
}

/**
 * @param {string} str
 * @returns {number}
 */
export function lineCount(str) {
  return splitLines(str).length;
}
