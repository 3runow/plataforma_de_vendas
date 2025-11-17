import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bricks Store - Loja de Blocos de Montar",
    short_name: "Bricks",
    description:
      "A melhor loja de blocos de montar e minifiguras colecionáveis do Brasil",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#9333ea",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
