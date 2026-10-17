import { tagSlug } from './slug.ts';

export interface TagCount {
  /** Spelling shown on the page: the first one seen for this slug. */
  tag: string;
  slug: string;
  count: number;
}

/**
 * Posts per tag for the tag overview, most used first, then by name.
 * Tags that land on the same tag page (same slug, e.g. "GitHub Actions" and "github-actions") count as one.
 */
export function tagCounts(tagLists: readonly (readonly string[])[]): TagCount[] {
  const bySlug = new Map<string, TagCount>();
  for (const tags of tagLists) {
    for (const slug of new Set(tags.map(tagSlug))) {
      const tag = tags.find((candidate) => tagSlug(candidate) === slug)!;
      const entry = bySlug.get(slug) ?? { tag, slug, count: 0 };
      entry.count += 1;
      bySlug.set(slug, entry);
    }
  }
  return [...bySlug.values()].sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}
