import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface UseViewportPropertiesOptions {
  transactionType: 'rent' | 'sale';
  filters: any;
  searchQuery: string;
  enabled: boolean;
}

export const useViewportProperties = ({
  transactionType,
  filters,
  searchQuery,
  enabled
}: UseViewportPropertiesOptions) => {
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cancel any pending requests when component unmounts or bounds change
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const { data: properties = [], isLoading, error } = useQuery({
    queryKey: ['viewport-properties', transactionType, filters, searchQuery, mapBounds],
    queryFn: async () => {
      // Cancel previous request
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      if (!mapBounds) {
        return [];
      }

      let query = supabase
        .from('properties')
        .select('id,lat,lon,final_lat,final_lon,title,price_num,property_type,district,image_url,rooms,baths,area_m2,purpose,city')
        .eq('purpose', transactionType === 'sale' ? 'للبيع' : 'للايجار')
        .not('final_lat', 'is', null)
        .not('final_lon', 'is', null)
        .eq('city', 'الرياض')
        .gte('final_lat', mapBounds.south)
        .lte('final_lat', mapBounds.north)
        .gte('final_lon', mapBounds.west)
        .lte('final_lon', mapBounds.east);

      // Apply filters
      if (filters.propertyType) {
        query = query.eq('property_type', filters.propertyType);
      }
      if (filters.neighborhood) {
        query = query.eq('district', filters.neighborhood);
      }
      if (searchQuery) {
        query = query.or(`city.ilike.%${searchQuery}%,district.ilike.%${searchQuery}%,title.ilike.%${searchQuery}%`);
      }
      if (filters.bedrooms && filters.bedrooms !== 'other') {
        const count = parseInt(filters.bedrooms);
        if (!isNaN(count)) query = query.eq('rooms', count);
      }
      if (filters.bathrooms && filters.bathrooms !== 'other') {
        const count = parseInt(filters.bathrooms);
        if (!isNaN(count)) query = query.eq('baths', count);
      }
      if (filters.livingRooms && filters.livingRooms !== 'other') {
        const count = parseInt(filters.livingRooms);
        if (!isNaN(count)) query = query.eq('halls', count);
      }

      const { data, error } = await query.limit(500);

      if (error) throw error;

      // Apply client-side filters for price, area, metro
      return (data || []).filter((property) => {
        const priceValue = property.price_num as any;
        const price = typeof priceValue === 'string' ? parseFloat(priceValue.replace(/,/g, '')) : Number(priceValue) || 0;
        const areaValue = property.area_m2 as any;
        const area = typeof areaValue === 'string' ? parseFloat(areaValue.replace(/,/g, '')) : Number(areaValue) || 0;

        let priceMatch = true;
        if (filters.minPrice > 0 && filters.maxPrice > 0) {
          priceMatch = price >= filters.minPrice && price <= filters.maxPrice;
        } else if (filters.minPrice > 0) {
          priceMatch = price >= filters.minPrice;
        } else if (filters.maxPrice > 0) {
          priceMatch = price <= filters.maxPrice;
        }

        let areaMatch = true;
        if (filters.areaMin > 0 && filters.areaMax > 0) {
          areaMatch = area >= filters.areaMin && area <= filters.areaMax;
        } else if (filters.areaMin > 0) {
          areaMatch = area >= filters.areaMin;
        } else if (filters.areaMax > 0) {
          areaMatch = area <= filters.areaMax;
        }

        return priceMatch && areaMatch;
      });
    },
    enabled: enabled && !!mapBounds,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const updateBounds = useCallback((bounds: MapBounds) => {
    setMapBounds(bounds);
  }, []);

  return {
    properties,
    isLoading,
    error,
    updateBounds,
  };
};
