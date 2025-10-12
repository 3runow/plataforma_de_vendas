"use client";

import { Heart } from "lucide-react";
import { Button } from "./ui/button";
import { useFavorites } from "@/contexts/favorites-context";
import Link from "next/link";
import { Badge } from "./ui/badge";

export default function FavoritesButton() {
  const { favoritesCount } = useFavorites();

  return (
    <Link href="/favoritos">
      <Button
        variant="ghost"
        size="icon"
        className="text-zinc-50 hover:bg-zinc-50/10 relative"
      >
        <Heart className="h-5 w-5" />
        {favoritesCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500"
          >
            {favoritesCount}
          </Badge>
        )}
      </Button>
    </Link>
  );
}
