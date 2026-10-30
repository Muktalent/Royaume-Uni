export function apiUrl(raw, query = {}) {
  const url = new URL(raw, "https://internal.invalid");
  const routes = url.searchParams.getAll("__crm_route");
  const route = routes.length === 0
    ? query?.__crm_route
    : routes.length === 1 ? routes[0] : null;

  const allowed = /^[a-z0-9_-]+(?:\/[a-z0-9_-]+)*(?:\.(?:png|pkpass))?$/i;
  if (typeof route !== "string" || !route || route.length > 250 || !allowed.test(route)) {
    throw new Error("Invalid API route");
  }

  url.searchParams.delete("__crm_route");
  const search = url.searchParams.toString();
  return `/api/${route}${search ? `?${search}` : ""}`;
}
