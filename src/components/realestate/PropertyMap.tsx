/**
 * PropertyMap Component
 * 
 * Displays an interactive Google Map with property markers and nearby facilities
 * Optimized for performance with large datasets using memoization and reduced animations
 * 
 * @module components/realestate/PropertyMap
 */

import { useEffect, useRef, useMemo, memo } from "react";
import { Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import { School, GraduationCap, Check, Heart } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Mosque SVG Icon Component (replacing img for better performance)
const MosqueIcon = memo(({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 2L10 5H14L12 2Z" />
    <path d="M6 7C6 5.9 6.9 5 8 5C9.1 5 10 5.9 10 7H6Z" />
    <path d="M14 7C14 5.9 14.9 5 16 5C17.1 5 18 5.9 18 7H14Z" />
    <path d="M4 9V22H20V9H4ZM11 20H9V14H11V20ZM15 20H13V14H15V20Z" />
  </svg>
));
MosqueIcon.displayName = "MosqueIcon";

interface PropertyMapProps {
  /** Properties to display as markers */
  properties: any[];
  /** Transaction type (sale or rent) */
  transactionType: "sale" | "rent";
  /** Set of visited property IDs */
  visitedProperties: Set<string>;
  /** List of favorite property IDs */
  favorites: string[];
  /** Whether search has been performed */
  hasSearched: boolean;
  /** Nearby schools based on filters */
  nearbySchools: any[];
  /** Nearby universities based on filters */
  nearbyUniversities: any[];
  /** Nearby mosques from backend */
  nearbyMosquesFromBackend: any[];
  /** Nearby mosques from manual filters */
  nearbyMosques: any[];
  /** Default map center coordinates */
  defaultCenter: { lat: number; lng: number };
  /** Default map zoom level */
  defaultZoom: number;
  /** Current language (ar or en) */
  language: string;
  /** Callback when property marker is clicked */
  onPropertyClick: (property: any) => void;
  /** Callback when map finishes loading */
  onMapLoad: () => void;
  /** Translation function */
  t: (key: string) => string;
}

// Memoized Property Marker Component
const PropertyMarker = memo(({
  property,
  transactionType,
  isVisited,
  isFavorite,
  onPropertyClick,
}: {
  property: any;
  transactionType: "sale" | "rent";
  isVisited: boolean;
  isFavorite: boolean;
  onPropertyClick: (property: any) => void;
}) => {
  const lat = Number(property.lat);
  const lon = Number(property.lon);
  
  if (isNaN(lat) || isNaN(lon) || (lat === 0 && lon === 0)) return null;

  return (
    <AdvancedMarker
      position={{ lat, lng: lon }}
      onClick={() => onPropertyClick(property)}
      zIndex={100}
    >
      <div className="relative group cursor-pointer">
        <div
          className={cn(
            "transition-transform duration-200",
            isVisited ? "scale-75 opacity-70" : "group-hover:scale-110"
          )}
        >
          <Pin
            background={
              isVisited
                ? "hsl(215 16% 47%)"
                : transactionType === "sale"
                  ? "hsl(var(--primary))"
                  : "hsl(142 76% 36%)"
            }
            borderColor={
              isVisited
                ? "hsl(215 20% 35%)"
                : transactionType === "sale"
                  ? "hsl(var(--primary))"
                  : "hsl(142 80% 25%)"
            }
            glyphColor="hsl(var(--primary-foreground))"
          />
        </div>
        {isVisited && (
          <div
            className="absolute -top-1 -right-1 rounded-full p-0.5 shadow-lg border-2"
            style={{
              backgroundColor: "hsl(221 83% 53%)",
              borderColor: "hsl(var(--background))",
            }}
          >
            <Check
              className="h-3 w-3"
              style={{ color: "hsl(var(--primary-foreground))" }}
            />
          </div>
        )}
        {isFavorite && (
          <div className="absolute -top-2 -left-2">
            <Heart
              className="h-4 w-4 drop-shadow-lg"
              style={{ fill: "hsl(0 84% 60%)", color: "hsl(0 84% 60%)" }}
            />
          </div>
        )}
      </div>
    </AdvancedMarker>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for optimization
  return (
    prevProps.property.id === nextProps.property.id &&
    prevProps.transactionType === nextProps.transactionType &&
    prevProps.isVisited === nextProps.isVisited &&
    prevProps.isFavorite === nextProps.isFavorite
  );
});
PropertyMarker.displayName = "PropertyMarker";

// Memoized School Marker Component
const SchoolMarker = memo(({
  school,
  language,
  t,
}: {
  school: any;
  language: string;
  t: (key: string) => string;
}) => (
  <AdvancedMarker
    position={{ lat: school.lat, lng: school.lon }}
    zIndex={50}
  >
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="relative group cursor-pointer transition-transform duration-200 hover:scale-110">
          <div
            className="p-2 rounded-full shadow-lg"
            style={{ backgroundColor: "hsl(84 81% 44%)" }}
          >
            <School className="h-5 w-5" style={{ color: "hsl(var(--primary-foreground))" }} />
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-medium">{school.name}</p>
        {school.travelTime !== undefined && (
          <p className="text-xs text-muted-foreground">
            {t("maxTravelTime")}: {school.travelTime} {t("minutes")}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  </AdvancedMarker>
));
SchoolMarker.displayName = "SchoolMarker";

// Memoized University Marker Component
const UniversityMarker = memo(({
  university,
  language,
  t,
}: {
  university: any;
  language: string;
  t: (key: string) => string;
}) => (
  <AdvancedMarker
    position={{ lat: university.lat, lng: university.lon }}
    zIndex={50}
  >
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="relative group cursor-pointer transition-transform duration-200 hover:scale-110">
          <div
            className="p-2 rounded-full shadow-lg"
            style={{ backgroundColor: "hsl(173 80% 40%)" }}
          >
            <GraduationCap className="h-5 w-5" style={{ color: "hsl(var(--primary-foreground))" }} />
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-medium">{language === "ar" ? university.name_ar : university.name_en}</p>
        {university.drive_minutes !== undefined && (
          <p className="text-xs text-muted-foreground">
            {t("drivingTime") || "وقت القيادة"}: {Math.round(university.drive_minutes)}{" "}
            {t("minutes") || "دقيقة"}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  </AdvancedMarker>
));
UniversityMarker.displayName = "UniversityMarker";

// Memoized Mosque Marker Component
const MosqueMarker = memo(({
  mosque,
  language,
  t,
  fromBackend = false,
}: {
  mosque: any;
  language: string;
  t: (key: string) => string;
  fromBackend?: boolean;
}) => (
  <AdvancedMarker
    position={{ lat: Number(mosque.lat), lng: Number(mosque.lon) }}
    zIndex={50}
  >
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="relative group cursor-pointer transition-transform duration-200 hover:scale-110">
          <div
            className="p-2 rounded-full shadow-lg border-2"
            style={{ backgroundColor: "hsl(142 76% 36%)", borderColor: "hsl(var(--background))" }}
          >
            <MosqueIcon className="h-5 w-5 text-primary-foreground" />
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-medium">{mosque.name}</p>
        {fromBackend && (mosque.walk_minutes !== undefined || mosque.drive_minutes !== undefined) && (
          <p className="text-xs text-muted-foreground">
            {mosque.walk_minutes
              ? `${t("walkingTime") || "وقت المشي"}: ${Math.round(mosque.walk_minutes)} ${t("minutes") || "دقيقة"}`
              : `${t("drivingTime") || "وقت القيادة"}: ${Math.round(mosque.drive_minutes)} ${t("minutes") || "دقيقة"}`}
          </p>
        )}
        {!fromBackend && mosque.travelTime !== undefined && (
          <p className="text-xs text-muted-foreground">
            {t("maxTravelTime")}: {mosque.travelTime} {t("minutes")}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  </AdvancedMarker>
));
MosqueMarker.displayName = "MosqueMarker";

/**
 * PropertyMap Component
 * 
 * Renders Google Map with all markers for properties and nearby facilities.
 * Optimized for performance with memoization and reduced animations.
 */
export const PropertyMap = ({
  properties,
  transactionType,
  visitedProperties,
  favorites,
  hasSearched,
  nearbySchools,
  nearbyUniversities,
  nearbyMosquesFromBackend,
  nearbyMosques,
  defaultCenter,
  defaultZoom,
  language,
  onPropertyClick,
  onMapLoad,
  t,
}: PropertyMapProps) => {
  const mapRef = useRef<google.maps.Map | null>(null);
  const hasFittedBounds = useRef(false);

  /**
   * Auto-fit map bounds to show all properties when they change
   * Runs only once after initial search or when properties significantly change
   */
  useEffect(() => {
    if (!mapRef.current || properties.length === 0 || !hasSearched) {
      hasFittedBounds.current = false;
      return;
    }
    
    // Only fit bounds if not already fitted for this search
    if (hasFittedBounds.current) return;
    
    const bounds = new google.maps.LatLngBounds();
    let validPointsCount = 0;
    
    properties.forEach((property) => {
      const lat = Number(property.lat);
      const lng = Number(property.lon);
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        bounds.extend({ lat, lng });
        validPointsCount++;
      }
    });
    
    if (!bounds.isEmpty() && validPointsCount > 0) {
      mapRef.current.fitBounds(bounds);
      hasFittedBounds.current = true;
    }
  }, [properties.length, hasSearched]); // Only depend on length, not entire array

  // Memoize property markers
  const propertyMarkers = useMemo(() => {
    return properties.map((property) => (
      <PropertyMarker
        key={property.id}
        property={property}
        transactionType={transactionType}
        isVisited={visitedProperties.has(property.id)}
        isFavorite={favorites.includes(property.id)}
        onPropertyClick={onPropertyClick}
      />
    ));
  }, [properties, transactionType, visitedProperties, favorites, onPropertyClick]);

  // Memoize school markers
  const schoolMarkers = useMemo(() => {
    if (!hasSearched) return null;
    return nearbySchools.map((school) => (
      <SchoolMarker
        key={`school-${school.id}`}
        school={school}
        language={language}
        t={t}
      />
    ));
  }, [hasSearched, nearbySchools, language, t]);

  // Memoize university markers
  const universityMarkers = useMemo(() => {
    if (!hasSearched) return null;
    return nearbyUniversities.map((university) => (
      <UniversityMarker
        key={`university-${university.name_ar || university.name_en}`}
        university={university}
        language={language}
        t={t}
      />
    ));
  }, [hasSearched, nearbyUniversities, language, t]);

  // Memoize mosque markers from backend
  const mosqueBackendMarkers = useMemo(() => {
    if (!hasSearched) return null;
    return nearbyMosquesFromBackend.map((mosque, index) => (
      <MosqueMarker
        key={`mosque-backend-${index}`}
        mosque={mosque}
        language={language}
        t={t}
        fromBackend={true}
      />
    ));
  }, [hasSearched, nearbyMosquesFromBackend, language, t]);

  // Memoize standard mosque markers
  const mosqueMarkers = useMemo(() => {
    if (!hasSearched) return null;
    return nearbyMosques.map((mosque) => (
      <MosqueMarker
        key={`mosque-${mosque.id}`}
        mosque={mosque}
        language={language}
        t={t}
        fromBackend={false}
      />
    ));
  }, [hasSearched, nearbyMosques, language, t]);

  return (
    <Map
      defaultCenter={defaultCenter}
      defaultZoom={defaultZoom}
      mapId="real-estate-map"
      gestureHandling="greedy"
      disableDefaultUI={false}
      onCameraChanged={(ev) => {
        if (ev.map && !mapRef.current) {
          mapRef.current = ev.map;
          onMapLoad();
        }
      }}
    >
      {propertyMarkers}
      {schoolMarkers}
      {universityMarkers}
      {mosqueBackendMarkers}
      {mosqueMarkers}
    </Map>
  );
};
