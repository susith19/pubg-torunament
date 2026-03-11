import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/login",
          "/signup",
          "/profile",
          "/my-matches",
          "/redeem-points",
          "/tournaments/*/register",
          "/admin",
          "/api",
        ],
      },
    ],
    sitemap: "https://kingpubgtournaments.com/sitemap.xml",
  };
}