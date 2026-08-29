const AUTH_QUERY_KEYS = ["code", "error", "error_code", "error_description", "type"];

export function getAuthRedirectUrl(locationLike: Pick<Location, "origin"> = window.location, baseUrl = import.meta.env.BASE_URL) {
  return new URL(baseUrl, `${locationLike.origin}/`).toString();
}

export function isPasswordRecoveryUrl(locationLike: Pick<Location, "search" | "hash"> = window.location) {
  const query = new URLSearchParams(locationLike.search);
  const hash = new URLSearchParams(locationLike.hash.replace(/^#/, ""));
  return query.get("type") === "recovery" || hash.get("type") === "recovery";
}

export function clearAuthRedirectParams() {
  const url = new URL(window.location.href);
  AUTH_QUERY_KEYS.forEach((key) => url.searchParams.delete(key));
  if (/\b(type|access_token|refresh_token|error)=/.test(url.hash)) url.hash = "";
  window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
}
