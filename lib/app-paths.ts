const configuredBasePath = process.env.NEXT_PUBLIC_BASE_PATH?.trim() ?? "";

export const APP_BASE_PATH = configuredBasePath
  ? `/${configuredBasePath.replace(/^\/+|\/+$/g, "")}`
  : "";

export function appPath(path = "/") {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (APP_BASE_PATH && (normalized === APP_BASE_PATH || normalized.startsWith(`${APP_BASE_PATH}/`))) {
    return normalized;
  }
  return `${APP_BASE_PATH}${normalized}`;
}

export function appUrl(path = "/") {
  if (typeof window === "undefined") return "";
  return new URL(appPath(path), window.location.origin).toString();
}

export function safeInternalRoute(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/";
  try {
    const parsed = new URL(value, "https://clube.invalid");
    if (parsed.origin !== "https://clube.invalid") return "/";
    const route = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    if (APP_BASE_PATH && (route === APP_BASE_PATH || route.startsWith(`${APP_BASE_PATH}/`))) {
      return route.slice(APP_BASE_PATH.length) || "/";
    }
    return route;
  } catch {
    return "/";
  }
}

export function inviteTokenFromInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    const parsed = new URL(trimmed, "https://clube.invalid");
    const queryToken = parsed.searchParams.get("token")?.trim();
    if (queryToken) return queryToken;
    const legacyMatch = parsed.pathname.match(/\/invite\/([^/]+)\/?$/);
    if (legacyMatch) return decodeURIComponent(legacyMatch[1]);
  } catch {
    return trimmed;
  }
  return trimmed;
}
