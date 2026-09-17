import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://waakya.com/", changeFrequency: "weekly", priority: 1 },
    { url: "https://waakya.com/login", changeFrequency: "monthly", priority: 0.5 },
    { url: "https://waakya.com/privacy", changeFrequency: "yearly", priority: 0.3 },
  ];
}
