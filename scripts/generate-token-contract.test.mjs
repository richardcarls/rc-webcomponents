import assert from 'node:assert/strict';
import test from 'node:test';

import {
  expandFallback,
  generateTokenContract,
  syntaxError,
  validateContract,
} from './generate-token-contract.mjs';
import { groups, tokens } from '../packages/rc-webcomponents/themes/token-contract.mjs';

test('the token contract is valid', () => {
  assert.deepEqual(validateContract({ groups, tokens }), []);
});

test('generated token outputs match the contract', async () => {
  const { drift } = await generateTokenContract({ check: true });

  assert.deepEqual(drift, []);
});

test('accepts syntax strings with data types, keywords, and multipliers', () => {
  assert.equal(syntaxError('*'), null);
  assert.equal(syntaxError('<number> | normal | bold'), null);
  assert.equal(syntaxError('<length>+ | <color>#'), null);
});

test('rejects unknown data types, CSS-wide keywords, and malformed components', () => {
  assert.match(syntaxError('<easing-function>'), /unknown data type/);
  assert.match(syntaxError('<length> | inherit'), /CSS-wide keyword/);
  assert.match(syntaxError('<length> | 2px'), /invalid component/);
});

test('reports unknown references, cycles, keyword defaults, and missing groups', () => {
  const problems = validateContract({
    groups: [{ id: 'g', title: 'G' }],
    tokens: {
      '--rc-a': { group: 'g', default: 'var(--rc-b)', syntax: '*', description: 'A' },
      '--rc-b': { group: 'g', default: 'var(--rc-a)', syntax: '*', description: 'B' },
      '--rc-c': { group: 'g', default: 'var(--rc-missing)', syntax: '*', description: 'C' },
      '--rc-d': { group: 'g', default: 'inherit', syntax: '*', description: 'D' },
      '--rc-e': { group: 'other', default: '1px', syntax: '<length>', description: 'E' },
    },
  });

  assert.ok(problems.some((problem) => problem.includes('cyclic default')));
  assert.ok(problems.some((problem) => problem.includes('unknown token --rc-missing')));
  assert.ok(problems.some((problem) => problem.includes('--rc-d: a CSS-wide keyword default')));
  assert.ok(problems.some((problem) => problem.includes('--rc-e: unknown group')));
});

test('expands nested references and keeps unset references without a fallback', () => {
  const contract = {
    '--rc-a': { default: 'var(--rc-b) var(--rc-c)' },
    '--rc-b': { default: '1px' },
    '--rc-c': { default: null },
  };

  assert.equal(expandFallback(contract, '--rc-a'), 'var(--rc-b, 1px) var(--rc-c)');
});
