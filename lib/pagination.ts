export const PAGE_SIZE_DEFAULT = 10;
export const PAGE_SIZE_OPTIONS = [10, 50, 100] as const;

export function parsePage(value?: string) {
  const parsed = Number(value ?? "1");

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return Math.floor(parsed);
}

export function parsePageSize(value?: string) {
  const parsed = Number(value ?? PAGE_SIZE_DEFAULT);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return PAGE_SIZE_DEFAULT;
  }

  const normalized = Math.floor(parsed);
  return PAGE_SIZE_OPTIONS.includes(normalized as (typeof PAGE_SIZE_OPTIONS)[number])
    ? normalized
    : PAGE_SIZE_DEFAULT;
}
