const AUTH_QUERY_KEYS = ["code", "error", "error_code", "error_description", "type", "auth"];

export function getAuthRedirectUrl(locationLike: Pick<Location, "origin"> = window.location, baseUrl = import.meta.env.BASE_URL) {
  return new URL(baseUrl, `${locationLike.origin}/`).toString();
}

/**
 * Password recovery needs a marker that survives Supabase's PKCE callback.
 * Supabase normally redirects back with only ?code=..., so relying on
 * type=recovery is not sufficient on GitHub Pages/PWA.
 */
export function getPasswordRecoveryRedirectUrl(
  locationLike: Pick<Location, "origin"> = window.location,
  baseUrl = import.meta.env.BASE_URL,
) {
  const url = new URL(getAuthRedirectUrl(locationLike, baseUrl));
  url.searchParams.set("auth", "recovery");
  return url.toString();
}

export function isPasswordRecoveryUrl(locationLike: Pick<Location, "search" | "hash"> = window.location) {
  const query = new URLSearchParams(locationLike.search);
  const hash = new URLSearchParams(locationLike.hash.replace(/^#/, ""));
  return query.get("auth") === "recovery"
    || query.get("type") === "recovery"
    || hash.get("type") === "recovery";
}

export function hasAuthCallbackError(locationLike: Pick<Location, "search" | "hash"> = window.location) {
  const query = new URLSearchParams(locationLike.search);
  const hash = new URLSearchParams(locationLike.hash.replace(/^#/, ""));
  return Boolean(query.get("error") || query.get("error_code") || hash.get("error"));
}

export function getAuthCallbackError(locationLike: Pick<Location, "search" | "hash"> = window.location) {
  const query = new URLSearchParams(locationLike.search);
  const hash = new URLSearchParams(locationLike.hash.replace(/^#/, ""));
  const description = query.get("error_description") ?? hash.get("error_description");
  const code = query.get("error_code") ?? query.get("error") ?? hash.get("error");
  return description ? decodeURIComponent(description.replace(/\+/g, " ")) : code ?? "";
}

export function clearAuthRedirectParams() {
  const url = new URL(window.location.href);
  AUTH_QUERY_KEYS.forEach((key) => url.searchParams.delete(key));
  if (/\b(type|access_token|refresh_token|error|error_description)=/.test(url.hash)) url.hash = "";
  window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
}
