"use client";

import { Box, Ruler, Layers, Palette } from "lucide-react";
import * as React from "react";

interface Props {
  description: string;
}

interface Characteristic {
  icon: React.ReactNode;
  label: string;
  value: string;
}

export default function ProductDescription({ description }: Props) {
  const characteristics: Characteristic[] = [
    {
      icon: <Box className="w-8 h-8 text-blue-600" />,
      label: "Conteúdo da caixa",
      value: "Bricks Tigrão + manual",
    },
    {
      icon: <Layers className="w-8 h-8 text-lime-700" />,
      label: "Peças",
      value: "80 peças coloridas",
    },
    {
      icon: <Ruler className="w-8 h-8 text-pink-600" />,
      label: "Dimensões",
      value: "5,8 x 3,6 x 5,8cm (LxPxA)",
    },
    {
      icon: <Palette className="w-8 h-8 text-orange-600" />,
      label: "Material",
      value: "Plástico ABS premium",
    },
  ];
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-4 tracking-tight">
        Características do produto
      </h2>
      <div className="w-full max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-8">
        {characteristics.map((item) => (
          <div
            key={item.label}
            className="flex items-center rounded-2xl shadow-md bg-white p-6 gap-5 min-h-[94px] transition-transform hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="shrink-0 flex items-center justify-center bg-linear-to-br from-blue-100 via-white to-gray-100 rounded-full w-16 h-16 shadow-inner mr-2">
              {item.icon}
            </div>
            <div>
              <div className="font-bold text-base text-gray-700 leading-tight mb-1">
                {item.label}
              </div>
              <div className="text-2xl font-semibold text-gray-900 leading-snug">
                {item.value}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Descrição do produto
        </h3>
        <p className="text-gray-700 leading-relaxed whitespace-pre-line">
          {description}
        </p>
      </div>
    </section>
  );
}
