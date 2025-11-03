"use client";

import { useEffect, useState } from "react";

interface ImageGalleryProps {
  images: string[];
  selectedImageIndex: number;
  onImageSelectAction: (index: number) => void;
}

export default function ImageGallery({
  images,
  selectedImageIndex,
  onImageSelectAction,
}: ImageGalleryProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const img = new Image();
    img.src = images[selectedImageIndex];
    img.onload = () => setIsLoading(false);
  }, [selectedImageIndex, images]);

  return (
    <div className="flex flex-col space-y-4">
      <div className="relative w-full aspect-square bg-white rounded-lg overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[selectedImageIndex]}
          alt="Product"
          className={`w-full h-full object-contain p-4 transition-opacity duration-300 ${
            isLoading ? "opacity-0" : "opacity-100"
          }`}
        />
      </div>

      {images.length > 1 && (
        <div className="flex justify-center space-x-2 overflow-x-auto pb-2 pt-1">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => onImageSelectAction(index)}
              className={`relative shrink-0 w-20 h-20 rounded-md ${
                selectedImageIndex === index
                  ? "ring-2 ring-blue-500 ring-offset-2"
                  : "ring-1 ring-gray-200"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-contain bg-white p-1 rounded-md"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
