/**
 * Resolve a stored media reference into a browser-loadable URL.
 *
 * Admin/merchant uploads persist object-storage paths like "/objects/..." —
 * those are served by the API under "/api/storage/objects/...". Absolute
 * URLs (e.g. external image links) are returned unchanged.
 */
export function resolveMediaUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  if (pathOrUrl.startsWith("/objects/") || pathOrUrl.startsWith("/public-objects/")) {
    const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
    return `${base}/api/storage${pathOrUrl}`;
  }
  return pathOrUrl;
}
