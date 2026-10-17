import assert from 'node:assert/strict';
import { test } from 'node:test';
import { tagCounts } from '../src/blog/lib/tags.ts';

test('tagCounts counts how many posts carry each tag, most used first', () => {
  assert.deepEqual(tagCounts([['python', 'uv'], ['python'], ['astro', 'python']]), [
    { tag: 'python', slug: 'python', count: 3 },
    { tag: 'astro', slug: 'astro', count: 1 },
    { tag: 'uv', slug: 'uv', count: 1 },
  ]);
});

test('tagCounts orders tags with the same count by name', () => {
  assert.deepEqual(
    tagCounts([['zsh'], ['git'], ['css']]).map(({ tag }) => tag),
    ['css', 'git', 'zsh'],
  );
});

test('tagCounts merges tags that share a tag page, keeping the first spelling', () => {
  assert.deepEqual(tagCounts([['GitHub Actions'], ['github-actions']]), [
    { tag: 'GitHub Actions', slug: 'github-actions', count: 2 },
  ]);
});

test('tagCounts counts a tag once per post even if a post repeats it', () => {
  assert.deepEqual(tagCounts([['python', 'Python']]), [{ tag: 'python', slug: 'python', count: 1 }]);
});

test('tagCounts returns nothing when no post has tags', () => {
  assert.deepEqual(tagCounts([[], []]), []);
});
