/**
 * Validate a configured public chat API origin before passing it to a component.
 * Only a bare origin is supported: no userinfo, base path, query or fragment.
 * HTTP is permitted exclusively for exact loopback development hosts.
 */
export function isTrustedPublicApiOrigin(value) {
  if (typeof value !== "string" || !value || value.length > 2048 || value !== value.trim()) {
    return false;
  }

  let url;
  try {
    url = new URL(value);
  } catch {
    return false;
  }

  if (
    !url.hostname ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    value.includes("?") ||
    value.includes("#")
  ) {
    return false;
  }

  if (url.protocol === "https:") return true;
  return url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
}
