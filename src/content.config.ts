import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { formatDeskReport, literalGlob, scanDesk, writeDeskLog } from './blog/desk.ts';

// Registered posts live in posts/. URLs use a folder-independent slug (see src/blog/lib/slug.ts).
// `npm run dev` also previews manuscripts from the git-ignored desk/ writing folder, but only those that
// pass the manuscript check, so an Obsidian note or template there never breaks the dev server.
// Builds never read desk/.
function deskPreviewPatterns(): string[] {
  const scan = scanDesk();
  const logPath = writeDeskLog(scan);
  if (scan.excluded.length > 0) {
    console.warn(`${formatDeskReport(scan)}(로그: ${logPath})`);
  }
  return scan.included.map(literalGlob);
}

const posts = defineCollection({
  loader: glob({
    base: '.',
    pattern: ['posts/**/*.md', ...(import.meta.env.DEV ? deskPreviewPatterns() : [])],
    // Registered posts keep their old ids (path under posts/); manuscripts keep the desk/ prefix, which marks them as drafts.
    generateId: ({ entry }) => entry.replace(/^posts\//, '').replace(/\.md$/, ''),
  }),
  schema: z.object({
    title: z.string().min(1),
    date: z.coerce.date(),
    description: z.string().min(1),
    tags: z.array(z.string().min(1)).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
