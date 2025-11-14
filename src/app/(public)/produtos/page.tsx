import React from "react";

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
