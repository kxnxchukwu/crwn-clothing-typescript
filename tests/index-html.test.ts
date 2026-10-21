import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

// Link previews (WhatsApp, Facebook, LinkedIn, Slack, X) read these tags
// straight from index.html; the app never runs for those bots.
const SITE = "https://shop.kenechukwu.dev/";
const MAX_IMAGE_BYTES = 300 * 1024; // WhatsApp skips larger preview images

const html = readFileSync(resolve(__dirname, "../index.html"), "utf8");
const doc = new DOMParser().parseFromString(html, "text/html");

const metas = [...doc.head.querySelectorAll("meta[property], meta[name]")];
const key = (m: Element) =>
  m.getAttribute("property") ?? m.getAttribute("name")!;
const meta = (k: string) =>
  metas.find((m) => key(m) === k)?.getAttribute("content");

describe("index.html link-preview tags", () => {
  it.each([
    "description",
    "og:type",
    "og:site_name",
    "og:url",
    "og:title",
    "og:description",
    "og:image",
    "og:image:width",
    "og:image:height",
    "og:image:alt",
    "twitter:card",
  ])("has a non-empty %s", (k) => {
    expect(meta(k)?.trim()).toBeTruthy();
  });

  it("declares each tag only once", () => {
    const keys = metas.map(key);
    const duplicates = keys.filter((k, i) => keys.indexOf(k) !== i);
    expect(duplicates).toEqual([]);
  });

  it("points og:url and the canonical link at the live site", () => {
    expect(meta("og:url")).toBe(SITE);
    expect(
      doc.head.querySelector('link[rel="canonical"]')?.getAttribute("href"),
    ).toBe(SITE);
  });

  it("uses an absolute HTTPS image served from public/ that's small enough", () => {
    const image = meta("og:image")!;
    expect(image.startsWith(SITE)).toBe(true);
    const file = resolve(__dirname, "../public", image.slice(SITE.length));
    expect(statSync(file).size).toBeLessThan(MAX_IMAGE_BYTES);
    expect(meta("og:image:width")).toBe("1200");
    expect(meta("og:image:height")).toBe("630");
  });

  it("has a single title", () => {
    expect(doc.querySelectorAll("title")).toHaveLength(1);
    expect(doc.title).toBe("CRWN Clothing");
  });
});
