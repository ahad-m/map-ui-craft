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
  // Memoize displayed favorites
  const displayedFavorites = useMemo(() => {
    const propsArray = properties || [];
    const favsArray = favorites || [];
    return propsArray.filter((p) => favsArray.includes(p.id));
  }, [properties, favorites]);

  // Memoize favorites count
  const favoritesCount = useMemo(() => (favorites || []).length, [favorites]);

  // Memoize hasFavorites check
  const hasFavorites = useMemo(() => favoritesCount > 0, [favoritesCount]);

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
