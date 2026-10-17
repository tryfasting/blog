import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isDraft, isVisible } from '../src/blog/lib/draft.ts';

test('isDraft is true when the frontmatter says draft: true', () => {
  assert.equal(isDraft({ id: '2026-10-17-wip', draft: true }), true);
});

test('isDraft is true for a manuscript from desk/, even with draft: false', () => {
  assert.equal(isDraft({ id: 'desk/python/2026-10-17-wip', draft: false }), true);
});

test('isDraft is false for a registered post', () => {
  assert.equal(isDraft({ id: '2026-10-20-uv-basics', draft: false }), false);
});

test('isDraft does not treat a post whose name merely starts with "desk" as a manuscript', () => {
  assert.equal(isDraft({ id: 'desktop-notes/2026-10-17-note', draft: false }), false);
});

test('isVisible hides drafts unless drafts are included', () => {
  const draft = { id: 'desk/2026-10-17-wip', draft: false };
  assert.equal(isVisible(draft, { includeDrafts: false }), false);
  assert.equal(isVisible(draft, { includeDrafts: true }), true);
});

test('isVisible always shows published posts', () => {
  const published = { id: '2026-10-16-blog-opened', draft: false };
  assert.equal(isVisible(published, { includeDrafts: false }), true);
  assert.equal(isVisible(published, { includeDrafts: true }), true);
});
