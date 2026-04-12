/** Превращает относительный URL в абсолютный относительно страницы. */
export function absolutizeUrl(maybeRelative: string, baseUrl: string): string {
  const s = maybeRelative.trim();
  if (!s) {
    return "";
  }
  if (s.startsWith("data:")) {
    return s;
  }
  try {
    return new URL(s, baseUrl).href;
  } catch {
    return s;
  }
}
