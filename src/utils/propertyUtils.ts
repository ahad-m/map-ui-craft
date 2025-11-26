/**
 * Utility functions for property data processing
 */

/**
 * Format price with currency
 * @param price - Price value
 * @param currency - Currency symbol
 * @returns Formatted price string
 */
export const formatPrice = (price: number, currency: string = 'ر.س'): string => {
  return `${price.toLocaleString('ar-SA')} ${currency}`;
};

/**
 * Format area in square meters
 * @param area - Area value
 * @returns Formatted area string
 */
export const formatArea = (area: number): string => {
  return `${area.toLocaleString('ar-SA')} م²`;
};

/**
 * Check if property has valid coordinates
 * @param property - Property object
 * @returns True if coordinates are valid
 */
export const hasValidCoordinates = (property: any): boolean => {
  const lat = Number(property.lat);
  const lng = Number(property.lon);
  return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
};

/**
 * Get property display name
 * @param property - Property object
 * @returns Display name or default
 */
export const getPropertyDisplayName = (property: any): string => {
  return property.title || 'عقار';
};

/**
 * Get property location string
 * @param property - Property object
 * @returns Location string
 */
export const getPropertyLocation = (property: any): string => {
  const parts = [];
  if (property.district) parts.push(property.district);
  if (property.city) parts.push(property.city);
  return parts.join(', ') || 'موقع غير محدد';
};
