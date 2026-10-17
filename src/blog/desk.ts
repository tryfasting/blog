// Scans the desk/ writing folder for manuscripts that can be previewed in `npm run dev`.
// Used by src/content.config.ts (dev only), `npm run desk:check` and the publish tool. Never runs in a build.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { isAbsolute, join, relative, sep } from 'node:path';
import { findManuscriptProblems } from './lib/manuscript.ts';
import { slugFromId } from './lib/slug.ts';

export interface DeskScan {
  checkedAt: string;
  /** Repo-relative POSIX paths of manuscripts that pass every check. */
  included: string[];
  excluded: { path: string; problems: string[] }[];
  /** Manuscripts whose file is already in posts/ (registered earlier). Not previewed; posts/ shows that post. */
  registered: { path: string; post: string }[];
}

/** One manuscript's result, as the publish tool reads it from `npm run desk:check -- --file <path> --json`. */
export interface DeskFileCheck {
  path: string;
  status: 'ok' | 'excluded' | 'registered';
  problems: string[];
  post?: string;
}

export const deskDir = 'desk';
export const deskLogPath = join('logs', 'desk-check.log');

const fileName = (path: string) => path.split('/').pop()!;
const slugOf = (path: string) => slugFromId(fileName(path).replace(/\.md$/, ''));

/** Markdown files under `dir`, skipping hidden folders such as Obsidian's `.obsidian/`. */
function markdownFiles(root: string, dir: string): string[] {
  const absolute = join(root, dir);
  if (!existsSync(absolute)) return [];
  return readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith('.')) return [];
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) return markdownFiles(root, path);
    return entry.name.endsWith('.md') ? [path] : [];
  });
}

export function scanDesk(root = process.cwd()): DeskScan {
  const takenSlugs = new Map<string, string>();
  const postsByName = new Map<string, string>();
  for (const path of markdownFiles(root, 'posts')) {
    takenSlugs.set(slugOf(path), path);
    postsByName.set(fileName(path), path);
  }
  const scan: DeskScan = { checkedAt: koreaTime(new Date()), included: [], excluded: [], registered: [] };
  for (const path of markdownFiles(root, deskDir).sort()) {
    // Same file name as a post: this is the original of a registered post, not a slug clash.
    const post = postsByName.get(fileName(path));
    if (post) {
      scan.registered.push({ path, post });
      continue;
    }
    const text = readFileSync(join(root, path), 'utf8');
    const problems = findManuscriptProblems(
      { path, text },
      { takenSlugs, fileExists: (candidate) => existsSync(join(root, candidate)) },
    );
    if (problems.length > 0) {
      scan.excluded.push({ path, problems });
    } else {
      scan.included.push(path);
      // Later manuscripts may not reuse this slug either.
      takenSlugs.set(slugOf(path), path);
    }
  }
  return scan;
}

/** The scan result for one manuscript; `file` may be absolute or repo-relative, with either slash. */
export function checkDeskFile(file: string, root = process.cwd()): DeskFileCheck {
  const path = (isAbsolute(file) ? relative(root, file) : file).split(sep).join('/').replace(/^\.\//, '');
  if (!path.startsWith(`${deskDir}/`) || !path.endsWith('.md')) {
    return { path, status: 'excluded', problems: ['desk/ 안의 .md 파일이 아님'] };
  }
  const scan = scanDesk(root);
  if (scan.included.includes(path)) return { path, status: 'ok', problems: [] };
  const registered = scan.registered.find((entry) => entry.path === path);
  if (registered) return { path, status: 'registered', problems: [], post: registered.post };
  const excluded = scan.excluded.find((entry) => entry.path === path);
  return { path, status: 'excluded', problems: excluded?.problems ?? ['파일이 없거나 숨김 폴더 안에 있음'] };
}

/** "2026-10-17 23:02:09 KST": the owner reads logs in Korean time regardless of the machine's time zone. */
function koreaTime(date: Date): string {
  return `${date.toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' })} KST`;
}

export function formatDeskReport(scan: DeskScan): string {
  const lines = [
    `desk 원고 검사 ${scan.checkedAt}`,
    `포함 ${scan.included.length}개 (npm run dev에서 "초안"으로 보임)`,
    ...scan.included.map((path) => `  + ${path}`),
    `제외 ${scan.excluded.length}개`,
    ...scan.excluded.flatMap(({ path, problems }) => [`  - ${path}`, ...problems.map((problem) => `      ${problem}`)]),
    `등록됨 ${scan.registered.length}개 (posts/에 같은 파일이 있어 미리보기에서는 등록된 글이 보임)`,
    ...scan.registered.map(({ path, post }) => `  = ${path} → ${post}`),
  ];
  return `${lines.join('\n')}\n`;
}

/** Overwrites logs/desk-check.log with the latest scan and returns its path. */
export function writeDeskLog(scan: DeskScan, root = process.cwd()): string {
  mkdirSync(join(root, 'logs'), { recursive: true });
  writeFileSync(join(root, deskLogPath), formatDeskReport(scan), 'utf8');
  return relative(root, join(root, deskLogPath)).split(sep).join('/');
}

/** Escapes glob syntax so a manuscript path (desk folders may contain brackets or parentheses) matches only itself. */
export function literalGlob(path: string): string {
  return path.replace(/[\\*?{}()[\]!+@]/g, (char) => `\\${char}`);
}
