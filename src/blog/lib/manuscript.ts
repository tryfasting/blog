import { posix } from 'node:path';
import yaml from 'js-yaml';
import { slugFromId } from './slug.ts';

/** A manuscript in desk/: repo-relative POSIX path (e.g. `desk/python/2026-10-20-uv-basics.md`) and its text. */
export interface ManuscriptFile {
  path: string;
  text: string;
}

export interface ManuscriptContext {
  /** Slugs already in use, mapped to the file that uses them (posts and manuscripts accepted earlier). */
  takenSlugs: ReadonlyMap<string, string>;
  /** Whether a repo-relative POSIX path exists. Injected so the rules stay free of file system access. */
  fileExists: (path: string) => boolean;
}

const fileNamePattern = /^\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;
const reservedSlugs = new Set(['tags']);
// Same frontmatter block Astro reads (@astrojs/internal-helpers parseFrontmatter), YAML form only.
const frontmatterPattern = /(?:^﻿?|^\s*\n)---([\s\S]*?\n)---/;
const isoDayPattern = /^\d{4}-\d{2}-\d{2}$/;
const markdownImagePattern = /!\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g;

/**
 * Problems that would stop this manuscript from being previewed or registered; empty when it is fine.
 * Checks the same things the build checks (file name, slug, frontmatter schema, images) so that a
 * manuscript that passes here never breaks `npm run dev`.
 */
export function findManuscriptProblems(file: ManuscriptFile, context: ManuscriptContext): string[] {
  const fileName = posix.basename(file.path);
  if (!fileNamePattern.test(fileName)) {
    return [`파일명 규칙 위반: ${fileName} (YYYY-MM-DD-영문-kebab-case.md 형식이어야 함)`];
  }
  const slug = slugFromId(fileName.replace(/\.md$/, ''));
  if (reservedSlugs.has(slug)) return [`예약어라 쓸 수 없는 slug: ${slug}`];

  const block = frontmatterPattern.exec(file.text)?.[1];
  if (block === undefined) return ['frontmatter 없음: 맨 위 --- 사이에 title, date, description이 필요함'];
  let data: unknown;
  try {
    data = yaml.load(block);
  } catch (error) {
    return [`YAML 문법 오류: ${(error as Error).message.split('\n')[0]}`];
  }
  const fields = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>;

  const problems = [
    ...textField(fields, 'title'),
    ...dateField(fields.date),
    ...textField(fields, 'description'),
    ...optionalFields(fields),
  ];
  const owner = context.takenSlugs.get(slug);
  if (owner) problems.push(`slug 중복: ${slug} (${owner})`);
  for (const image of localImages(file.text)) {
    if (!context.fileExists(posix.join(posix.dirname(file.path), image.decoded))) problems.push(`이미지 없음: ${image.written}`);
  }
  return problems;
}

function textField(fields: Record<string, unknown>, name: string): string[] {
  const value = fields[name];
  if (value === undefined || value === null || value === '') return [`${name} 없음`];
  return typeof value === 'string' ? [] : [`${name}은 글자여야 함`];
}

function dateField(value: unknown): string[] {
  if (value === undefined || value === null) return ['date 없음'];
  // js-yaml turns an unquoted 2026-10-20 into a Date; a quoted one stays a string.
  if (value instanceof Date && !Number.isNaN(value.getTime())) return [];
  if (typeof value === 'string' && isoDayPattern.test(value) && !Number.isNaN(Date.parse(value))) return [];
  return typeof value === 'string' ? [`date 형식 오류: ${value} (YYYY-MM-DD여야 함)`] : ['date 형식 오류: YYYY-MM-DD여야 함'];
}

function optionalFields(fields: Record<string, unknown>): string[] {
  const problems: string[] = [];
  const { tags, draft } = fields;
  if (tags !== undefined && !(Array.isArray(tags) && tags.every((tag) => typeof tag === 'string' && tag !== ''))) {
    problems.push('tags는 글자 목록이어야 함 (예: [python, uv])');
  }
  if (draft !== undefined && typeof draft !== 'boolean') problems.push('draft는 true 또는 false여야 함');
  return problems;
}

/** Relative image links (`![..](./images/a.png)`); web, root-relative and data URLs are left to the browser. */
function localImages(text: string): { written: string; decoded: string }[] {
  return [...text.matchAll(markdownImagePattern)]
    .map((match) => match[1])
    .filter((src) => !/^(?:[a-z]+:|\/|#)/i.test(src))
    .map((src) => ({ written: src, decoded: safeDecode(src) }));
}

function safeDecode(value: string): string {
  try {
    return decodeURI(value);
  } catch {
    return value;
  }
}
