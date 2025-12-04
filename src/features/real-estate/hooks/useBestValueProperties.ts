/**
 * useBestValueProperties Hook
 * 
 * Fetches properties priced below the district average price per m².
 * Uses the district_best_value_properties view in Supabase.
 * 
 * Features:
 * - Lazy loading (only fetches when enabled)
 * - Filters by district, purpose, and optional property type
 * - Returns top N properties sorted by discount percentage
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { 
  BestValueProperty, 
  BestValueQueryParams, 
  NormalizedPurpose, 
  PropertyType 
} from '../types/bestValue';

/**
 * Default number of best value properties to fetch
 */
const DEFAULT_LIMIT = 5;

/**
 * Fetch best value properties from Supabase
 */
async function fetchBestValueProperties(
  params: BestValueQueryParams
): Promise<BestValueProperty[]> {
  const { district, normalizedPurpose, propertyType, limit = DEFAULT_LIMIT } = params;

  // Build the query
  let query = supabase
    .from('district_best_value_properties' as any)
    .select('*')
    .eq('district', district)
    .eq('normalized_purpose', normalizedPurpose)
    .order('discount_pct', { ascending: false })
    .limit(limit);

  // Add property type filter if provided
  if (propertyType) {
    query = query.eq('property_type', propertyType);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching best value properties:', error);
    throw new Error(`Failed to fetch best value properties: ${error.message}`);
  }

  return (data as unknown as BestValueProperty[]) || [];
}

/**
 * Hook options
 */
interface UseBestValuePropertiesOptions {
  /** The district to search in */
  district: string | null;
  /** The purpose (بيع or إيجار) */
  normalizedPurpose: NormalizedPurpose;
  /** Optional property type filter */
  propertyType?: PropertyType | null;
  /** Number of results to fetch (default: 5) */
  limit?: number;
  /** Whether to enable the query (for lazy loading) */
  enabled?: boolean;
}

/**
 * Hook to fetch best value properties for a district
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error, refetch } = useBestValueProperties({
 *   district: 'حي النرجس',
 *   normalizedPurpose: 'إيجار',
 *   propertyType: 'شقق',
 *   enabled: showBestValue,
 * });
 * ```
 */
export function useBestValueProperties(options: UseBestValuePropertiesOptions) {
  const {
    district,
    normalizedPurpose,
    propertyType,
    limit = DEFAULT_LIMIT,
    enabled = true,
  } = options;

  return useQuery({
    queryKey: [
      'best-value-properties',
      district,
      normalizedPurpose,
      propertyType,
      limit,
    ],
    queryFn: () =>
      fetchBestValueProperties({
        district: district!,
        normalizedPurpose,
        propertyType: propertyType || undefined,
        limit,
      }),
    // Only run the query if:
    // 1. enabled is true
    // 2. district is provided
    enabled: enabled && !!district,
    // Cache for 30 minutes (prices don't change that often)
    staleTime: 1000 * 60 * 30,
    // Keep previous data while fetching new data
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Helper function to format discount percentage for display
 * 
 * @example
 * formatDiscountPct(15.5) // "15.5%"
 * formatDiscountPct(15.5, 'ar') // "١٥٫٥٪"
 */
export function formatDiscountPct(
  discountPct: number,
  locale: 'ar' | 'en' = 'ar'
): string {
  const formatter = new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
  
  return formatter.format(discountPct / 100);
}

/**
 * Helper function to format price in SAR
 * 
 * @example
 * formatPriceSAR(150000) // "١٥٠٬٠٠٠ ر.س"
 * formatPriceSAR(150000, 'en') // "SAR 150,000"
 */
export function formatPriceSAR(
  price: number,
  locale: 'ar' | 'en' = 'ar'
): string {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    style: 'currency',
    currency: 'SAR',
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Helper function to format area in m²
 * 
 * @example
 * formatArea(150) // "١٥٠ م²"
 * formatArea(150, 'en') // "150 m²"
 */
export function formatArea(
  area: number,
  locale: 'ar' | 'en' = 'ar'
): string {
  const formatter = new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    maximumFractionDigits: 0,
  });
  
  const unit = locale === 'ar' ? 'م²' : 'm²';
  return `${formatter.format(area)} ${unit}`;
}
