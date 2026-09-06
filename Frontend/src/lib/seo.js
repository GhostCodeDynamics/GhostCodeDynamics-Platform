const ENV_SITE_URL =
  typeof import.meta !== "undefined" &&
  import.meta.env &&
  import.meta.env.VITE_SITE_URL
    ? import.meta.env.VITE_SITE_URL
    : "";

export const SITE = {
  name: "GhostCode Dynamics",
  shortName: "GhostCode",
  url: ENV_SITE_URL || "https://ghostcodedynamics.github.io",
  locale: "en_IN",
  language: "en",
  description:
    "GhostCode Dynamics is a founder-led technology brand building digital solutions for businesses and empowering the next generation of tech professionals.",
  email: "ghostcodedynamics@gmail.com",
  founder: "Jeet Ahirwar",
  themeColor: "#0a0a12",
  sameAs: [
    "https://www.linkedin.com/company/ghostcodedynamics/",
    "https://www.linkedin.com/in/jeetahirwar/",
    "https://www.instagram.com/ghostcode_dynamics",
  ],
};

export const DEFAULT_OG_IMAGE = "/og-image.webp";

export const DEFAULT_ROBOTS =
  "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

export const NOINDEX_ROBOTS = "noindex, follow";

export function absoluteUrl(path = "/") {
  return new URL(path, SITE.url).toString();
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      url: SITE.url,
    },
    inLanguage: SITE.language,
  };
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
    logo: absoluteUrl("/android-chrome-512.png"),
    email: SITE.email,
    founder: {
      "@type": "Person",
      name: SITE.founder,
      url: absoluteUrl("/founder"),
    },
    sameAs: SITE.sameAs,
  };
}

export function webPageSchema(title, description, path) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: absoluteUrl(path),
    isPartOf: {
      "@type": "WebSite",
      name: SITE.name,
      url: SITE.url,
    },
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      url: SITE.url,
    },
    inLanguage: SITE.language,
  };
}

export function breadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function founderSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: SITE.founder,
    jobTitle: `Founder, ${SITE.name}`,
    url: absoluteUrl("/founder"),
    image: absoluteUrl("/og-image.webp"),
    worksFor: {
      "@type": "Organization",
      name: SITE.name,
      url: SITE.url,
    },
    alumniOf: "MCA - Cyber Security",
    knowsAbout: ["MERN Stack", "Cybersecurity", "Web Development", "Student Mentorship"],
    sameAs: ["https://www.linkedin.com/in/jeetahirwar/"],
  };
}

const SERVICE_NAMES = [
  "Business Websites",
  "Portfolio Websites",
  "Landing Pages",
  "Web Applications",
  "Project Mentorship",
  "Portfolio Development",
  "Career Guidance",
  "Security Awareness Initiatives",
  "SIEM Projects",
  "Incident Response Labs",
  "Cybersecurity Learning Resources",
];

export function servicesSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "GhostCode Dynamics services",
    itemListElement: SERVICE_NAMES.map((name, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Service",
        name,
        provider: {
          "@type": "Organization",
          name: SITE.name,
          url: SITE.url,
        },
        areaServed: "Worldwide",
      },
    })),
  };
}

export function articleSchema(post) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: post.cover,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      "@type": "Person",
      name: post.author.name,
    },
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      url: absoluteUrl("/"),
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absoluteUrl(`/blog/${post.slug}`),
    },
  };
}
