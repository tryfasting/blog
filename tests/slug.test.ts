import assert from 'node:assert/strict';
import { test } from 'node:test';
import { findSlugProblems, slugFromId, tagSlug } from '../src/blog/lib/slug.ts';

test('slugFromId drops the date prefix of a top-level post', () => {
  assert.equal(slugFromId('2026-10-16-blog-opened'), 'blog-opened');
});

test('slugFromId ignores the topic folder, so moving a post keeps its URL', () => {
  assert.equal(slugFromId('python/2026-10-20-uv-basics'), 'uv-basics');
});

test('slugFromId keeps a file name that has no date prefix', () => {
  assert.equal(slugFromId('python/uv-basics'), 'uv-basics');
});

test('slugFromId drops only the leading date, not a year inside the name', () => {
  assert.equal(slugFromId('2026-12-31-2026-review'), '2026-review');
});

test('tagSlug lowercases and joins words with hyphens', () => {
  assert.equal(tagSlug(' Machine   Learning '), 'machine-learning');
  assert.equal(tagSlug('astro'), 'astro');
});

test('findSlugProblems returns nothing for valid, unique slugs', () => {
  assert.deepEqual(
    findSlugProblems([
      { id: '2026-10-16-blog-opened', source: 'posts/2026-10-16-blog-opened.md' },
      { id: 'python/2026-10-20-uv-basics', source: 'posts/python/2026-10-20-uv-basics.md' },
    ]),
    [],
  );
});

test('findSlugProblems rejects uppercase, Korean, underscores and spaces', () => {
  for (const id of ['2026-10-16-Blog-Opened', '2026-10-16-블로그', '2026-10-16-blog_opened', '2026-10-16-blog opened']) {
    const problems = findSlugProblems([{ id, source: `posts/${id}.md` }]);
    assert.equal(problems.length, 1, id);
    assert.match(problems[0], /^- invalid slug ".+" in posts\/.+\.md/);
  }
});

test('findSlugProblems rejects the reserved slug "tags"', () => {
  const problems = findSlugProblems([{ id: '2026-10-16-tags', source: 'posts/2026-10-16-tags.md' }]);
  assert.deepEqual(problems, [
    '- invalid slug "tags" in posts/2026-10-16-tags.md (use YYYY-MM-DD-lowercase-kebab-case.md; "tags" is reserved)',
  ]);
});

test('findSlugProblems lists every file that shares a slug across folders', () => {
  const problems = findSlugProblems([
    { id: '2026-10-16-uv-basics', source: 'posts/2026-10-16-uv-basics.md' },
    { id: 'python/2026-10-20-uv-basics', source: 'posts/python/2026-10-20-uv-basics.md' },
  ]);
  assert.deepEqual(problems, [
    '- duplicate slug "uv-basics":\n    posts/2026-10-16-uv-basics.md\n    posts/python/2026-10-20-uv-basics.md',
  ]);
});
