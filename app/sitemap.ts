import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://kingpubgtournaments.com";

  return [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/tournaments`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/schedule`,
      lastModified: new Date(),
    },
  ];
}