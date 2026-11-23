/** A journey without a base URL is skipped. Running it against nothing would be a false failure. */
export function requireBaseUrl(): string | null {
  const url = process.env.E2E_BASE_URL;
  return url && url.length > 0 ? url : null;
}
