/** YAML dates are parsed as UTC midnight, so format in UTC to keep the written day. */
export function formatDate(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getUTCFullYear()}.${pad(date.getUTCMonth() + 1)}.${pad(date.getUTCDate())}`;
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
