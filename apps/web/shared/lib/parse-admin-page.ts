export const ADMIN_PAGE_SIZE = 20;

export function parseAdminPage(pageParam: string | undefined): number {
  const parsed = Number(pageParam);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }
  return Math.floor(parsed);
}
