import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Galeria de Produtos - Minifiguras Colecionáveis",
  description:
    "Confira nossa incrível galeria de minifiguras colecionáveis: Pokémon, Disney, Super Mario, Bob Esponja e muito mais. Personagens exclusivos e raros para sua coleção.",
  keywords: [
    "minifiguras",
    "pikachu",
    "mario",
    "luigi",
    "mickey",
    "disney",
    "pokemon",
    "bob esponja",
    "hello kitty",
    "stitch",
    "colecionáveis",
  ],
  openGraph: {
    title: "Galeria de Produtos - Minifiguras Colecionáveis | Bricks",
    description:
      "Confira nossa incrível galeria de minifiguras colecionáveis: Pokémon, Disney, Super Mario e muito mais!",
    type: "website",
    images: [
      {
        url: "/assets/image/2025-09-BRICKS-PIKACHU.jpg",
        width: 800,
        height: 800,
        alt: "Minifiguras Colecionáveis Bricks",
      },
    ],
  },
};

const imageFiles = [
  "2025-09-BRICKS-ANGEL.jpg",
  "2025-09-BRICKS-BOB.jpg",
  "2025-09-BRICKS-BURRO.jpg",
  "2025-09-BRICKS-HELLO_KITTY.jpg",
  "2025-09-BRICKS-LEITAO.jpg",
  "2025-09-BRICKS-LUIGI.jpg",
  "2025-09-BRICKS-LULA_MOLUSCO.jpg",
  "2025-09-BRICKS-MARCIANO.jpg",
  "2025-09-BRICKS-MARGARIDA.jpg",
  "2025-09-BRICKS-MARIO.jpg",
  "2025-09-BRICKS-MICKEY.jpg",
  "2025-09-BRICKS-MINNIE_ROSA.jpg",
  "2025-09-BRICKS-PATETA.jpg",
  "2025-09-BRICKS-PATO_DONALD.jpg",
  "2025-09-BRICKS-PATRICK.jpg",
  "2025-09-BRICKS-PIKACHU.jpg",
  "2025-09-BRICKS-PLUTO.jpg",
  "2025-09-BRICKS-POOH.jpg",
  "2025-09-BRICKS-PSYDUCK.jpg",
  "2025-09-BRICKS-PUMBA.jpg",
  "2025-09-BRICKS-SIMBA.jpg",
  "2025-09-BRICKS-SIRIGUEIJO.jpg",
  "2025-09-BRICKS-STITCH.jpg",
  "2025-09-BRICKS-TIGRAO.jpg"
];

export default function ProdutosPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Galeria de Produtos</h1>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        {imageFiles.map((file) => (
          <div key={file} style={{ width: 200, height: 200, border: "1px solid #eee", borderRadius: 8, overflow: "hidden" }}>
            <img src={`/assets/image/${file}`} alt={file} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
