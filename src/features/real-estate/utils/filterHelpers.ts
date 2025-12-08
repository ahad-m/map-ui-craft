/**
 * Filter Helper Utilities
 * 

 */

import type { PropertyFilters, Property } from '../types';

/**
 * Parse numeric value from potentially string input
 */
export function parseNumericValue(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '');
    return parseFloat(cleaned) || 0;
  }
  return 0;
}

/**
 * Check if a property matches price filter
 */
export function matchesPriceFilter(
  price: number,
  minPrice: number,
  maxPrice: number
): boolean {
  if (minPrice > 0 && maxPrice > 0) {
    return price >= minPrice && price <= maxPrice;
  }
  if (minPrice > 0) return price >= minPrice;
  if (maxPrice > 0) return price <= maxPrice;
  return true;
}

/**
 * Check if a property matches area filter
 */
export function matchesAreaFilter(
  area: number,
  areaMin: number,
  areaMax: number
): boolean {
  if (areaMin > 0 && areaMax > 0) {
    return area >= areaMin && area <= areaMax;
  }
  if (areaMin > 0) return area >= areaMin;
  if (areaMax > 0) return area <= areaMax;
  return true;
}

/**
 * Check if a property matches metro filter
 */
export function matchesMetroFilter(
  property: Property,
  nearMetro: boolean,
  maxMetroTime: number
): boolean {
  if (!nearMetro) return true;
  
  if (!property.time_to_metro_min) return false;
  
  const metroTime = parseNumericValue(property.time_to_metro_min);
  return !isNaN(metroTime) && metroTime <= maxMetroTime;
}

/**
 * Apply client-side filters to properties
 * (Filters that can't be done efficiently in Supabase)
 */
export function applyClientSideFilters(
  properties: Property[],
  filters: PropertyFilters
): Property[] {
  return properties.filter((property) => {
    const price = parseNumericValue(property.price_num);
    const area = parseNumericValue(property.area_m2);
    
    const priceMatch = matchesPriceFilter(
      price,
      filters.minPrice,
      filters.maxPrice
    );
    
    const areaMatch = matchesAreaFilter(
      area,
      filters.areaMin,
      filters.areaMax
    );
    
    const metroMatch = matchesMetroFilter(
      property,
      filters.nearMetro,
      filters.minMetroTime
    );
    
    return priceMatch && areaMatch && metroMatch;
  });
}

/**
 * Check if any filters are active
 */
export function hasActiveFilters(filters: PropertyFilters): boolean {
  return !!(
    filters.propertyType ||
    filters.neighborhood ||
    filters.minPrice > 0 ||
    filters.maxPrice > 0 ||
    filters.areaMin > 0 ||
    filters.areaMax > 0 ||
    filters.bedrooms ||
    filters.bathrooms ||
    filters.livingRooms ||
    filters.schoolGender ||
    filters.schoolLevel ||
    filters.selectedUniversity ||
    filters.nearMetro ||
    filters.nearMosques
  );
}

/**
 * Map Arabic school gender to filter value
 */
export function mapSchoolGenderToFilter(arabicGender?: string): string {
  if (!arabicGender) return '';
  if (arabicGender === 'بنات') return 'Girls';
  if (arabicGender === 'بنين') return 'Boys';
  return '';
}

/**
 * Map Arabic school level to filter value
 */
export function mapSchoolLevelToFilter(arabicLevel?: string): string {
  if (!arabicLevel) return '';
  if (arabicLevel.includes('ابتدائي')) return 'elementary';
  if (arabicLevel.includes('متوسط')) return 'middle';
  if (arabicLevel.includes('ثانوي')) return 'high';
  if (arabicLevel.includes('روضة')) return 'kindergarten';
  if (arabicLevel.includes('حضانة')) return 'nursery';
  return arabicLevel;
}

/**
 * Get translated school level label
 */
export function getSchoolLevelLabel(level: string, t: (key: string) => string): string {
  const levelMap: Record<string, string> = {
    combined: t('combined'),
    nursery: t('nursery'),
    kindergarten: t('kindergarten'),
    elementary: t('elementary'),
    middle: t('middle'),
    high: t('high'),
  };
  return levelMap[level] || level;
}

/**
 * Get translated school gender label
 */
export function getSchoolGenderLabel(gender: string, t: (key: string) => string): string {
  const genderMap: Record<string, string> = {
    All: t('all'),
    Boys: t('boys'),
    Girls: t('girls'),
  };
  return genderMap[gender] || gender;
}

/**
 * Build Supabase query params from filters
 * Returns an object that can be used to build the query
 */
export function buildSupabaseQueryParams(
  filters: PropertyFilters,
  searchQuery: string,
  transactionType: 'rent' | 'sale'
) {
  return {
    purpose: transactionType === 'sale' ? 'للبيع' : 'للايجار',
    propertyType: filters.propertyType || null,
    neighborhood: filters.neighborhood || null,
    searchQuery: searchQuery || null,
    bedrooms: filters.bedrooms && filters.bedrooms !== 'other' 
      ? parseInt(filters.bedrooms) 
      : null,
    bathrooms: filters.bathrooms && filters.bathrooms !== 'other'
      ? parseInt(filters.bathrooms)
      : null,
    livingRooms: filters.livingRooms && filters.livingRooms !== 'other'
      ? parseInt(filters.livingRooms)
      : null,
  };
}
