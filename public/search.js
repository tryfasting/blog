// Search panel (design option B): the magnifier in the header opens a panel with Pagefind results.
// `npm run build` writes the index to dist/pagefind, so search works in `npm run preview` and production,
// not in `npm run dev`. This is the only client JavaScript on the site.
// It lives in public/ and ships as-is: when Astro inlines a small bundled script, Vite's helper for the
// dynamic import() below is left undefined (__VITE_PRELOAD__), so this file skips the bundler on purpose.

// The site base (/blog/) is wherever this file is served from.
const base = new URL('./', import.meta.url).pathname;
// Short enough to feel instant, long enough to skip a search per keystroke while typing Korean.
const typingPauseMs = 120;
const maxResults = 8;

/** @type {Promise<any> | undefined} */
let pagefind;

/**
 * Downloads and starts Pagefind once. Called as soon as the visitor shows intent (pointer over, focus or
 * touch on the magnifier), so by the time they type, the first search does not wait for the download.
 */
function loadPagefind() {
  pagefind ??= import(`${base}pagefind/pagefind.js`)
    .then(async (module) => {
      await module.options({ baseUrl: base });
      await module.init();
      return module;
    })
    .catch(() => null);
  return pagefind;
}

function setUp() {
  const button = document.querySelector('[data-search-open]');
  const panel = document.getElementById('search-panel');
  if (!button || !panel) return;
  const input = panel.querySelector('input');
  const status = panel.querySelector('.search-status');
  const list = panel.querySelector('.search-results');

  const open = () => {
    panel.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    document.body.classList.add('search-open');
    input.focus();
    void loadPagefind();
  };
  const close = (returnFocus) => {
    panel.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('search-open');
    if (returnFocus) button.focus();
  };

  for (const intent of ['pointerenter', 'focus', 'touchstart']) {
    button.addEventListener(intent, () => void loadPagefind(), { once: true, passive: true });
  }
  button.addEventListener('click', () => (panel.hidden ? open() : close(true)));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !panel.hidden) close(true);
  });
  document.addEventListener('pointerdown', (event) => {
    if (!panel.hidden && !panel.contains(event.target) && !button.contains(event.target)) close(false);
  });

  input.addEventListener('input', () => void search(input.value.trim()));

  // A visitor who lands and searches right away would otherwise wait for the first download (about
  // 1.3 s on GitHub Pages), so fetch Pagefind once the page is idle. Visitors who asked to save data skip it.
  if (!navigator.connection?.saveData) {
    const preload = () => void loadPagefind();
    if ('requestIdleCallback' in window) requestIdleCallback(preload, { timeout: 2000 });
    else setTimeout(preload, 1000);
  }

  /** @param {string} term */
  async function search(term) {
    if (!term) {
      list.replaceChildren();
      status.textContent = '';
      return;
    }
    const engine = await loadPagefind();
    if (!engine) {
      status.textContent = '검색은 npm run build 뒤의 미리보기와 배포된 사이트에서 동작합니다.';
      return;
    }
    const found = await engine.debouncedSearch(term, {}, typingPauseMs);
    if (found === null) return; // A newer keystroke started its own search.
    const results = await Promise.all(found.results.slice(0, maxResults).map((result) => result.data()));
    list.replaceChildren(...results.map(resultItem));
    status.textContent = found.results.length > 0 ? `"${term}" 결과 ${found.results.length}개` : `"${term}"에 맞는 글이 없습니다.`;
  }
}

/** @param {{ url: string, excerpt: string, meta: { title?: string } }} result */
function resultItem(result) {
  const item = document.createElement('li');
  const link = document.createElement('a');
  link.href = result.url;
  const title = document.createElement('strong');
  title.textContent = result.meta.title ?? result.url;
  const excerpt = document.createElement('p');
  // Pagefind escapes the page text and only adds <mark> around matches.
  excerpt.innerHTML = result.excerpt;
  link.append(title, excerpt);
  item.append(link);
  return item;
}

setUp();
