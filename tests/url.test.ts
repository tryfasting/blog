import assert from 'node:assert/strict';
import { test } from 'node:test';
import { joinBase } from '../src/blog/lib/url.ts';

test('joinBase returns the base itself for the root path', () => {
  assert.equal(joinBase('/blog/', '/'), '/blog/');
  assert.equal(joinBase('/blog', '/'), '/blog/');
});

test('joinBase gives the same result whether or not the base ends with a slash', () => {
  assert.equal(joinBase('/blog/', '/tags/astro/'), '/blog/tags/astro/');
  assert.equal(joinBase('/blog', '/tags/astro/'), '/blog/tags/astro/');
});

test('joinBase accepts paths with no leading slash or with several', () => {
  assert.equal(joinBase('/blog/', 'rss.xml'), '/blog/rss.xml');
  assert.equal(joinBase('/blog/', '//rss.xml'), '/blog/rss.xml');
});

test('joinBase leaves the path unchanged when the base is the site root', () => {
  assert.equal(joinBase('/', '/general/'), '/general/');
});
