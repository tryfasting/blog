import { getCollection, type CollectionEntry } from 'astro:content';
import { isDraft, isVisible } from './lib/draft.ts';
import { readingMinutes } from './lib/reading.ts';
import { findSlugProblems, slugFromId, tagSlug } from './lib/slug.ts';
import { joinBase } from './lib/url.ts';

// Pages import everything from this module; the pure helpers live in ./lib so they can be unit-tested without Astro.
export { formatDate, isoDate } from './lib/date.ts';
export { tagSlug } from './lib/slug.ts';
export { tocItems, type TocItem } from './lib/toc.ts';

export type Post = CollectionEntry<'posts'>;

/** URL slug: file name without folders and without the `YYYY-MM-DD-` prefix. */
export function postSlug(post: Post): string {
  return slugFromId(post.id);
}

export function postSource(post: Post): string {
  return post.filePath ?? `posts/${post.id}.md`;
}

/** Fails the build on invalid or duplicated slugs, listing the offending files. */
function assertValidSlugs(posts: Post[]): void {
  const problems = findSlugProblems(posts.map((post) => ({ id: post.id, source: postSource(post) })));
  if (problems.length > 0) throw new Error(`Blog post slug check failed:\n${problems.join('\n')}`);
}

export function postReadingMinutes(post: Post): number {
  return readingMinutes(post.body ?? '');
}

export function postIsDraft(post: Post): boolean {
  return isDraft({ id: post.id, draft: post.data.draft });
}

async function getPosts(includeDrafts: boolean): Promise<Post[]> {
  const all = await getCollection('posts');
  // Check drafts too, so publishing a draft can never introduce a duplicate URL.
  assertValidSlugs(all);
  return all
    .filter((post) => isVisible({ id: post.id, draft: post.data.draft }, { includeDrafts }))
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime() || postSlug(a).localeCompare(postSlug(b)));
}

/** Posts for pages, newest first. `npm run dev` also shows drafts (marked 초안); builds never do. */
export function getVisiblePosts(): Promise<Post[]> {
  return getPosts(import.meta.env.DEV);
}

/** Published posts only, newest first, even in dev. For feeds such as RSS. */
export function getPublishedPosts(): Promise<Post[]> {
  return getPosts(false);
}

/** Prefixes a site-internal path with the configured base (`/blog`): withBase('/') === '/blog/'. */
export function withBase(path: string): string {
  return joinBase(import.meta.env.BASE_URL, path);
}

export function postUrl(post: Post): string {
  return withBase(`/${postSlug(post)}/`);
}

export function tagUrl(tag: string): string {
  return withBase(`/tags/${tagSlug(tag)}/`);
}
