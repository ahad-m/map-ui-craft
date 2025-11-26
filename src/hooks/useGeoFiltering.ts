/**
 * Geographic Filtering Hook
 * 
 * Custom hook for filtering properties, schools, universities, and mosques
 * based on geographic proximity and travel time calculations.
 */

import { calculateDistance, calculateTravelTime } from "@/utils/geolocationUtils";
import { arabicTextMatches } from "@/utils/arabicUtils";

interface Location {
  lat: number;
  lon: number;
}

interface PropertyFilters {
  minPrice: number;
  maxPrice: number;
  areaMin: number;
  areaMax: number;
  nearMetro: boolean;
  minMetroTime: number;
}

/**
 * Calculates the center point of an array of properties
 */
export const usePropertiesCenter = (properties: any[]) => {
  if (!properties || properties.length === 0) return null;

  const validProperties = properties.filter(
    (p) =>
      p.lat &&
      p.lon &&
      !isNaN(Number(p.lat)) &&
      !isNaN(Number(p.lon)) &&
      Number(p.lat) !== 0 &&
      Number(p.lon) !== 0,
  );

  if (validProperties.length === 0) return null;

  const sumLat = validProperties.reduce((sum, p) => sum + Number(p.lat), 0);
  const sumLon = validProperties.reduce((sum, p) => sum + Number(p.lon), 0);

  return {
    lat: sumLat / validProperties.length,
    lon: sumLon / validProperties.length,
  };
};

/**
 * Filters properties based on price, area, and metro proximity
 */
export const useFilteredProperties = (
  properties: any[],
  filters: PropertyFilters,
) => {
  const safeProperties = properties || [];

  return safeProperties.filter((property) => {
    const priceValue = property.price_num as any;
    const price =
      typeof priceValue === "string"
        ? parseFloat(priceValue.replace(/,/g, ""))
        : Number(priceValue) || 0;

    const areaValue = property.area_m2 as any;
    const area =
      typeof areaValue === "string"
        ? parseFloat(areaValue.replace(/,/g, ""))
        : Number(areaValue) || 0;

    // Price filter
    let priceMatch = true;
    if (filters.minPrice > 0 && filters.maxPrice > 0) {
      priceMatch = price >= filters.minPrice && price <= filters.maxPrice;
    } else if (filters.minPrice > 0) {
      priceMatch = price >= filters.minPrice;
    } else if (filters.maxPrice > 0) {
      priceMatch = price <= filters.maxPrice;
    }

    // Area filter
    let areaMatch = true;
    if (filters.areaMin > 0 && filters.areaMax > 0) {
      areaMatch = area >= filters.areaMin && area <= filters.areaMax;
    } else if (filters.areaMin > 0) {
      areaMatch = area >= filters.areaMin;
    } else if (filters.areaMax > 0) {
      areaMatch = area <= filters.areaMax;
    }

    // Metro filter
    let metroMatch = true;
    if (filters.nearMetro) {
      if (!property.time_to_metro_min) {
        metroMatch = false;
      } else {
        const metroTime =
          typeof property.time_to_metro_min === "string"
            ? parseFloat(property.time_to_metro_min)
            : Number(property.time_to_metro_min);
        metroMatch = !isNaN(metroTime) && metroTime <= filters.minMetroTime;
      }
    }

    return priceMatch && areaMatch && metroMatch;
  });
};

/**
 * Filters schools based on proximity and travel time
 */
export const useNearbySchools = (
  schools: any[],
  centerLocation: Location | null,
  maxTravelTime: number,
  hasSearched: boolean,
  filterActive: boolean,
) => {
  const safeSchools = schools || [];

  if (!hasSearched || !filterActive || safeSchools.length === 0) return [];

  const referenceLocation = centerLocation || { lat: 24.7136, lon: 46.6753 }; // Riyadh center

  return safeSchools
    .map((school) => {
      const distance = calculateDistance(
        referenceLocation.lat,
        referenceLocation.lon,
        school.lat,
        school.lon,
      );
      const travelTime = calculateTravelTime(distance);
      return { ...school, travelTime };
    })
    .filter((school) => school.travelTime <= maxTravelTime);
};

/**
 * Filters universities based on proximity, name, and travel time
 */
export const useNearbyUniversities = (
  universities: any[],
  centerLocation: Location | null,
  selectedUniversity: string,
  maxTravelTime: number,
  hasSearched: boolean,
  filterActive: boolean,
) => {
  const safeUniversities = universities || [];

  if (!hasSearched || !filterActive || safeUniversities.length === 0) return [];

  const referenceLocation = centerLocation || { lat: 24.7136, lon: 46.6753 }; // Riyadh center

  // Calculate travel time for all universities
  const universitiesWithTime = safeUniversities.map((university) => {
    const distance = calculateDistance(
      referenceLocation.lat,
      referenceLocation.lon,
      university.lat,
      university.lon,
    );
    const travelTime = calculateTravelTime(distance);
    return { ...university, travelTime };
  });

  // If a specific university is selected, filter by name
  if (selectedUniversity) {
    return universitiesWithTime.filter((university) => {
      const nameAr = university.name_ar || "";
      const nameEn = university.name_en || "";
      return (
        arabicTextMatches(selectedUniversity, nameAr) ||
        arabicTextMatches(selectedUniversity, nameEn)
      );
    });
  }

  // Otherwise, filter by travel time
  return universitiesWithTime.filter(
    (university) => university.travelTime <= maxTravelTime,
  );
};

/**
 * Filters mosques based on proximity and travel time
 */
export const useNearbyMosques = (
  mosques: any[],
  centerLocation: Location | null,
  maxTravelTime: number,
  hasSearched: boolean,
  filterActive: boolean,
) => {
  const safeMosques = mosques || [];

  if (!hasSearched || !filterActive || safeMosques.length === 0) return [];

  const referenceLocation = centerLocation || { lat: 24.7136, lon: 46.6753 }; // Riyadh center

  return safeMosques
    .map((mosque) => {
      const distance = calculateDistance(
        referenceLocation.lat,
        referenceLocation.lon,
        mosque.lat,
        mosque.lon,
      );
      const travelTime = calculateTravelTime(distance);
      return { ...mosque, travelTime };
    })
    .filter((mosque) => mosque.travelTime <= maxTravelTime);
};


/**
 * Filters properties based on nearby schools
 */
export const usePropertiesNearSchools = (
  properties: any[],
  nearbySchools: any[],
  maxSchoolTime: number,
) => {
  const safeProperties = properties || [];
  const safeNearbySchools = nearbySchools || [];

  if (safeNearbySchools.length === 0) return safeProperties;

  return safeProperties.filter((property) => {
    const lat = Number(property.lat);
    const lon = Number(property.lon);

    if (isNaN(lat) || isNaN(lon) || (lat === 0 && lon === 0)) return false;

    return safeNearbySchools.some((school) => {
      const distance = calculateDistance(lat, lon, school.lat, school.lon);
      const travelTime = calculateTravelTime(distance);
      return travelTime <= maxSchoolTime;
    });
  });
};

/**
 * Filters properties based on nearby universities
 */
export const usePropertiesNearUniversities = (
  properties: any[],
  nearbyUniversities: any[],
  maxUniversityTime: number,
) => {
  const safeProperties = properties || [];
  const safeNearbyUniversities = nearbyUniversities || [];

  if (safeNearbyUniversities.length === 0) return safeProperties;

  return safeProperties.filter((property) => {
    const lat = Number(property.lat);
    const lon = Number(property.lon);

    if (isNaN(lat) || isNaN(lon) || (lat === 0 && lon === 0)) return false;

    return safeNearbyUniversities.some((uni) => {
      const distance = calculateDistance(lat, lon, uni.lat, uni.lon);
      const travelTime = calculateTravelTime(distance);
      return travelTime <= maxUniversityTime;
    });
  });
};

/**
 * Filters properties based on nearby mosques
 */
export const usePropertiesNearMosques = (
  properties: any[],
  nearbyMosques: any[],
  maxMosqueTime: number,
) => {
  const safeProperties = properties || [];
  const safeNearbyMosques = nearbyMosques || [];

  if (safeNearbyMosques.length === 0) return safeProperties;

  return safeProperties.filter((property) => {
    const lat = Number(property.lat);
    const lon = Number(property.lon);

    if (isNaN(lat) || isNaN(lon) || (lat === 0 && lon === 0)) return false;

    return safeNearbyMosques.some((mosque) => {
      const distance = calculateDistance(lat, lon, mosque.lat, mosque.lon);
      const travelTime = calculateTravelTime(distance);
      return travelTime <= maxMosqueTime;
    });
  });
};
