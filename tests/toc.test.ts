import assert from 'node:assert/strict';
import { test } from 'node:test';
import { tocItems } from '../src/blog/lib/toc.ts';

const heading = (depth: number, text: string) => ({ depth, slug: text.toLowerCase().replace(/\s+/g, '-'), text });

test('tocItems keeps h2 and h3 headings in document order', () => {
  const items = tocItems([heading(2, 'Setup'), heading(3, 'Install'), heading(2, 'Usage'), heading(3, 'Options')]);
  assert.deepEqual(items, [
    { depth: 2, slug: 'setup', text: 'Setup' },
    { depth: 3, slug: 'install', text: 'Install' },
    { depth: 2, slug: 'usage', text: 'Usage' },
    { depth: 3, slug: 'options', text: 'Options' },
  ]);
});

test('tocItems leaves out h1 and h4 or deeper', () => {
  const items = tocItems([heading(1, 'Title'), heading(2, 'A'), heading(4, 'Deep'), heading(2, 'B'), heading(2, 'C')]);
  assert.deepEqual(items.map((item) => item.text), ['A', 'B', 'C']);
});

test('tocItems returns nothing when a post has fewer headings than the minimum', () => {
  assert.deepEqual(tocItems([heading(2, 'Only'), heading(3, 'Two')]), []);
  assert.deepEqual(tocItems([]), []);
});

test('tocItems accepts a different minimum', () => {
  assert.equal(tocItems([heading(2, 'A'), heading(2, 'B')], 2).length, 2);
});
