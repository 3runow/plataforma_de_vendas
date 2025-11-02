"use client";

import { Filter, X } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

interface ProductsFilterProps {
  selectedFilters: string[];
  onFilterChange: (filters: string[]) => void;
}

const filterOptions = [
  { id: "bob-esponja", label: "Bob Esponja", icon: "🟡" },
  { id: "disney", label: "Disney", icon: "🪐" },
  { id: "hello-kitty", label: "Hello Kitty", icon: "🌸" },
  { id: "lilo-stitch", label: "Lilo & Stitch", icon: "👾" },
  { id: "mario-bros", label: "Mario Bros", icon: "🍄" },
  { id: "pokemon", label: "Pokémon", icon: "⚡" },
  { id: "rei-leao", label: "Rei Leão", icon: "🦁" },
  { id: "ursinho-pooh", label: "Ursinho Pooh", icon: "🐻" },
];

export function ProductsFilter({
  selectedFilters,
  onFilterChange,
}: ProductsFilterProps) {
  const hasActiveFilters = selectedFilters.length > 0;

  const handleFilterToggle = (filterId: string) => {
    const newFilters = selectedFilters.includes(filterId)
      ? selectedFilters.filter((id) => id !== filterId)
      : [...selectedFilters, filterId];

    onFilterChange(newFilters);
  };

  const handleClearFilters = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFilterChange([]);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-9 sm:h-10 gap-2 px-3 sm:px-4",
            "border-gray-300 hover:bg-gray-50 hover:border-gray-400",
            "transition-all duration-200",
            hasActiveFilters && "border-primary bg-primary/5"
          )}
        >
          <Filter className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium">Filtros</span>
          {hasActiveFilters && (
            <Badge
              variant="secondary"
              className="ml-1 h-5 px-1.5 text-xs bg-primary text-primary-foreground"
            >
              {selectedFilters.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-64 p-2"
      >
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="text-sm font-semibold text-gray-900">
            Filtrar por categoria
          </DropdownMenuLabel>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-7 px-2 text-xs text-gray-600 hover:text-gray-900"
            >
              <X className="h-3 w-3 mr-1" />
              Limpar
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {filterOptions.map((option) => {
            const isSelected = selectedFilters.includes(option.id);
            return (
              <DropdownMenuCheckboxItem
                key={option.id}
                checked={isSelected}
                onCheckedChange={() => handleFilterToggle(option.id)}
                className="cursor-pointer px-2 py-2.5 hover:bg-gray-50 rounded-sm"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{option.icon}</span>
                  <span className="text-sm text-gray-700">{option.label}</span>
                </div>
              </DropdownMenuCheckboxItem>
            );
          })}
        </div>
        {hasActiveFilters && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">
              <p className="text-xs text-center text-gray-500">
                {selectedFilters.length} categoria{selectedFilters.length > 1 ? "s" : ""} selecionada{selectedFilters.length > 1 ? "s" : ""}
              </p>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

