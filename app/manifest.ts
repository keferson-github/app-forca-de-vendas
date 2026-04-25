import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "App Força de Vendas",
    short_name: "Força Vendas",
    description: "Web App e PWA para força de vendas.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f6f6f8",
    theme_color: "#171717",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
