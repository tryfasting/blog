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
    const moreLinks = await page.$$eval('.more-tags a', (links) => links.map((a) => a.href));
    const pages = [home, ...postLinks, ...tagLinks, ...moreLinks];

    for (const url of pages) {
      for (const width of [1440, 375]) {
        await page.setViewportSize({ width, height: 1000 });
        const response = await page.goto(url, { waitUntil: 'networkidle' });
        assert.equal(response.status(), 200, url);
        await page.evaluate(() => document.fonts.ready);
        // Astro marks Markdown images loading="lazy", so images below the fold would count as broken
        // (and be blank in the full-page screenshot) unless they are loaded first.
        await page.evaluate(() =>
          Promise.all([...document.images].map(async (image) => {
            image.loading = 'eager';
            if (image.complete) return;
            // Wait for the request itself; decode() can reject while a lazy load is still starting.
            await new Promise((resolve) => {
              image.addEventListener('load', resolve, { once: true });
              image.addEventListener('error', resolve, { once: true });
            });
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

    // Search panel (needs the Pagefind index from `npm run build`, so not on the dev server).
    const search = dev ? null : await checkSearch(page, home, output);

    // Feeds and the not-found page.
    for (const path of dev ? ['rss.xml'] : ['rss.xml', 'sitemap-index.xml']) {
      assert.equal((await page.goto(`${home}${path}`)).status(), 200, path);
    }
    assert.equal((await page.goto(`${home}no-such-post/`)).status(), 404);

    assert.deepEqual(errors, []);
    fs.writeFileSync(
      path.join(output, 'meta.json'),
      JSON.stringify({ passed: true, capturedAt: new Date().toISOString(), origin, results, search }, null, 2),
    );
    console.log(JSON.stringify({ passed: true, pages: pages.length, checks: results.length, search, screenshots: output }));
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

/** Runs in the page: opens the panel, types `term`, and times the panel opening and the first results. */
async function measureSearch(term) {
  const button = document.querySelector('.search-btn');
  const panel = document.getElementById('search-panel');
  const input = panel.querySelector('input');
  const list = panel.querySelector('.search-results');
  const t0 = performance.now();
  button.click();
  await new Promise((resolve) => requestAnimationFrame(() => resolve()));
  const openMs = performance.now() - t0;
  const t1 = performance.now();
  input.value = term;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await new Promise((resolve, reject) => {
    const observer = new MutationObserver(() => list.children.length && (observer.disconnect(), resolve()));
    observer.observe(list, { childList: true });
    setTimeout(() => reject(new Error(`no search results for "${term}" within 5s`)), 5000);
  });
  return {
    openMs: Math.round(openMs),
    firstResultMs: Math.round(performance.now() - t1),
    count: list.children.length,
    firstHref: list.querySelector('a').getAttribute('href'),
    focused: document.activeElement === input,
  };
}

async function checkSearch(page, home, output) {
  const timings = {};
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(home, { waitUntil: 'networkidle' });
    // A word from the newest post's title, so the query always has a match.
    const term = await page.$eval('.post-item h2 a', (a) => a.textContent.trim().split(/\s+/)[0]);
    // Cold: Pagefind has not been downloaded yet, so this includes the download.
    const cold = await page.evaluate(measureSearch, term);
    assert(cold.focused, 'opening search should focus the input');
    assert(cold.firstHref.startsWith('/blog/'), `search result outside /blog/: ${cold.firstHref}`);
    await page.screenshot({ path: path.join(output, `search-open-${width}.png`) });
    await page.keyboard.press('Escape');
    const closed = await page.evaluate(() => ({
      hidden: document.getElementById('search-panel').hidden,
      focusBack: document.activeElement?.classList.contains('search-btn') ?? false,
    }));
    assert(closed.hidden && closed.focusBack, 'Esc should close search and return focus to the magnifier');
    timings[`cold${width}`] = cold;
  }
  // Warm: a visitor points at the magnifier first, which starts the download early.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(home, { waitUntil: 'networkidle' });
  const term = await page.$eval('.post-item h2 a', (a) => a.textContent.trim().split(/\s+/)[0]);
  await page.hover('.search-btn');
  await page.waitForTimeout(800);
  timings.warm1440 = await page.evaluate(measureSearch, term);
  // Keyboard: Tab to the magnifier and open it with Enter.
  await page.keyboard.press('Escape');
  await page.focus('.search-btn');
  await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(() => document.getElementById('search-panel').hidden), false, 'Enter on the magnifier should open search');
  await page.keyboard.press('Escape');
  // The first result is a real page.
  assert.equal((await page.goto(new URL(timings.warm1440.firstHref, home).href)).status(), 200, 'search result link');
  return timings;
}
