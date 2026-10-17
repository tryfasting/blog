import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readingMinutes } from '../src/blog/lib/reading.ts';

test('readingMinutes counts 500 non-space characters as one minute', () => {
  assert.equal(readingMinutes('가'.repeat(1000)), 2);
});

test('readingMinutes ignores spaces and line breaks', () => {
  assert.equal(readingMinutes(`${'가 '.repeat(500)}\n\n${'나\n'.repeat(500)}`), 2);
});

test('readingMinutes rounds to the nearest minute', () => {
  assert.equal(readingMinutes('가'.repeat(1240)), 2);
  assert.equal(readingMinutes('가'.repeat(1260)), 3);
});

test('readingMinutes never shows less than one minute', () => {
  assert.equal(readingMinutes('짧은 글'), 1);
  assert.equal(readingMinutes(''), 1);
});
