/**
 * Clustered Property Map Component
 * 
 * High-performance map with marker clustering
 * Loads properties based on visible viewport
 */

import { useEffect, useState, useRef, useCallback, memo } from "react";
import { Map, useMap, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import type { Marker } from "@googlemaps/markerclusterer";
import { Home, School, GraduationCap, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ClusteredPropertyMapProps {
  properties: any[];
  isLoading: boolean;
  onViewportChange: (bounds: { north: number; south: number; east: number; west: number }) => void;
  onPropertyClick: (property: any) => void;
  onMapReady: () => void;
  visitedProperties: Set<string>;
  favorites: string[];
  defaultCenter: { lat: number; lng: number };
  defaultZoom: number;
}

/**
 * Individual property marker component (memoized for performance)
 */
const PropertyMarker = memo(({ 
  property, 
  onClick, 
  isVisited, 
  isFavorite 
}: { 
  property: any; 
  onClick: () => void; 
  isVisited: boolean; 
  isFavorite: boolean;
}) => {
  const position = {
    lat: Number(property.final_lat || property.lat),
    lng: Number(property.final_lon || property.lon),
  };

  return (
    <AdvancedMarker
      position={position}
      onClick={onClick}
      title={property.title}
    >
      <div className={`relative ${isVisited ? 'scale-75' : ''}`}>
        <Pin
          background={
            isVisited 
              ? "#94a3b8" 
              : isFavorite 
              ? "#16a34a" 
              : "#22c55e"
          }
          glyphColor="#ffffff"
          borderColor={isVisited ? "#64748b" : "#15803d"}
          scale={1.3}
        />
        <div className="absolute -top-1 -right-1">
          <Home className="h-3 w-3 text-white" />
        </div>
        {isVisited && (
          <div className="absolute top-0 right-0 bg-blue-500 rounded-full p-0.5">
            <svg className="h-2 w-2 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
    </AdvancedMarker>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.property.id === nextProps.property.id &&
    prevProps.isVisited === nextProps.isVisited &&
    prevProps.isFavorite === nextProps.isFavorite
  );
});

PropertyMarker.displayName = "PropertyMarker";

/**
 * Loading skeleton for map
 */
const MapLoadingSkeleton = () => (
  <div className="absolute inset-0 bg-muted/20 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="space-y-4 text-center">
      <Skeleton className="h-12 w-12 rounded-full mx-auto" />
      <Skeleton className="h-4 w-32 mx-auto" />
      <Skeleton className="h-3 w-48 mx-auto" />
    </div>
  </div>
);

/**
 * Main clustered map component
 */
export const ClusteredPropertyMap = memo(({
  properties,
  isLoading,
  onViewportChange,
  onPropertyClick,
  onMapReady,
  visitedProperties,
  favorites,
  defaultCenter,
  defaultZoom,
}: ClusteredPropertyMapProps) => {
  const map = useMap();
  const [markers, setMarkers] = useState<{ [key: string]: Marker }>({});
  const clustererRef = useRef<MarkerClusterer | null>(null);

  // Initialize clusterer when map is ready
  useEffect(() => {
    if (!map) return;

    // Map is ready
    onMapReady();

    // Initialize clusterer with optimized settings
    clustererRef.current = new MarkerClusterer({
      map,
      markers: [],
      renderer: {
        render: ({ count, position }) => {
          return new google.maps.Marker({
            position,
            icon: {
              url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60">
                  <circle cx="30" cy="30" r="28" fill="#16a34a" opacity="0.9" stroke="#15803d" stroke-width="2"/>
                  <text x="30" y="38" font-size="20" font-weight="bold" fill="white" text-anchor="middle">${count}</text>
                </svg>
              `)}`,
              scaledSize: new google.maps.Size(60, 60),
            },
          });
        },
      },
    });

    return () => {
      clustererRef.current?.clearMarkers();
    };
  }, [map, onMapReady]);

  // Handle viewport changes
  useEffect(() => {
    if (!map) return;

    const boundsChangedListener = map.addListener("bounds_changed", () => {
      const bounds = map.getBounds();
      if (bounds) {
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        onViewportChange({
          north: ne.lat(),
          south: sw.lat(),
          east: ne.lng(),
          west: sw.lng(),
        });
      }
    });

    // Trigger initial viewport change
    const bounds = map.getBounds();
    if (bounds) {
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      onViewportChange({
        north: ne.lat(),
        south: sw.lat(),
        east: ne.lng(),
        west: sw.lng(),
      });
    }

    return () => {
      google.maps.event.removeListener(boundsChangedListener);
    };
  }, [map, onViewportChange]);

  // Update markers when properties change
  useEffect(() => {
    if (!clustererRef.current) return;

    // Clear old markers
    clustererRef.current.clearMarkers();

    // Create new markers
    const newMarkers = properties.map((property) => {
      const position = {
        lat: Number(property.final_lat || property.lat),
        lng: Number(property.final_lon || property.lon),
      };

      const marker = new google.maps.Marker({
        position,
        map: null, // Don't add to map yet, clusterer will handle it
      });

      marker.addListener("click", () => {
        onPropertyClick(property);
      });

      return marker;
    });

    // Add markers to clusterer
    clustererRef.current.addMarkers(newMarkers);
  }, [properties, onPropertyClick]);

  return (
    <>
      <Map
        defaultCenter={defaultCenter}
        defaultZoom={defaultZoom}
        mapId="real-estate-map"
        disableDefaultUI={false}
        gestureHandling="greedy"
        clickableIcons={false}
      />
      {isLoading && <MapLoadingSkeleton />}
    </>
  );
});

ClusteredPropertyMap.displayName = "ClusteredPropertyMap";
