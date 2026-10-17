/** A post as the draft rules see it: collection id (path under posts/, no extension) plus the frontmatter flag. */
export interface DraftEntry {
  id: string;
  draft: boolean;
}

/**
 * A post is a draft if its frontmatter says so or it is a manuscript from desk/ (only `npm run dev` loads those).
 * A finished manuscript usually already says draft: false, so the folder decides.
 */
export function isDraft({ id, draft }: DraftEntry): boolean {
  return draft || id.startsWith('desk/');
}

export function isVisible(entry: DraftEntry, { includeDrafts }: { includeDrafts: boolean }): boolean {
  return includeDrafts || !isDraft(entry);
}
