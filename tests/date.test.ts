import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatDate, isoDate } from '../src/blog/lib/date.ts';

// Frontmatter dates such as `date: 2026-10-16` are parsed as UTC midnight.
const octoberSixteenth = new Date('2026-10-16');

test('formatDate writes the frontmatter day as YYYY.MM.DD', () => {
  assert.equal(formatDate(octoberSixteenth), '2026.10.16');
});

test('formatDate pads single-digit months and days with a zero', () => {
  assert.equal(formatDate(new Date('2026-01-05')), '2026.01.05');
});

test('formatDate keeps the UTC day even late in the UTC evening', () => {
  assert.equal(formatDate(new Date('2026-10-16T23:30:00Z')), '2026.10.16');
});

test('isoDate writes the frontmatter day as YYYY-MM-DD', () => {
  assert.equal(isoDate(octoberSixteenth), '2026-10-16');
  assert.equal(isoDate(new Date('2026-01-05')), '2026-01-05');
});
