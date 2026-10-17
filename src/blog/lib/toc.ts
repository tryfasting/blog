/** A heading as Astro's render() reports it. */
export interface Heading {
  depth: number;
  slug: string;
  text: string;
}

export type TocItem = Heading;

/**
 * Table of contents entries: h2 and h3 only, in document order.
 * Short posts get none, because a list of one or two links adds clutter without helping navigation.
 */
export function tocItems(headings: readonly Heading[], minItems = 3): TocItem[] {
  const items = headings
    .filter(({ depth }) => depth === 2 || depth === 3)
    .map(({ depth, slug, text }) => ({ depth, slug, text }));
  return items.length >= minItems ? items : [];
}
