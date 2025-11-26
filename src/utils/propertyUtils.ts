/**
 * Property Utility Functions
 * 
 * Collection of utility functions for processing and formatting property data.
 * Provides consistent formatting for prices, areas, and property information display.
 * 
 * @module utils/propertyUtils
 */

/**
 * Format price with currency symbol
 * 
 * Formats a numeric price value with thousands separators (Arabic locale)
 * and appends the currency symbol.
 * 
 * @param price - Price value to format
 * @param currency - Currency symbol (default: Saudi Riyal 'ر.س')
 * @returns Formatted price string with currency
 * 
 * @example
 * formatPrice(500000) // "500,000 ر.س"
 * formatPrice(1234567.89, "USD") // "1,234,567.89 USD"
 */
export const formatPrice = (price: number, currency: string = 'ر.س'): string => {
  return `${price.toLocaleString('ar-SA')} ${currency}`;
};

/**
 * Format area in square meters
 * 
 * Formats an area value with thousands separators (Arabic locale)
 * and appends the square meters unit (م²).
 * 
 * @param area - Area value to format
 * @returns Formatted area string with unit
 * 
 * @example
 * formatArea(250) // "250 م²"
 * formatArea(1500) // "1,500 م²"
 */
export const formatArea = (area: number): string => {
  return `${area.toLocaleString('ar-SA')} م²`;
};

/**
 * Check if property has valid coordinates
 * 
 * Validates that a property object contains valid latitude and longitude values.
 * Ensures coordinates are not null, NaN, or zero (which would indicate missing data).
 * 
 * @param property - Property object to check
 * @returns True if property has valid coordinates, false otherwise
 * 
 * @example
 * hasValidCoordinates({ lat: 24.7136, lon: 46.6753 }) // true
 * hasValidCoordinates({ lat: 0, lon: 0 }) // false (invalid)
 * hasValidCoordinates({ lat: null, lon: null }) // false
 */
export const hasValidCoordinates = (property: any): boolean => {
  const lat = Number(property.lat);
  const lng = Number(property.lon);
  return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
};

/**
 * Get property display name
 * 
 * Returns the property title if available, otherwise returns a default name.
 * Useful for displaying property names in lists and cards.
 * 
 * @param property - Property object
 * @returns Property display name or default text
 * 
 * @example
 * getPropertyDisplayName({ title: "فيلا فاخرة" }) // "فيلا فاخرة"
 * getPropertyDisplayName({ title: null }) // "عقار"
 */
export const getPropertyDisplayName = (property: any): string => {
  return property.title || 'عقار';
};

/**
 * Get property location string
 * 
 * Constructs a formatted location string from district and city.
 * Returns components separated by comma, or default text if no location data.
 * 
 * @param property - Property object
 * @returns Formatted location string
 * 
 * @example
 * getPropertyLocation({ district: "العليا", city: "الرياض" }) 
 * // "العليا, الرياض"
 * 
 * getPropertyLocation({ district: "العليا" }) 
 * // "العليا"
 * 
 * getPropertyLocation({}) 
 * // "موقع غير محدد"
 */
export const getPropertyLocation = (property: any): string => {
  const parts = [];
  
  // Add district if available
  if (property.district) parts.push(property.district);
  
  // Add city if available
  if (property.city) parts.push(property.city);
  
  // Join with comma or return default message
  return parts.join(', ') || 'موقع غير محدد';
};
