import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { checkDeskFile, scanDesk } from '../src/blog/desk.ts';

const root = mkdtempSync(join(tmpdir(), 'desk-scan-'));
after(() => rmSync(root, { recursive: true, force: true }));

const post = (title: string) => `---\ntitle: ${title}\ndate: 2026-10-20\ndescription: d\n---\n본문\n`;
function write(path: string, text: string): void {
  mkdirSync(join(root, path, '..'), { recursive: true });
  writeFileSync(join(root, path), text);
}

write('posts/2026-10-16-blog-opened.md', post('열었습니다'));
write('desk/2026-10-16-blog-opened.md', post('열었습니다 (원본)'));
write('desk/python/2026-10-20-uv-basics.md', post('uv'));
write('desk/메모.md', '메모\n');
write('desk/.obsidian/2026-10-20-hidden.md', post('hidden'));

test('scanDesk sorts manuscripts into included, excluded and registered', () => {
  const scan = scanDesk(root);
  assert.deepEqual(scan.included, ['desk/python/2026-10-20-uv-basics.md']);
  assert.deepEqual(scan.excluded.map(({ path }) => path), ['desk/메모.md']);
  assert.deepEqual(scan.registered, [{ path: 'desk/2026-10-16-blog-opened.md', post: 'posts/2026-10-16-blog-opened.md' }]);
});

test('scanDesk skips hidden folders such as .obsidian', () => {
  const scan = scanDesk(root);
  const all = [...scan.included, ...scan.excluded.map(({ path }) => path), ...scan.registered.map(({ path }) => path)];
  assert.equal(all.some((path) => path.includes('.obsidian')), false);
});

test('checkDeskFile reports one manuscript, accepting OS-style paths', () => {
  assert.deepEqual(checkDeskFile(join(root, 'desk', 'python', '2026-10-20-uv-basics.md'), root), {
    path: 'desk/python/2026-10-20-uv-basics.md',
    status: 'ok',
    problems: [],
  });
  assert.deepEqual(checkDeskFile('desk/2026-10-16-blog-opened.md', root), {
    path: 'desk/2026-10-16-blog-opened.md',
    status: 'registered',
    problems: [],
    post: 'posts/2026-10-16-blog-opened.md',
  });
  assert.equal(checkDeskFile('desk/메모.md', root).status, 'excluded');
});

test('checkDeskFile refuses a file outside desk/', () => {
  assert.equal(checkDeskFile('posts/2026-10-16-blog-opened.md', root).status, 'excluded');
});
