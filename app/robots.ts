import type { MetadataRoute } from "next";

/** The public site is indexable; the workspace and invite links are not. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/privacy"],
        disallow: ["/aaj", "/baat", "/work", "/kaam", "/naya", "/projects", "/documents", "/hazri", "/approvals", "/staff", "/search", "/khabar", "/settings", "/more", "/setup", "/join", "/api", "/demo", "/preview", "/checklists", "/checklist"],
      },
    ],
    sitemap: "https://waakya.com/sitemap.xml",
  };
}
