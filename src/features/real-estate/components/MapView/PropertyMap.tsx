/**
 * PropertyMap Component
 * 
 * SOLID Principles:
 * - Single Responsibility: Handles map rendering with all markers
 * - Dependency Inversion: Uses marker components through composition
 */

import { memo, useEffect } from 'react';
import { Map, useMap } from '@vis.gl/react-google-maps';
import { PropertyMarker } from './PropertyMarker';
import { SchoolMarker } from './SchoolMarker';
import { UniversityMarker } from './UniversityMarker';
import { MosqueMarker } from './MosqueMarker';
import type {
  Property,
  SchoolWithTravelTime,
  UniversityWithTravelTime,
  MosqueWithTravelTime,
  NearbyUniversity,
  NearbyMosque,
  NearbySchool,
  TransactionType,
  MapCenter,
} from '../../types';
import { RIYADH_CENTER } from '../../types';

// Component to save map reference - defined outside to avoid React hook errors
const MapRefHandler = ({
  mapRef,
}: {
  mapRef: React.MutableRefObject<google.maps.Map | null>;
}) => {
  const map = useMap();
  useEffect(() => {
    if (map) {
      mapRef.current = map;
    }
  }, [map, mapRef]);
  return null;
};

interface PropertyMapProps {
  properties: Property[];
  schools: SchoolWithTravelTime[];
  universities: UniversityWithTravelTime[];
  mosques: MosqueWithTravelTime[];
  backendUniversities: NearbyUniversity[];
  backendMosques: NearbyMosque[];
  backendSchools: NearbySchool[];  // ✅ جديد
  visitedProperties: Set<string>;
  favoriteIds: string[];
  transactionType: TransactionType;
  hasSearched: boolean;
  onPropertyClick: (property: Property) => void;
  mapRef: React.MutableRefObject<google.maps.Map | null>;
  mapCenter?: MapCenter;
  mapZoom?: number;
}

export const PropertyMap = memo(function PropertyMap({
  properties,
  schools,
  universities,
  mosques,
  backendUniversities,
  backendMosques,
  backendSchools,  // ✅ جديد
  visitedProperties,
  favoriteIds,
  transactionType,
  hasSearched,
  onPropertyClick,
  mapRef,
  mapCenter = RIYADH_CENTER,
  mapZoom = 12,
}: PropertyMapProps) {
  return (
    <div className="absolute inset-0">
      <Map
        defaultCenter={mapCenter}
        defaultZoom={mapZoom}
        mapId="real-estate-map"
        gestureHandling="greedy"
        disableDefaultUI={false}
      >
        <MapRefHandler mapRef={mapRef} />

        {/* Property Markers */}
        {properties.map((property) => (
          <PropertyMarker
            key={property.id}
            property={property}
            isVisited={visitedProperties.has(property.id)}
            isFavorite={favoriteIds.includes(property.id)}
            transactionType={transactionType}
            onClick={() => onPropertyClick(property)}
          />
        ))}

        {/* School Markers (from local calculation) */}
        {hasSearched &&
          schools.map((school) => (
            <SchoolMarker key={`school-${school.id}`} school={school} />
          ))}

        {/* ✅ School Markers (from backend) - جديد */}
        {hasSearched &&
          backendSchools.map((school, index) => (
            <SchoolMarker
              key={`school-backend-${index}`}
              school={{
                id: `backend-${index}`,
                name: school.name,
                lat: school.lat,
                lon: school.lon,
                gender: 'both',  // سيتم تحديده من البيانات لاحقاً
                primary_level: 'combined',
                travelTime: school.walk_minutes || school.drive_minutes || 0,
              }}
            />
          ))}

        {/* University Markers (from local calculation) */}
        {hasSearched &&
          universities.map((university) => (
            <UniversityMarker
              key={`university-${university.name_ar}`}
              university={university}
              isFromBackend={false}
            />
          ))}

        {/* University Markers (from backend) */}
        {hasSearched &&
          backendUniversities.map((university, index) => (
            <UniversityMarker
              key={`university-backend-${index}`}
              university={university}
              isFromBackend={true}
            />
          ))}

        {/* Mosque Markers (from backend) */}
        {hasSearched &&
          backendMosques.map((mosque, index) => (
            <MosqueMarker
              key={`mosque-backend-${index}`}
              mosque={mosque}
              isFromBackend={true}
            />
          ))}

        {/* Mosque Markers (from local calculation) */}
        {hasSearched &&
          mosques.map((mosque) => (
            <MosqueMarker
              key={`mosque-${mosque.id}`}
              mosque={mosque}
              isFromBackend={false}
            />
          ))}
      </Map>
    </div>
  );
});
