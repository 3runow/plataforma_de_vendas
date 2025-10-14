"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickStat {
  label: string;
  value: string;
  change?: number;
  changeLabel?: string;
}

interface QuickStatsProps {
  stats: QuickStat[];
}

export function QuickStats({ stats }: QuickStatsProps) {
  const getTrendIcon = (change?: number) => {
    if (!change) return <Minus className="h-4 w-4 text-gray-400" />;
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  const getTrendColor = (change?: number) => {
    if (!change) return "text-gray-600";
    if (change > 0) return "text-green-600";
    return "text-red-600";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">
          Estatísticas Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="flex flex-col space-y-2 p-3 sm:p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {stat.label}
                </span>
                {getTrendIcon(stat.change)}
              </div>
              <div className="space-y-1">
                <p className="text-xl sm:text-2xl font-bold">{stat.value}</p>
                {stat.change !== undefined && stat.changeLabel && (
                  <p
                    className={cn(
                      "text-xs font-medium",
                      getTrendColor(stat.change)
                    )}
                  >
                    {stat.change > 0 ? "+" : ""}
                    {stat.change.toFixed(1)}% {stat.changeLabel}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
