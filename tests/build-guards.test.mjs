// Posts the build must refuse (it fails) or leave out (drafts). Each case runs a full `astro build`,
// so this file is slow and runs with `npm run test:build`, not `npm test`. Do not run it while
// `npm run dev` is up: the dev server would pick up the temporary posts.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
// Inside posts/ so the collection loads it; git-ignored in case a run is interrupted before cleanup.
const guardDir = join(root, 'posts', '__build-guard__');
// Separate output folder so a guard run never overwrites dist/.
const outDir = mkdtempSync(join(tmpdir(), 'blog-build-guard-'));
const astroCli = join(root, 'node_modules', 'astro', 'bin', 'astro.mjs');

after(() => rmSync(outDir, { recursive: true, force: true }));

function post({ title = 'Guard', date = '2026-01-01', description = 'Guard post.', body = 'Body.', draft = false } = {}) {
  const lines = [title && `title: ${title}`, `date: ${date}`, `description: ${description}`, draft && 'draft: true'];
  return `---\n${lines.filter(Boolean).join('\n')}\n---\n${body}\n`;
}

/** Every built HTML and XML file (pages, RSS, sitemap) as one string. */
function builtText() {
  return readdirSync(outDir, { recursive: true })
    .filter((file) => /\.(html|xml)$/.test(file))
    .map((file) => readFileSync(join(outDir, file), 'utf8'))
    .join('\n');
}

/** Writes the given files under posts/__build-guard__/, builds, and always removes them again. */
function buildWith(files) {
  rmSync(guardDir, { recursive: true, force: true });
  try {
    for (const [path, content] of Object.entries(files)) {
      mkdirSync(dirname(join(guardDir, path)), { recursive: true });
      writeFileSync(join(guardDir, path), content);
    }
    const result = spawnSync(process.execPath, [astroCli, 'build', '--outDir', outDir], { cwd: root, encoding: 'utf8' });
    const output = `${result.stdout}${result.stderr}`.replace(/\x1b\[[0-9;]*m/g, '');
    return { failed: result.status !== 0, output };
  } finally {
    rmSync(guardDir, { recursive: true, force: true });
  }
}

test('a valid post builds, so the failures below come from the posts and not from this harness', () => {
  const { failed, output } = buildWith({ '2026-01-01-guard-valid.md': post() });
  assert.equal(failed, false, output);
});

test('drafts are left out of every built page, the RSS feed and the sitemap', () => {
  // posts/_drafts/ may hold real drafts, so only this one file (and the folder, if this test made it) is removed.
  const draftsDir = join(root, 'posts', '_drafts');
  const madeDraftsDir = !existsSync(draftsDir);
  const draftsFile = join(draftsDir, '2026-01-01-guard-drafts-folder.md');
  mkdirSync(draftsDir, { recursive: true });
  writeFileSync(draftsFile, post({ title: 'GUARD-DRAFTS-FOLDER' }));
  try {
    const { failed, output } = buildWith({ '2026-01-01-guard-flagged.md': post({ title: 'GUARD-FLAGGED', draft: true }) });
    assert.equal(failed, false, output);
    const built = builtText();
    assert.match(built, /blog-opened/, 'the published post should still be built');
    assert.doesNotMatch(built, /GUARD-FLAGGED|guard-flagged|GUARD-DRAFTS-FOLDER|guard-drafts-folder/);
  } finally {
    rmSync(draftsFile, { force: true });
    if (madeDraftsDir) rmdirSync(draftsDir);
  }
});

test('the build fails and lists both files when two folders share a slug', () => {
  const { failed, output } = buildWith({
    '2026-01-01-guard-dup.md': post(),
    'sub/2026-01-02-guard-dup.md': post(),
  });
  assert.equal(failed, true);
  assert.match(output, /Blog post slug check failed/);
  assert.match(output, /duplicate slug "guard-dup"/);
  assert.match(output, /posts\/__build-guard__\/2026-01-01-guard-dup\.md/);
  assert.match(output, /posts\/__build-guard__\/sub\/2026-01-02-guard-dup\.md/);
});

test('the build fails on a Korean file name', () => {
  const { failed, output } = buildWith({ '2026-01-01-가드.md': post() });
  assert.equal(failed, true);
  assert.match(output, /invalid slug "가드"/);
});

test('the build fails on the reserved slug "tags"', () => {
  const { failed, output } = buildWith({ '2026-01-01-tags.md': post() });
  assert.equal(failed, true);
  assert.match(output, /invalid slug "tags"/);
});

test('the build fails when the required title is missing', () => {
  const { failed, output } = buildWith({ '2026-01-01-guard-notitle.md': post({ title: '' }) });
  assert.equal(failed, true);
  assert.match(output, /InvalidContentEntryDataError/);
  assert.match(output, /title: Required/);
});

test('the build fails when the date is not a date', () => {
  const { failed, output } = buildWith({ '2026-01-01-guard-baddate.md': post({ date: 'not-a-date' }) });
  assert.equal(failed, true);
  assert.match(output, /InvalidContentEntryDataError/);
  assert.match(output, /date: Expected type/);
});

test('the build fails when a linked image does not exist', () => {
  const { failed, output } = buildWith({ '2026-01-01-guard-noimage.md': post({ body: '![x](./images/none.png)' }) });
  assert.equal(failed, true);
  assert.match(output, /ImageNotFound/);
  assert.match(output, /\.\/images\/none\.png/);
});
