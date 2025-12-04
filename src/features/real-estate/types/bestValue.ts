/**
 * Types for Best Value Properties Feature
 * 
 * These types support the "Best Value Properties vs District Average" feature
 * that shows properties priced below the district average price per m².
 */

/**
 * Property types as stored in the database (Arabic values)
 * These are the exact values from the properties.property_type column
 */
export type PropertyType =
  | 'فلل'
  | 'استوديو'
  | 'شقق'
  | 'دور'
  | 'تاون هاوس'
  | 'دوبلكس'
  | 'عمائر';

/**
 * Normalized purpose values used in market stats and best value queries
 */
export type NormalizedPurpose = 'بيع' | 'إيجار';

/**
 * Property type option for UI dropdowns/selectors
 */
export interface PropertyTypeOption {
  value: PropertyType;
  labelAr: string;
  labelEn: string;
  count?: number;
}

/**
 * All available property types with their translations
 */
export const PROPERTY_TYPES: PropertyTypeOption[] = [
  { value: 'فلل', labelAr: 'فلل', labelEn: 'Villas' },
  { value: 'استوديو', labelAr: 'استوديو', labelEn: 'Studio' },
  { value: 'شقق', labelAr: 'شقق', labelEn: 'Apartments' },
  { value: 'دور', labelAr: 'دور', labelEn: 'Single floor unit' },
  { value: 'تاون هاوس', labelAr: 'تاون هاوس', labelEn: 'Townhouse' },
  { value: 'دوبلكس', labelAr: 'دوبلكس', labelEn: 'Duplex' },
  { value: 'عمائر', labelAr: 'عمائر', labelEn: 'Residential buildings' },
];

/**
 * A property from the district_best_value_properties view
 */
export interface BestValueProperty {
  // Property identification
  id: string;
  url: string | null;
  
  // Property classification
  purpose: string;
  property_type: string;
  normalized_purpose: NormalizedPurpose;
  
  // Location
  city: string;
  district: string;
  lat: number | null;
  lon: number | null;
  final_lat: number | null;
  final_lon: number | null;
  
  // Property details
  title: string | null;
  description: string | null;
  image_url: string | null;
  rooms: number | null;
  baths: number | null;
  halls: number | null;
  time_to_metro_min: number | null;
  
  // Pricing
  price_num: number;
  price_currency: string | null;
  price_period: string | null;
  area_m2: number;
  price_per_m2: number;
  
  // District comparison (the key fields for this feature)
  avg_price_per_m2: number;
  district_properties_count: number;
  discount_pct: number;      // Percentage below district average
  savings_per_m2: number;    // Absolute SAR savings per m²
}

/**
 * Parameters for fetching best value properties
 */
export interface BestValueQueryParams {
  district: string;
  normalizedPurpose: NormalizedPurpose;
  propertyType?: PropertyType;
  limit?: number;
}

/**
 * Response structure for best value properties query
 */
export interface BestValueResponse {
  properties: BestValueProperty[];
  district: string;
  normalizedPurpose: NormalizedPurpose;
  propertyType?: PropertyType;
  avgPricePerM2: number;
}
