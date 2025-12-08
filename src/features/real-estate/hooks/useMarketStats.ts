/**
 * useMarketStats Hook
 * 
 * Fetches market statistics for districts including average price per m².
 * Now also re-exports best value properties functionality for convenience.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Market statistics for a district
 */
export type MarketStat = {
  /** City name */
  city: string;
  /** District name */
  district: string;
  /** Average price per m² in SAR */
  avg_price_per_m2: number;
  /** Number of properties in this district */
  properties_count: number;
  /** Normalized purpose (بيع or إيجار) */
  normalized_purpose: string;
  /** Legacy field - kept for compatibility */
  purpose?: string;
  /** District polygon points for mapping (if available) */
  district_points?: { lat: number; lng: number }[];
  /** Average latitude of properties in district */
  avg_lat: number;
  /** Average longitude of properties in district */
  avg_lon: number;
};

/**
 * Normalized purpose type
 */
export type NormalizedPurpose = 'بيع' | 'إيجار';

/**
 * Hook to fetch market statistics for districts
 * 
 * @param purpose - The normalized purpose ('بيع' for sale, 'إيجار' for rent)
 * @returns Query result with market stats array
 * 
 * @example
 * ```tsx
 * const { data: stats, isLoading } = useMarketStats('بيع');
 * ```
 */
export const useMarketStats = (purpose: NormalizedPurpose) => {
  return useQuery({
    queryKey: ['market-stats', purpose],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('district_market_stats' as any)
        .select('*')
        .eq('normalized_purpose', purpose)
        .order('avg_price_per_m2', { ascending: false });

      if (error) {
        console.error('Error fetching market stats:', error);
        throw new Error(`Failed to fetch market stats: ${error.message}`);
      }

      return data as unknown as MarketStat[];
    },
    // Cache for 1 hour - market stats don't change frequently
    staleTime: 1000 * 60 * 60,
  });
};

/**
 * Hook to fetch market stats for a specific district
 * 
 * @param district - The district name
 * @param purpose - The normalized purpose
 * @returns Query result with single market stat or null
 * 
 * @example
 * ```tsx
 * const { data: stat } = useDistrictMarketStat('حي النرجس', 'بيع');
 * ```
 */
export const useDistrictMarketStat = (
  district: string | null,
  purpose: NormalizedPurpose
) => {
  return useQuery({
    queryKey: ['market-stat', district, purpose],
    queryFn: async () => {
      if (!district) return null;

      const { data, error } = await supabase
        .from('district_market_stats' as any)
        .select('*')
        .eq('district', district)
        .eq('normalized_purpose', purpose)
        .single();

      if (error) {
        // PGRST116 = no rows found, which is not an error for our use case
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error fetching district market stat:', error);
        throw new Error(`Failed to fetch district market stat: ${error.message}`);
      }

      return data as unknown as MarketStat;
    },
    enabled: !!district,
    staleTime: 1000 * 60 * 60,
  });
};

/**
 * Re-export best value properties hook and utilities for convenience
 */
export {
  useBestValueProperties,
  formatDiscountPct,
  formatPriceSAR,
  formatArea,
} from './useBestValueProperties';
