/**
 * useProximityCalculations Hook
 * 

 */

import { useMemo } from 'react';
import type {
  Property,
  PropertyFilters,
  School,
  SchoolWithTravelTime,
  University,
  UniversityWithTravelTime,
  Mosque,
  MosqueWithTravelTime,
  GeoLocation,
  SearchCriteria,
} from '../types';
import { RIYADH_CENTER } from '../types';
import {
  calculateDistance,
  calculateTravelTime,
  calculateCenterPoint,
  isValidCoordinates,
} from '../utils/distanceCalculations';
import { arabicTextMatches } from '@/utils/arabicUtils';

interface UseProximityCalculationsProps {
  properties: Property[];
  schools: School[];
  universities: University[];
  mosques: Mosque[];
  appliedFilters: PropertyFilters;
  hasSearched: boolean;
  currentCriteria?: SearchCriteria;
}

interface UseProximityCalculationsReturn {
  propertiesCenterLocation: GeoLocation | null;
  nearbySchools: SchoolWithTravelTime[];
  nearbyUniversities: UniversityWithTravelTime[];
  nearbyMosques: MosqueWithTravelTime[];
  displayedProperties: Property[];
}

export function useProximityCalculations({
  properties,
  schools,
  universities,
  mosques,
  appliedFilters,
  hasSearched,
  currentCriteria,
}: UseProximityCalculationsProps): UseProximityCalculationsReturn {
  
  /**
   * Calculate center location of properties
   */
  const propertiesCenterLocation = useMemo(() => {
    if (properties.length === 0) return null;
    
    const validProperties = properties.filter(
      (p) => isValidCoordinates(Number(p.lat), Number(p.lon))
    );
    
    if (validProperties.length === 0) return null;
    
    return calculateCenterPoint(
      validProperties.map((p) => ({
        lat: Number(p.lat),
        lon: Number(p.lon),
      }))
    );
  }, [properties]);

  /**
   * Get reference location (property center or Riyadh center as fallback)
   */
  const referenceLocation = useMemo((): GeoLocation => {
    return propertiesCenterLocation || { lat: RIYADH_CENTER.lat, lon: RIYADH_CENTER.lng };
  }, [propertiesCenterLocation]);

  /**
   * Calculate nearby schools
   */
  const nearbySchools = useMemo((): SchoolWithTravelTime[] => {
    if (!hasSearched) return [];
    
    const requestedFromChatbot = currentCriteria?.school_requirements?.required;
    const requestedFromFilters = appliedFilters.schoolGender || appliedFilters.schoolLevel;
    
    if (!requestedFromChatbot && !requestedFromFilters) return [];
    if (schools.length === 0) return [];
    
    return schools
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
      .filter((school) => school.travelTime <= appliedFilters.maxSchoolTime);
  }, [
    schools,
    referenceLocation,
    appliedFilters.maxSchoolTime,
    appliedFilters.schoolGender,
    appliedFilters.schoolLevel,
    hasSearched,
    currentCriteria,
  ]);

  /**
   * Calculate nearby universities
   */
  const nearbyUniversities = useMemo((): UniversityWithTravelTime[] => {
    if (!hasSearched) return [];
    
    const hasSelectedUniversity = !!appliedFilters.selectedUniversity;
    const timeFilterChanged = appliedFilters.maxUniversityTime < 30;
    const requestedFromChatbot = !!currentCriteria?.university_requirements;
    
    const universityFilterActive = hasSelectedUniversity || timeFilterChanged || requestedFromChatbot;
    
    if (!universityFilterActive || universities.length === 0) return [];
    
    // When specific university is selected, filter by name
    if (hasSelectedUniversity) {
      const searchTerm = appliedFilters.selectedUniversity;
      
      return universities
        .map((university) => {
          const distance = calculateDistance(
            referenceLocation.lat,
            referenceLocation.lon,
            university.lat,
            university.lon
          );
          const travelTime = calculateTravelTime(distance);
          return { ...university, travelTime };
        })
        .filter((university) => {
          const nameAr = university.name_ar || '';
          const nameEn = university.name_en || '';
          return arabicTextMatches(searchTerm, nameAr) || arabicTextMatches(searchTerm, nameEn);
        });
    }
    
    // No specific university: filter by time
    return universities
      .map((university) => {
        const distance = calculateDistance(
          referenceLocation.lat,
          referenceLocation.lon,
          university.lat,
          university.lon
        );
        const travelTime = calculateTravelTime(distance);
        return { ...university, travelTime };
      })
      .filter((university) => university.travelTime <= appliedFilters.maxUniversityTime);
  }, [
    universities,
    referenceLocation,
    appliedFilters.maxUniversityTime,
    appliedFilters.selectedUniversity,
    hasSearched,
    currentCriteria,
  ]);

  /**
   * Calculate nearby mosques
   */
  const nearbyMosques = useMemo((): MosqueWithTravelTime[] => {
    if (!hasSearched || !appliedFilters.nearMosques || mosques.length === 0) return [];
    
    return mosques
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
      .filter((mosque) => mosque.travelTime <= appliedFilters.maxMosqueTime);
  }, [
    mosques,
    referenceLocation,
    appliedFilters.maxMosqueTime,
    appliedFilters.nearMosques,
    hasSearched,
  ]);

  /**
   * Filter properties by proximity to nearby places
   */
  const displayedProperties = useMemo(() => {
    let filtered = [...properties];
    
    // Filter by schools
    if (
      hasSearched &&
      (appliedFilters.schoolGender || appliedFilters.schoolLevel) &&
      nearbySchools.length > 0
    ) {
      filtered = filtered.filter((property) => {
        const lat = Number(property.lat);
        const lon = Number(property.lon);
        if (!isValidCoordinates(lat, lon)) return false;
        
        return nearbySchools.some((school) => {
          const distance = calculateDistance(lat, lon, school.lat, school.lon);
          const travelTime = calculateTravelTime(distance);
          return travelTime <= appliedFilters.maxSchoolTime;
        });
      });
    }
    
    // Filter by universities
    const universityFilterActive =
      appliedFilters.selectedUniversity || appliedFilters.maxUniversityTime < 30;
    
    if (universityFilterActive && nearbyUniversities.length > 0) {
      filtered = filtered.filter((property) => {
        const lat = Number(property.lat);
        const lon = Number(property.lon);
        if (!isValidCoordinates(lat, lon)) return false;
        
        return nearbyUniversities.some((uni) => {
          const distance = calculateDistance(lat, lon, uni.lat, uni.lon);
          const travelTime = calculateTravelTime(distance);
          return travelTime <= appliedFilters.maxUniversityTime;
        });
      });
    }
    
    // Filter by mosques
    if (appliedFilters.nearMosques && nearbyMosques.length > 0) {
      filtered = filtered.filter((property) => {
        const lat = Number(property.lat);
        const lon = Number(property.lon);
        if (!isValidCoordinates(lat, lon)) return false;
        
        return nearbyMosques.some((mosque) => {
          const distance = calculateDistance(lat, lon, mosque.lat, mosque.lon);
          const travelTime = calculateTravelTime(distance);
          return travelTime <= appliedFilters.maxMosqueTime;
        });
      });
    }
    
    return filtered;
  }, [
    properties,
    hasSearched,
    appliedFilters,
    nearbySchools,
    nearbyUniversities,
    nearbyMosques,
  ]);

  return {
    propertiesCenterLocation,
    nearbySchools,
    nearbyUniversities,
    nearbyMosques,
    displayedProperties,
  };
}
