"use client";

import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ORDER_STATUS_META, DASHBOARD_STATUS_FLOW } from "@/constants/order-status";

interface OrdersFilterProps {
  value: string;
  onValueChange: (value: string) => void;
}

const statusOptions = [
  { value: "all", label: "Todos os pedidos", color: "bg-gray-100 text-gray-800" },
  ...DASHBOARD_STATUS_FLOW.map((status) => ({
    value: status,
    label: ORDER_STATUS_META[status].label,
    color: ORDER_STATUS_META[status].badgeClass,
  })),
];

export function OrdersFilter({ value, onValueChange }: OrdersFilterProps) {
  const selectedOption = statusOptions.find((opt) => opt.value === value) || statusOptions[0];
  const hasActiveFilter = value !== "all";

  const handleClearFilter = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange("all");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full sm:w-auto h-9 sm:h-10 gap-2 px-3 sm:px-4",
            "border-gray-300 hover:bg-gray-50 hover:border-gray-400",
            "transition-all duration-200",
            hasActiveFilter && "border-primary bg-primary/5"
          )}
        >
          <Filter className="h-4 w-4 text-gray-600" />
          <span className="hidden sm:inline text-sm font-medium">
            {selectedOption.label}
          </span>
          <span className="sm:hidden text-sm font-medium">Filtro</span>
          {hasActiveFilter && (
            <Badge
              variant="secondary"
              className="ml-1 h-5 px-1.5 text-xs bg-primary text-primary-foreground"
            >
              Ativo
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-56 p-2"
      >
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="text-sm font-semibold text-gray-900">
            Filtrar por status
          </DropdownMenuLabel>
          {hasActiveFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilter}
              className="h-7 px-2 text-xs text-gray-600 hover:text-gray-900"
            >
              <X className="h-3 w-3 mr-1" />
              Limpar
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={onValueChange}
        >
          {statusOptions.map((option) => (
            <DropdownMenuRadioItem
              key={option.value}
              value={option.value}
              className="cursor-pointer px-2 py-2.5 hover:bg-gray-50 rounded-sm"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "w-2.5 h-2.5 rounded-full shrink-0",
                    option.color.split(" ")[0]
                  )}
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </div>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

