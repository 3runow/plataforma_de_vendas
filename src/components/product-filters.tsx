"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

interface FilterOption {
  id: string;
  label: string;
  icon?: string;
}

interface ProductFiltersProps {
  onFilterChange: (filters: string[]) => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

const filterOptions: FilterOption[] = [
  { id: "bob-esponja", label: "Bob Esponja" },
  { id: "disney", label: "Disney" },
  { id: "hello-kitty", label: "Hello Kitty" },
  { id: "lilo-stitch", label: "Lilo & Stitch" },
  { id: "mario-bros", label: "Mario Bros" },
  { id: "pokemon", label: "Pokémon" },
  { id: "rei-leao", label: "Rei Leão" },
  { id: "ursinho-pooh", label: "Ursinho Pooh" },
];

export default function ProductFilters({
  onFilterChange,
  isMobileOpen = false,
  onMobileClose,
}: ProductFiltersProps) {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const handleFilterToggle = (filterId: string) => {
    const newFilters = selectedFilters.includes(filterId)
      ? selectedFilters.filter((id) => id !== filterId)
      : [...selectedFilters, filterId];

    setSelectedFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClearFilters = () => {
    setSelectedFilters([]);
    onFilterChange([]);
  };

  const filterContent = (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-gray-900">Filtros</h2>
        {selectedFilters.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 h-auto"
          >
            Limpar
          </Button>
        )}
        {isMobileOpen && onMobileClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileClose}
            className="lg:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2">
        {filterOptions.map((option) => {
          const isSelected = selectedFilters.includes(option.id);
          return (
            <button
              key={option.id}
              onClick={() => handleFilterToggle(option.id)}
              className={`
                relative px-3 py-2.5 rounded-md border transition-all duration-200
                flex items-center gap-2
                text-left text-sm
                ${
                  isSelected
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }
              `}
            >
              <div
                className={`
                  w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center
                  ${
                    isSelected
                      ? "border-blue-600 bg-blue-600"
                      : "border-gray-300"
                  }
                `}
              >
                {isSelected && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                )}
              </div>
              <span
                className={`font-medium ${
                  isSelected ? "text-blue-700" : "text-gray-700"
                }`}
              >
                {option.label}
              </span>
            </button>
          );
        })}
      </div>

      {selectedFilters.length > 0 && (
        <div className="mt-3 p-2 bg-blue-50 rounded-md">
          <p className="text-xs text-blue-700 font-medium text-center">
            {selectedFilters.length} filtro{selectedFilters.length > 1 ? "s" : ""}
          </p>
        </div>
      )}
    </>
  );

  // Mobile overlay
  if (isMobileOpen) {
    return (
      <>
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
        <div className="fixed left-0 top-0 bottom-0 w-80 bg-white z-50 p-6 overflow-y-auto lg:hidden shadow-xl">
          {filterContent}
        </div>
      </>
    );
  }

  // Desktop sidebar
  return (
    <Card className="p-4 sticky top-4 hidden lg:block w-full">
      {filterContent}
    </Card>
  );
}
