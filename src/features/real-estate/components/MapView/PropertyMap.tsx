/**
 * PropertyMap Component
 * * SOLID Principles:
 * - Single Responsibility: Handles map rendering with all markers
 * - Dependency Inversion: Uses marker components through composition
 */

import { memo, useEffect } from 'react';
import { Map, useMap } from '@vis.gl/react-google-maps';
import { PropertyMarker } from './PropertyMarker';
import { SchoolMarker } from './SchoolMarker';
import { UniversityMarker } from './UniversityMarker';
import { MosqueMarker } from './MosqueMarker';
// 1. استدعاء مكون الخريطة الحرارية
import { HeatmapLayer } from './HeatmapLayer';
// 2. استدعاء السياق والـ Hook
import { useHeatmap } from '../../context/HeatmapContext';
import { useMarketStats } from '../../hooks/useMarketStats';

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
  backendSchools: NearbySchool[];
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
  backendSchools,
  visitedProperties,
  favoriteIds,
  transactionType,
  hasSearched,
  onPropertyClick,
  mapRef,
  mapCenter = RIYADH_CENTER,
  mapZoom = 12,
}: PropertyMapProps) {
  
  // 3. الحصول على حالة الخريطة الحرارية
  const { isHeatmapVisible } = useHeatmap();
  
  // 4. جلب بيانات السوق لرسم الخريطة الحرارية
  const { data: marketStats } = useMarketStats(transactionType === 'sale' ? 'بيع' : 'إيجار');

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

        {/* 5. رسم طبقة الخريطة الحرارية */}
        <HeatmapLayer 
          key={transactionType}
          data={marketStats || []} 
          visible={isHeatmapVisible} 
        />

        {/* 6. رسم الدبابيس (Markers) فقط إذا كانت الخريطة الحرارية غير مفعلة 
            نستخدم الشرط (!isHeatmapVisible) لإخفائها
        */}

        {/* Property Markers */}
        {!isHeatmapVisible && properties.map((property) => (
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
        {!isHeatmapVisible && hasSearched &&
          schools.map((school) => (
            <SchoolMarker key={`school-${school.id}`} school={school} />
          ))}

        {/* School Markers (from backend) */}
        {!isHeatmapVisible && hasSearched &&
          backendSchools.map((school, index) => (
            <SchoolMarker
              key={`school-backend-${index}`}
              school={{
                id: `backend-${index}`,
                name: school.name,
                lat: school.lat,
                lon: school.lon,
                gender: 'both', 
                primary_level: 'combined',
                travelTime: school.walk_minutes || school.drive_minutes || 0,
              }}
            />
          ))}

        {/* University Markers (from local calculation) */}
        {!isHeatmapVisible && hasSearched &&
          universities.map((university) => (
            <UniversityMarker
              key={`university-${university.name_ar}`}
              university={university}
              isFromBackend={false}
            />
          ))}

        {/* University Markers (from backend) */}
        {!isHeatmapVisible && hasSearched &&
          backendUniversities.map((university, index) => (
            <UniversityMarker
              key={`university-backend-${index}`}
              university={university}
              isFromBackend={true}
            />
          ))}

        {/* Mosque Markers (from backend) */}
        {!isHeatmapVisible && hasSearched &&
          backendMosques.map((mosque, index) => (
            <MosqueMarker
              key={`mosque-backend-${index}`}
              mosque={mosque}
              isFromBackend={true}
            />
          ))}

        {/* Mosque Markers (from local calculation) */}
        {!isHeatmapVisible && hasSearched &&
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
