import type { BeforeSendEvent } from "@vercel/analytics/react";
import type { Page } from "../types";

/** Vercel Web Analytics expects a route pattern plus the resolved path.
 * Rasta is a hash-routed SPA, so every real URL is "/" and the page lives in the
 * fragment; without this mapping the dashboard reports one row for the whole site.
 * Universities collapse to a single "/university/[id]" route so one row covers the
 * catalogue instead of 2,841 of them, while `path` keeps the individual page so the
 * popular universities are still visible. Neither value ever carries student data. */
export function pageRoute(page: Page): { route: string; path: string } {
  if (page.startsWith("university/")) {
    const id = page.slice("university/".length);
    // Ids come from the catalogue and are already slugs; anything else is not reported.
    return {
      route: "/university/[id]",
      path: /^[a-z0-9-]+$/.test(id) ? `/university/${id}` : "/university/[id]",
    };
  }
  const path = page === "dashboard" ? "/" : `/${page}`;
  return { route: path, path };
}

/** The tracker reports the reported path against the live URL, which still carries the
 * fragment ("/profile#profile"). Dropping it keeps one clean row per page, and means a
 * link someone shares with extra fragment text cannot end up in the dashboard. */
export function stripFragment(event: BeforeSendEvent): BeforeSendEvent {
  const fragment = event.url.indexOf("#");
  return fragment === -1
    ? event
    : { ...event, url: event.url.slice(0, fragment) };
}
