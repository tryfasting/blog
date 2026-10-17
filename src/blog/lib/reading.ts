// Rough Korean reading speed. Counting characters works for mixed Korean/English text,
// where word counts would undercount Korean.
const charactersPerMinute = 500;

/** Estimated reading time in whole minutes (at least 1), from the post's Markdown source. */
export function readingMinutes(markdown: string): number {
  const characters = markdown.replace(/\s+/g, '').length;
  return Math.max(1, Math.round(characters / charactersPerMinute));
}
