import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fun Mun — Leisure Time",
    short_name: "Fun Mun",
    description: "Bookmark books, movies, series, podcasts and places for your free time.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3ece3",
    theme_color: "#b85c38",
    orientation: "portrait",
    icons: [
      {
        src: "/pwa-icon/192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-icon/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-icon/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
