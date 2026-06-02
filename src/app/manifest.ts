import type { MetadataRoute } from "next";

// Web app manifest — makes PrivateSpace installable as a PWA. Next.js serves
// this at /manifest.webmanifest and links it automatically. Kept deliberately
// generic (like the rest of the public face) — reveals nothing about the event.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PrivateSpace",
    short_name: "PrivateSpace",
    description: "A private, invite-only members area.",
    id: "/",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
