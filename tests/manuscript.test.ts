import assert from 'node:assert/strict';
import { test } from 'node:test';
import { findManuscriptProblems, type ManuscriptContext } from '../src/blog/lib/manuscript.ts';

const valid = `---
title: uv 기초
date: 2026-10-20
description: uv로 Python 프로젝트를 만드는 순서.
tags: [python, uv]
---
본문 ![흐름](./images/flow.png)
`;

function context(overrides: Partial<ManuscriptContext> = {}): ManuscriptContext {
  return { takenSlugs: new Map(), fileExists: () => true, ...overrides };
}

const check = (path: string, text: string, ctx = context()) => findManuscriptProblems({ path, text }, ctx);

test('a manuscript that follows the template has no problems', () => {
  assert.deepEqual(check('desk/python/2026-10-20-uv-basics.md', valid), []);
});

test('the file name must be YYYY-MM-DD-lowercase-kebab-case.md', () => {
  const [problem] = check('desk/메모.md', valid);
  assert.match(problem, /^파일명 규칙 위반: 메모\.md/);
  assert.match(check('desk/2026-10-20-UV-Basics.md', valid)[0], /^파일명 규칙 위반/);
});

test('the reserved slug "tags" is refused', () => {
  assert.deepEqual(check('desk/2026-10-20-tags.md', valid), ['예약어라 쓸 수 없는 slug: tags']);
});

test('a note without frontmatter is reported as such', () => {
  assert.deepEqual(check('desk/2026-10-20-note.md', '그냥 메모\n'), [
    'frontmatter 없음: 맨 위 --- 사이에 title, date, description이 필요함',
  ]);
});

test('broken YAML is reported with the parser message', () => {
  const [problem] = check('desk/2026-10-20-note.md', '---\ntitle: [unclosed\n---\n');
  assert.match(problem, /^YAML 문법 오류: /);
});

test('every missing required field is listed', () => {
  assert.deepEqual(check('desk/2026-10-20-note.md', '---\ntags: [a]\n---\n'), ['title 없음', 'date 없음', 'description 없음']);
});

test('template placeholders and wrong types are refused', () => {
  const text = '---\ntitle: {{title}}\ndate: {{date:YYYY-MM-DD}}\ndescription: 123\n---\n';
  assert.deepEqual(check('desk/2026-10-20-note.md', text), [
    'title은 글자여야 함',
    'date 형식 오류: YYYY-MM-DD여야 함',
    'description은 글자여야 함',
  ]);
});

test('a date written with slashes is refused, with the value shown', () => {
  const text = '---\ntitle: t\ndate: 2026/10/20\ndescription: d\n---\n';
  assert.deepEqual(check('desk/2026-10-20-note.md', text), ['date 형식 오류: 2026/10/20 (YYYY-MM-DD여야 함)']);
});

test('tags must be a list of words and draft must be true or false', () => {
  const text = '---\ntitle: t\ndate: 2026-10-20\ndescription: d\ntags: python\ndraft: maybe\n---\n';
  assert.deepEqual(check('desk/2026-10-20-note.md', text), ['tags는 글자 목록이어야 함 (예: [python, uv])', 'draft는 true 또는 false여야 함']);
});

test('a slug already used by a post or another manuscript is refused, naming that file', () => {
  const takenSlugs = new Map([['uv-basics', 'posts/2026-10-01-uv-basics.md']]);
  assert.deepEqual(check('desk/2026-10-20-uv-basics.md', valid, context({ takenSlugs })), [
    'slug 중복: uv-basics (posts/2026-10-01-uv-basics.md)',
  ]);
});

test('a linked local image must exist next to the manuscript', () => {
  const seen: string[] = [];
  const fileExists = (path: string) => {
    seen.push(path);
    return false;
  };
  assert.deepEqual(check('desk/python/2026-10-20-uv-basics.md', valid, context({ fileExists })), ['이미지 없음: ./images/flow.png']);
  assert.deepEqual(seen, ['desk/python/images/flow.png']);
});

test('web images and image paths with spaces are handled', () => {
  const text = valid.replace('./images/flow.png', 'https://example.test/a.png') + '![b](images/my%20shot.png)\n';
  const seen: string[] = [];
  check('desk/2026-10-20-uv-basics.md', text, context({ fileExists: (p) => (seen.push(p), true) }));
  assert.deepEqual(seen, ['desk/images/my shot.png']);
});
