"use client";

import type { Color } from "./types";

interface VariantSelectorProps {
  sizes: string[];
  colors: Color[];
  selectedSize?: string;
  selectedColor?: Color;
  onSizeSelectAction: (size: string | undefined) => void;
  onColorSelectAction: (color: Color | undefined) => void;
}

export default function VariantSelector({
  sizes,
  colors,
  selectedSize,
  selectedColor,
  onSizeSelectAction,
  onColorSelectAction,
}: VariantSelectorProps) {
  return (
    <div className="space-y-6">
      {sizes.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Tamanho</p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => (
              <button
                key={size}
                onClick={() =>
                  onSizeSelectAction(size === selectedSize ? undefined : size)
                }
                className={`px-3 py-2 rounded-md border text-sm ${
                  selectedSize === size
                    ? "border-blue-600 text-blue-600 bg-blue-50"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {colors.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Cor</p>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => (
              <button
                key={color.name}
                onClick={() =>
                  onColorSelectAction(
                    selectedColor?.name === color.name ? undefined : color
                  )
                }
                className={`px-3 py-2 rounded-md border text-sm flex items-center gap-2 ${
                  selectedColor?.name === color.name
                    ? "border-blue-600 text-blue-600 bg-blue-50"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                <span
                  className="inline-block w-4 h-4 rounded"
                  style={{ backgroundColor: color.value }}
                />
                {color.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
