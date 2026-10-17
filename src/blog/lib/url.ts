/**
 * Prefixes a site-internal path with a base such as `/blog`.
 * Works whether the base ends with a slash or not: joinBase('/blog/', '/') === '/blog/'.
 */
export function joinBase(base: string, path: string): string {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}
