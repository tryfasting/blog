/** A post as the draft rules see it: collection id (path under posts/, no extension) plus the frontmatter flag. */
export interface DraftEntry {
  id: string;
  draft: boolean;
}

/**
 * A post is a draft if its frontmatter says so or it still sits in posts/_drafts/.
 * Publishing a post from _drafts/ is just moving the file, so its frontmatter may already say draft: false.
 */
export function isDraft({ id, draft }: DraftEntry): boolean {
  return draft || id.startsWith('_drafts/');
}

export function isVisible(entry: DraftEntry, { includeDrafts }: { includeDrafts: boolean }): boolean {
  return includeDrafts || !isDraft(entry);
}
