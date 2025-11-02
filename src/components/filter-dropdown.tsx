"use client";

import { useState, useRef, useEffect } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "./ui/button";

interface FilterOption {
  id: string;
  label: string;
}

interface FilterDropdownProps {
  onFilterChange: (filters: string[]) => void;
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

export default function FilterDropdown({ onFilterChange }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-zinc-50 font-medium hover:underline"
      >
        <Filter className="h-4 w-4" />
        Filtros
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 text-sm">Filtrar por:</h3>
              <div className="flex items-center gap-2">
                {selectedFilters.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="text-xs text-blue-600 hover:text-blue-700 h-auto py-1 px-2"
                  >
                    Limpar
                  </Button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-1.5 max-h-80 overflow-y-auto">
              {filterOptions.map((option) => {
                const isSelected = selectedFilters.includes(option.id);
                return (
                  <button
                    key={option.id}
                    onClick={() => handleFilterToggle(option.id)}
                    className={`
                      w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left
                      transition-colors
                      ${
                        isSelected
                          ? "bg-blue-50 text-blue-700"
                          : "hover:bg-gray-50 text-gray-700"
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
                    <span className="font-medium">{option.label}</span>
                  </button>
                );
              })}
            </div>

            {selectedFilters.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-center text-gray-600">
                  {selectedFilters.length} filtro{selectedFilters.length > 1 ? "s" : ""} selecionado{selectedFilters.length > 1 ? "s" : ""}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
