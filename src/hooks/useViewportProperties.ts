/**
 * Viewport-Based Property Loading Hook
 * 
 * Loads properties only within the visible map viewport
 * Implements batching and caching for optimal performance
 */

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

interface ViewportBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface UseViewportPropertiesProps {
  transactionType: "rent" | "sale";
  viewport: ViewportBounds | null;
  filters: {
    propertyType: string;
    neighborhood: string;
  };
}

/**
 * Fetch properties within viewport bounds
 * Uses spatial queries for optimal performance
 */
const fetchPropertiesInViewport = async (
  transactionType: "rent" | "sale",
  viewport: ViewportBounds,
  filters: { propertyType: string; neighborhood: string }
) => {
  const purpose = transactionType === "rent" ? "للايجار" : "للبيع";
  
  let query = supabase
    .from("properties")
    .select("id, lat, lon, final_lat, final_lon, title, price_num, property_type, district, image_url, rooms, baths, area_m2, purpose")
    .eq("purpose", purpose)
    .not("final_lat", "is", null)
    .not("final_lon", "is", null)
    .gte("final_lat", viewport.south)
    .lte("final_lat", viewport.north)
    .gte("final_lon", viewport.west)
    .lte("final_lon", viewport.east)
    .limit(500); // Batch size

  if (filters.propertyType) {
    query = query.eq("property_type", filters.propertyType);
  }

  if (filters.neighborhood) {
    query = query.eq("district", filters.neighborhood);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
};

/**
 * Hook for viewport-based property loading
 * Only loads properties visible in current map view
 */
export const useViewportProperties = ({
  transactionType,
  viewport,
  filters,
}: UseViewportPropertiesProps) => {
  const [isMapReady, setIsMapReady] = useState(false);
  
  // Debounce viewport changes to avoid excessive queries
  const debouncedViewport = useDebouncedValue(viewport, 500);

  // Mark map as ready after initial load
  useEffect(() => {
    if (!isMapReady) {
      const timer = setTimeout(() => setIsMapReady(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [isMapReady]);

  // Only fetch when map is ready and viewport is available
  const shouldFetch = isMapReady && debouncedViewport !== null;

  const { data: properties = [], isLoading, isFetching } = useQuery({
    queryKey: ["viewport-properties", transactionType, debouncedViewport, filters],
    queryFn: () => {
      if (!debouncedViewport) return [];
      return fetchPropertiesInViewport(transactionType, debouncedViewport, filters);
    },
    enabled: shouldFetch,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const handleMapReady = useCallback(() => {
    setIsMapReady(true);
  }, []);

  return {
    properties,
    isLoading: !isMapReady || isLoading,
    isFetching,
    isMapReady,
    handleMapReady,
  };
};
