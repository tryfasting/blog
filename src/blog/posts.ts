import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

const datePrefix = /^\d{4}-\d{2}-\d{2}-/;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// Slugs that would collide with fixed routes under /blog/.
const reservedSlugs = new Set(['tags']);

/** URL slug: file name without folders and without the `YYYY-MM-DD-` prefix. */
export function postSlug(post: Post): string {
  const fileName = post.id.split('/').pop() ?? post.id;
  return fileName.replace(datePrefix, '');
}

export function postSource(post: Post): string {
  return post.filePath ?? `posts/${post.id}.md`;
}

/** Fails the build on invalid or duplicated slugs, listing the offending files. */
function assertValidSlugs(posts: Post[]): void {
  const problems: string[] = [];
  const bySlug = new Map<string, string[]>();
  for (const post of posts) {
    const slug = postSlug(post);
    if (!slugPattern.test(slug) || reservedSlugs.has(slug)) {
      problems.push(`- invalid slug "${slug}" in ${postSource(post)} (use YYYY-MM-DD-lowercase-kebab-case.md; "tags" is reserved)`);
    }
    bySlug.set(slug, [...(bySlug.get(slug) ?? []), postSource(post)]);
  }
  for (const [slug, files] of bySlug) {
    if (files.length > 1) problems.push(`- duplicate slug "${slug}":\n${files.map((file) => `    ${file}`).join('\n')}`);
  }
  if (problems.length > 0) throw new Error(`Blog post slug check failed:\n${problems.join('\n')}`);
}

/** Published posts, newest first. Drafts are excluded everywhere (lists, pages, RSS, sitemap). */
export async function getPublishedPosts(): Promise<Post[]> {
  const all = await getCollection('posts');
  // Check drafts too, so publishing a draft can never introduce a duplicate URL.
  assertValidSlugs(all);
  return all
    .filter((post) => !post.data.draft)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime() || postSlug(a).localeCompare(postSlug(b)));
}

export function tagSlug(tag: string): string {
  return tag.trim().toLowerCase().replace(/\s+/g, '-');
}

/**
 * Prefixes a site-internal path with the configured base (`/blog`).
 * Works whether BASE_URL ends with a slash or not: withBase('/') === '/blog/'.
 */
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/+$/, '');
  return `${base}/${path.replace(/^\/+/, '')}`;
}

export function postUrl(post: Post): string {
  return withBase(`/${postSlug(post)}/`);
}

export function tagUrl(tag: string): string {
  return withBase(`/tags/${tagSlug(tag)}/`);
}

/** YAML dates are parsed as UTC midnight, so format in UTC to keep the written day. */
export function formatDate(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getUTCFullYear()}.${pad(date.getUTCMonth() + 1)}.${pad(date.getUTCDate())}`;
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
