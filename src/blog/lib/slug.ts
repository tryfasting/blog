const datePrefix = /^\d{4}-\d{2}-\d{2}-/;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// Slugs that would collide with fixed routes under /blog/.
const reservedSlugs = new Set(['tags']);

/** A post as the slug check sees it: collection id plus the file path shown in error messages. */
export interface SlugEntry {
  id: string;
  source: string;
}

/** URL slug: file name without folders and without the `YYYY-MM-DD-` prefix. */
export function slugFromId(id: string): string {
  const fileName = id.split('/').pop() ?? id;
  return fileName.replace(datePrefix, '');
}

export function tagSlug(tag: string): string {
  return tag.trim().toLowerCase().replace(/\s+/g, '-');
}

/** Invalid or duplicated slugs, one message per problem listing the offending files. Empty when all is well. */
export function findSlugProblems(entries: readonly SlugEntry[]): string[] {
  const problems: string[] = [];
  const bySlug = new Map<string, string[]>();
  for (const { id, source } of entries) {
    const slug = slugFromId(id);
    if (!slugPattern.test(slug) || reservedSlugs.has(slug)) {
      problems.push(`- invalid slug "${slug}" in ${source} (use YYYY-MM-DD-lowercase-kebab-case.md; "tags" is reserved)`);
    }
    bySlug.set(slug, [...(bySlug.get(slug) ?? []), source]);
  }
  for (const [slug, files] of bySlug) {
    if (files.length > 1) problems.push(`- duplicate slug "${slug}":\n${files.map((file) => `    ${file}`).join('\n')}`);
  }
  return problems;
}
