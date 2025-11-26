/**
 * Favorites Logic Hook
 * 
 * Manages favorites-related business logic including filtering,
 * display, and interaction handlers for favorited properties.
 */

import { useMemo } from "react";
import { toast } from "@/hooks/use-toast";

interface FavoritesLogicProps {
  properties: any[];
  favorites: string[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  t: (key: string) => string;
}

export const useFavoritesLogic = ({
  properties,
  favorites,
  isFavorite,
  toggleFavorite,
  t,
}: FavoritesLogicProps) => {
  /**
   * Filter displayed properties to show only favorites
   */
  const displayedFavorites = useMemo(() => {
    return properties.filter((p) => favorites.includes(p.id));
  }, [properties, favorites]);

  /**
   * Check if any properties are favorited
   */
  const hasFavorites = favorites.length > 0;

  /**
   * Get count of favorited properties
   */
  const favoritesCount = favorites.length;

  /**
   * Handle toggling favorite status with toast notification
   */
  const handleToggleFavorite = (propertyId: string) => {
    toggleFavorite(propertyId);
    
    if (isFavorite(propertyId)) {
      toast({ title: t("removedFromFavorites") });
    } else {
      toast({ title: t("addedToFavorites") });
    }
  };

  /**
   * Check if a specific property is favorited
   */
  const isPropertyFavorited = (propertyId: string) => {
    return isFavorite(propertyId);
  };

  return {
    displayedFavorites,
    hasFavorites,
    favoritesCount,
    handleToggleFavorite,
    isPropertyFavorited,
  };
};
