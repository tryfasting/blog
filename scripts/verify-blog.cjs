// Browser check of the blog: node scripts/verify-blog.cjs [origin] [outDir] [--dev]
// origin defaults to the local preview (http://127.0.0.1:4321); pass https://tryfasting.github.io for production.
// Full-page screenshots of every checked page go to outDir (default artifacts/verify, git-ignored).
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

// `--dev` checks `npm run dev` (drafts visible), which has no sitemap: it is generated at build time.
const dev = process.argv.includes('--dev');
const [originArg, outputArg] = process.argv.slice(2).filter((arg) => arg !== '--dev');
const origin = (originArg ?? 'http://127.0.0.1:4321').replace(/\/$/, '');
const output = outputArg ?? 'artifacts/verify';
const home = `${origin}/blog/`;

/** '/blog/' -> 'index', '/blog/tags/astro/' -> 'tags-astro' */
function shotName(url, width) {
  const slug = new URL(url).pathname.replace(/^\/blog\/?/, '').replace(/\/$/, '').replace(/\//g, '-') || 'index';
  return `${slug}-${width}.png`;
}

(async () => {
  // Start from an empty set of screenshots so removed pages do not leave stale images.
  fs.mkdirSync(output, { recursive: true });
  for (const file of fs.readdirSync(output)) if (file.endsWith('.png')) fs.rmSync(path.join(output, file));
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const errors = [];
  const results = [];
  try {
    const page = await browser.newPage({ deviceScaleFactor: 1 });
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('requestfailed', (request) => errors.push(`failed: ${request.url()}`));

    // Collect every page reachable from the list: posts and tag pages.
    assert.equal((await page.goto(home, { waitUntil: 'networkidle' })).status(), 200);
    const postLinks = await page.$$eval('.post-item h2 a', (links) => links.map((a) => a.href));
    const tagLinks = await page.$$eval('.tag-list a', (links) => [...new Set(links.map((a) => a.href))]);
    assert(postLinks.length > 0, 'the list shows no posts');
    const pages = [home, ...postLinks, ...tagLinks];

    for (const url of pages) {
      for (const width of [1440, 375]) {
        await page.setViewportSize({ width, height: 1000 });
        const response = await page.goto(url, { waitUntil: 'networkidle' });
        assert.equal(response.status(), 200, url);
        await page.evaluate(() => document.fonts.ready);
        // Astro marks Markdown images loading="lazy", so images below the fold would count as broken
        // (and be blank in the full-page screenshot) unless they are loaded first.
        await page.evaluate(() =>
          Promise.all([...document.images].map((image) => {
            image.loading = 'eager';
            return image.decode().catch(() => {});
          })),
        );
        const result = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth > innerWidth,
          images: [...document.images].every((image) => image.complete && image.naturalWidth > 0),
          // Same-origin links must stay under /blog/, except the portfolio link.
          strayLinks: [...document.querySelectorAll('a[href]')]
            .map((a) => new URL(a.href))
            .filter((u) => u.origin === location.origin && !u.pathname.startsWith('/blog/') && u.pathname !== '/general/')
            .map((u) => u.pathname),
          portfolioLink: document.querySelectorAll('header nav a[href="/general/"]').length,
          unsafeBlank: [...document.querySelectorAll('a[target=_blank]')].filter((a) => !a.rel.includes('noopener')).length,
        }));
        assert.equal(result.overflow, false, `horizontal overflow at ${width}px: ${url}`);
        assert.equal(result.images, true, `broken image: ${url}`);
        assert.deepEqual(result.strayLinks, [], `links outside /blog/: ${url}`);
        assert.equal(result.portfolioLink, 1, `missing portfolio link: ${url}`);
        assert.equal(result.unsafeBlank, 0, `target=_blank without noopener: ${url}`);
        const file = shotName(url, width);
        await page.screenshot({ path: path.join(output, file), fullPage: true });
        results.push({ url: new URL(url).pathname, width, file });
      }
    }

    // Feeds and the not-found page.
    for (const path of dev ? ['rss.xml'] : ['rss.xml', 'sitemap-index.xml']) {
      assert.equal((await page.goto(`${home}${path}`)).status(), 200, path);
    }
    assert.equal((await page.goto(`${home}no-such-post/`)).status(), 404);

    assert.deepEqual(errors, []);
    fs.writeFileSync(
      path.join(output, 'meta.json'),
      JSON.stringify({ passed: true, capturedAt: new Date().toISOString(), origin, results }, null, 2),
    );
    console.log(JSON.stringify({ passed: true, pages: pages.length, checks: results.length, screenshots: output }));
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
