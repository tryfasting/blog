import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Posts live in the root `posts/` folder so they can be opened as an Obsidian vault.
// Ids keep the folder path; URLs use a folder-independent slug (see src/blog/lib/slug.ts).
// posts/_drafts/ is loaded only by `npm run dev` so drafts can be previewed; builds never see it.
const ignored = import.meta.env.DEV ? ['!_templates/**'] : ['!_templates/**', '!_drafts/**'];

const posts = defineCollection({
  loader: glob({
    base: './posts',
    pattern: ['**/*.md', ...ignored],
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
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
