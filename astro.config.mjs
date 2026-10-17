import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { warmMonochrome } from './src/blog/code-theme.mjs';

// Published as the GitHub Pages project site of the `blog` repository,
// so every page lives under https://tryfasting.github.io/blog/.
export default defineConfig({
  site: 'https://tryfasting.github.io',
  base: '/blog',
  output: 'static',
  devToolbar: { enabled: false },
  integrations: [sitemap()],
  markdown: {
    shikiConfig: { theme: warmMonochrome },
  },
});
