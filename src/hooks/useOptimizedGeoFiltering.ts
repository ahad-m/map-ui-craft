/**
 * Optimized Geographic Filtering Hook
 * 
 * High-performance geo-filtering with memoization
 */

import { useMemo } from "react";
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
 * Calculates the center point of properties (memoized)
 */
export const usePropertiesCenter = (properties: any[]): Location | null => {
  return useMemo(() => {
    if (!properties || properties.length === 0) return null;

    const validProperties = properties.filter(
      (p) =>
        p.lat &&
        p.lon &&
        !isNaN(Number(p.lat)) &&
        !isNaN(Number(p.lon)) &&
        Number(p.lat) !== 0 &&
        Number(p.lon) !== 0
    );

    if (validProperties.length === 0) return null;

    const sumLat = validProperties.reduce((sum, p) => sum + Number(p.lat), 0);
    const sumLon = validProperties.reduce((sum, p) => sum + Number(p.lon), 0);

    return {
      lat: sumLat / validProperties.length,
      lon: sumLon / validProperties.length,
    };
  }, [properties]);
};

/**
 * Filters properties based on price, area, and metro (memoized)
 */
export const useFilteredProperties = (
  properties: any[],
  filters: PropertyFilters
): any[] => {
  return useMemo(() => {
    const safeProperties = properties || [];

    return safeProperties.filter((property) => {
      const priceValue = property.price_num;
      const price =
        typeof priceValue === "string"
          ? parseFloat(priceValue.replace(/,/g, ""))
          : Number(priceValue) || 0;

      const areaValue = property.area_m2;
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
  }, [properties, filters]);
};

/**
 * Filters schools by proximity (memoized)
 */
export const useNearbySchools = (
  schools: any[],
  centerLocation: Location | null,
  maxTravelTime: number,
  hasSearched: boolean,
  filterActive: boolean
): any[] => {
  return useMemo(() => {
    const safeSchools = schools || [];

    if (!hasSearched || !filterActive || safeSchools.length === 0) return [];

    const referenceLocation = centerLocation || { lat: 24.7136, lon: 46.6753 };

    return safeSchools
      .map((school) => {
        const distance = calculateDistance(
          referenceLocation.lat,
          referenceLocation.lon,
          school.lat,
          school.lon
        );
        const travelTime = calculateTravelTime(distance);
        return { ...school, travelTime };
      })
      .filter((school) => school.travelTime <= maxTravelTime);
  }, [schools, centerLocation, maxTravelTime, hasSearched, filterActive]);
};

/**
 * Filters universities by proximity and name (memoized)
 */
export const useNearbyUniversities = (
  universities: any[],
  centerLocation: Location | null,
  selectedUniversity: string,
  maxTravelTime: number,
  hasSearched: boolean,
  filterActive: boolean
): any[] => {
  return useMemo(() => {
    const safeUniversities = universities || [];

    if (!hasSearched || !filterActive || safeUniversities.length === 0) return [];

    const referenceLocation = centerLocation || { lat: 24.7136, lon: 46.6753 };

    const universitiesWithTime = safeUniversities.map((university) => {
      const distance = calculateDistance(
        referenceLocation.lat,
        referenceLocation.lon,
        university.lat,
        university.lon
      );
      const travelTime = calculateTravelTime(distance);
      return { ...university, travelTime };
    });

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

    return universitiesWithTime.filter(
      (university) => university.travelTime <= maxTravelTime
    );
  }, [universities, centerLocation, selectedUniversity, maxTravelTime, hasSearched, filterActive]);
};

/**
 * Filters mosques by proximity (memoized)
 */
export const useNearbyMosques = (
  mosques: any[],
  centerLocation: Location | null,
  maxTravelTime: number,
  hasSearched: boolean,
  filterActive: boolean
): any[] => {
  return useMemo(() => {
    const safeMosques = mosques || [];

    if (!hasSearched || !filterActive || safeMosques.length === 0) return [];

    const referenceLocation = centerLocation || { lat: 24.7136, lon: 46.6753 };

    return safeMosques
      .map((mosque) => {
        const distance = calculateDistance(
          referenceLocation.lat,
          referenceLocation.lon,
          mosque.lat,
          mosque.lon
        );
        const travelTime = calculateTravelTime(distance);
        return { ...mosque, travelTime };
      })
      .filter((mosque) => mosque.travelTime <= maxTravelTime);
  }, [mosques, centerLocation, maxTravelTime, hasSearched, filterActive]);
};

/**
 * Filters properties near schools (memoized)
 */
export const usePropertiesNearSchools = (
  properties: any[],
  nearbySchools: any[],
  maxSchoolTime: number
): any[] => {
  return useMemo(() => {
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
  }, [properties, nearbySchools, maxSchoolTime]);
};

/**
 * Filters properties near universities (memoized)
 */
export const usePropertiesNearUniversities = (
  properties: any[],
  nearbyUniversities: any[],
  maxUniversityTime: number
): any[] => {
  return useMemo(() => {
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
  }, [properties, nearbyUniversities, maxUniversityTime]);
};

/**
 * Filters properties near mosques (memoized)
 */
export const usePropertiesNearMosques = (
  properties: any[],
  nearbyMosques: any[],
  maxMosqueTime: number
): any[] => {
  return useMemo(() => {
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
  }, [properties, nearbyMosques, maxMosqueTime]);
};
