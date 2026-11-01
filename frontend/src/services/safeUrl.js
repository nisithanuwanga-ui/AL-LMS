export function getSafeExternalUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;

  try {
    const url = new URL(value.trim());
    if ((url.protocol === "https:" || url.protocol === "http:") && url.hostname) {
      return url.href;
    }
  } catch {
    return null;
  }

  return null;
}
