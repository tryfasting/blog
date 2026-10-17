// Scans the desk/ writing folder for manuscripts that can be previewed in `npm run dev`.
// Used by src/content.config.ts (dev only) and by `npm run desk:check`. Never runs in a build.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { findManuscriptProblems } from './lib/manuscript.ts';
import { slugFromId } from './lib/slug.ts';

export interface DeskScan {
  checkedAt: string;
  /** Repo-relative POSIX paths of manuscripts that pass every check. */
  included: string[];
  excluded: { path: string; problems: string[] }[];
}

export const deskDir = 'desk';
export const deskLogPath = join('logs', 'desk-check.log');

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
  for (const path of markdownFiles(root, 'posts')) {
    takenSlugs.set(slugFromId(path.split('/').pop()!.replace(/\.md$/, '')), path);
  }
  const scan: DeskScan = { checkedAt: koreaTime(new Date()), included: [], excluded: [] };
  for (const path of markdownFiles(root, deskDir).sort()) {
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
      takenSlugs.set(slugFromId(path.split('/').pop()!.replace(/\.md$/, '')), path);
    }
  }
  return scan;
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
