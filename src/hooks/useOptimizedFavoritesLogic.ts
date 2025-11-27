/**
 * Optimized Favorites Logic Hook
 * 
 * High-performance favorites management with memoization
 */

import { useMemo, useCallback } from "react";
import { toast } from "@/hooks/use-toast";

interface OptimizedFavoritesLogicProps {
  properties: any[];
  favorites: string[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  t: (key: string) => string;
}

/**
 * Optimized favorites logic with memoized computations
 */
export const useOptimizedFavoritesLogic = ({
  properties,
  favorites,
  isFavorite,
  toggleFavorite,
  t,
}: OptimizedFavoritesLogicProps) => {
  // Always work with safe arrays to avoid undefined issues
  const propsArray = Array.isArray(properties) ? properties : [];
  const favsArray = Array.isArray(favorites) ? favorites : [];

  // Compute favorites synchronously (cheap vs. risk of hook dependency bugs)
  const displayedFavorites = propsArray.filter((p) => favsArray.includes(p.id));
  const favoritesCount = favsArray.length;
  const hasFavorites = favoritesCount > 0;

  // Memoized toggle handler
  const handleToggleFavorite = useCallback(
    (propertyId: string) => {
      toggleFavorite(propertyId);

      if (isFavorite(propertyId)) {
        toast({ title: t("removedFromFavorites") });
      } else {
        toast({ title: t("addedToFavorites") });
      }
    },
    [toggleFavorite, isFavorite, t]
  );

  // Memoized property favorited check
  const isPropertyFavorited = useCallback(
    (propertyId: string) => isFavorite(propertyId),
    [isFavorite]
  );

  return {
    displayedFavorites,
    hasFavorites,
    favoritesCount,
    handleToggleFavorite,
    isPropertyFavorited,
  };
};
