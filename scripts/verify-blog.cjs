// Browser check of the blog: node scripts/verify-blog.cjs [origin]
// origin defaults to the local preview (http://127.0.0.1:4321); pass https://tryfasting.github.io for production.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const origin = (process.argv[2] ?? 'http://127.0.0.1:4321').replace(/\/$/, '');
const home = `${origin}/blog/`;

(async () => {
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
        results.push({ url: new URL(url).pathname, width });
      }
    }

    // Feeds and the not-found page.
    for (const path of ['rss.xml', 'sitemap-index.xml']) {
      assert.equal((await page.goto(`${home}${path}`)).status(), 200, path);
    }
    assert.equal((await page.goto(`${home}no-such-post/`)).status(), 404);

    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ passed: true, pages: pages.length, checks: results.length }));
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
