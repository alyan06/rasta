import { strict as assert } from "node:assert";
import { test } from "node:test";
import { pageRoute, stripFragment } from "./analytics";
import type { Page } from "../types";

test("workspace pages report their own route, with the dashboard as the site root", () => {
  assert.deepEqual(pageRoute("dashboard"), { route: "/", path: "/" });
  assert.deepEqual(pageRoute("profile"), {
    route: "/profile",
    path: "/profile",
  });
  assert.deepEqual(pageRoute("privacy"), {
    route: "/privacy",
    path: "/privacy",
  });
});

test("every university shares one route pattern so the catalogue is a single row", () => {
  assert.deepEqual(pageRoute("university/nust"), {
    route: "/university/[id]",
    path: "/university/nust",
  });
  assert.equal(pageRoute("university/us-166683").route, "/university/[id]");
  // Nothing outside a catalogue slug is ever reported as a path.
  assert.deepEqual(pageRoute("university/Ayesha Khan" as Page), {
    route: "/university/[id]",
    path: "/university/[id]",
  });
});

test("the reported URL never carries a fragment", () => {
  assert.equal(
    stripFragment({
      type: "pageview",
      url: "https://www.rastapk.com/profile#profile",
    }).url,
    "https://www.rastapk.com/profile",
  );
  assert.equal(
    stripFragment({ type: "event", url: "https://www.rastapk.com/" }).url,
    "https://www.rastapk.com/",
  );
});
