import { useLayoutEffect } from "react";
import {
  SITE,
  DEFAULT_OG_IMAGE,
  DEFAULT_ROBOTS,
  absoluteUrl,
} from "../lib/seo";

function upsertMeta(attribute, key, content) {
  const selector = `meta[${attribute}="${key}"]`;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attribute, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
  return el;
}

function upsertCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
  return el;
}

function removeKeywords() {
  document.head
    .querySelectorAll('meta[name="keywords"]')
    .forEach((el) => el.remove());
}

function applyJsonLd(schemas) {
  document.head
    .querySelectorAll('script[type="application/ld+json"][data-seo-owner="ghostcode"]')
    .forEach((el) => el.remove());
  schemas.forEach((schema) => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.dataset.seoOwner = "ghostcode";
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  });
}

export function Seo({
  title,
  description,
  path = "/",
  image = DEFAULT_OG_IMAGE,
  type = "website",
  robots = DEFAULT_ROBOTS,
  keywords,
  schemas = [],
}) {
  useLayoutEffect(() => {
    const canonical = absoluteUrl(path);
    const imageUrl = absoluteUrl(image);

    document.title = title;
    upsertMeta("name", "description", description);
    upsertMeta("name", "robots", robots);
    upsertMeta("name", "author", SITE.name);
    upsertMeta("name", "publisher", SITE.name);
    upsertMeta("name", "application-name", SITE.name);
    upsertMeta("name", "apple-mobile-web-app-title", SITE.shortName);
    upsertMeta("name", "apple-mobile-web-app-capable", "yes");
    upsertMeta("name", "apple-mobile-web-app-status-bar-style", "black-translucent");
    if (keywords) {
      upsertMeta("name", "keywords", keywords);
    } else {
      removeKeywords();
    }

    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:image", imageUrl);
    upsertMeta("property", "og:image:width", "1200");
    upsertMeta("property", "og:image:height", "630");
    upsertMeta("property", "og:image:alt", "GhostCode Dynamics brand preview");
    upsertMeta("property", "og:url", canonical);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:site_name", SITE.name);
    upsertMeta("property", "og:locale", SITE.locale);

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", imageUrl);
    upsertMeta("name", "twitter:image:alt", "GhostCode Dynamics brand preview");

    upsertCanonical(canonical);
    applyJsonLd(schemas);
  }, [title, description, path, image, type, robots, keywords, schemas]);

  return null;
}
