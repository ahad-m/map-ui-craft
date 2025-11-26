/**
 * PropertyMap Component
 * 
 * Displays an interactive Google Map with property markers and nearby facilities
 * Includes markers for properties, schools, universities, and mosques
 * 
 * @module components/realestate/PropertyMap
 */

import { useEffect, useRef } from "react";
import { Map, AdvancedMarker, Pin, useMap } from "@vis.gl/react-google-maps";
import { School, GraduationCap, Check, Heart } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import mosqueIcon from "@/assets/mosque-icon.png";

/**
 * Component to capture map reference
 * Must be inside Map component to access map instance
 */
const MapRefHandler = ({ mapRef }: { mapRef: React.MutableRefObject<google.maps.Map | null> }) => {
  const map = useMap();
  useEffect(() => {
    if (map) {
      mapRef.current = map;
    }
  }, [map, mapRef]);
  return null;
};

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
  /** Translation function */
  t: (key: string) => string;
}

/**
 * PropertyMap Component
 * 
 * Renders Google Map with all markers for properties and nearby facilities.
 * Automatically adjusts bounds to fit all displayed properties.
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
  t,
}: PropertyMapProps) => {
  const mapRef = useRef<google.maps.Map | null>(null);

  /**
   * Auto-fit map bounds to show all properties when they change
   */
  useEffect(() => {
    if (!mapRef.current || properties.length === 0 || !hasSearched) return;
    
    const bounds = new google.maps.LatLngBounds();
    properties.forEach((property) => {
      const lat = Number(property.lat);
      const lng = Number(property.lon);
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        bounds.extend({ lat, lng });
      }
    });
    
    if (!bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds);
    }
  }, [properties, hasSearched]);

  return (
    <Map
      defaultCenter={defaultCenter}
      defaultZoom={defaultZoom}
      mapId="real-estate-map"
      gestureHandling="greedy"
      disableDefaultUI={false}
    >
      <MapRefHandler mapRef={mapRef} />
      
      {/* Property Markers */}
      {properties.map((property) => {
        const lat = Number(property.lat);
        const lon = Number(property.lon);
        if (isNaN(lat) || isNaN(lon) || (lat === 0 && lon === 0)) return null;
        
        const isVisited = visitedProperties.has(property.id);
        const isFavorite = favorites.includes(property.id);

        return (
          <AdvancedMarker
            key={property.id}
            position={{ lat, lng: lon }}
            onClick={() => onPropertyClick(property)}
            zIndex={100}
          >
            <div className="relative group cursor-pointer">
              <div className={cn(
                "transition-all duration-500",
                isVisited ? "scale-75 opacity-70" : "group-hover:scale-125 group-hover:-translate-y-2"
              )}>
                <Pin
                  background={isVisited ? "hsl(215 16% 47%)" : (transactionType === "sale" ? "hsl(var(--primary))" : "hsl(142 76% 36%)")}
                  borderColor={isVisited ? "hsl(215 20% 35%)" : (transactionType === "sale" ? "hsl(var(--primary))" : "hsl(142 80% 25%)")}
                  glyphColor="hsl(var(--primary-foreground))"
                />
              </div>
              {!isVisited && (
                <div
                  className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-0 group-hover:opacity-100"
                  style={{ animationDuration: "1.5s" }}
                />
              )}
              {isVisited && (
                <div className="absolute -top-1 -right-1 rounded-full p-0.5 shadow-lg border-2" style={{ backgroundColor: "hsl(221 83% 53%)", borderColor: "hsl(var(--background))" }}>
                  <Check className="h-3 w-3" style={{ color: "hsl(var(--primary-foreground))" }} />
                </div>
              )}
              {isFavorite && (
                <div className="absolute -top-2 -left-2 animate-pulse-glow">
                  <Heart className="h-4 w-4 drop-shadow-lg" style={{ fill: "hsl(0 84% 60%)", color: "hsl(0 84% 60%)" }} />
                </div>
              )}
            </div>
          </AdvancedMarker>
        );
      })}

      {/* School Markers */}
      {hasSearched && nearbySchools.map((school) => (
        <AdvancedMarker 
          key={`school-${school.id}`} 
          position={{ lat: school.lat, lng: school.lon }} 
          zIndex={50}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative group cursor-pointer transition-all duration-300 hover:scale-125 hover:-translate-y-2">
                <div
                  className="p-2 rounded-full shadow-elevated"
                  style={{ backgroundColor: "hsl(84 81% 44%)" }}
                >
                  <School className="h-5 w-5" style={{ color: "hsl(var(--primary-foreground))" }} />
                </div>
                <div
                  className="absolute inset-0 rounded-full animate-ping opacity-0 group-hover:opacity-100"
                  style={{ backgroundColor: "hsl(84 81% 44% / 0.3)", animationDuration: "1.5s" }}
                />
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
      ))}

      {/* University Markers */}
      {hasSearched && nearbyUniversities.map((university) => (
        <AdvancedMarker
          key={`university-${university.name_ar || university.name_en}`}
          position={{ lat: university.lat, lng: university.lon }}
          zIndex={50}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative group cursor-pointer transition-all duration-300 hover:scale-125 hover:-translate-y-2">
                <div
                  className="p-2 rounded-full shadow-elevated"
                  style={{ backgroundColor: "hsl(173 80% 40%)" }}
                >
                  <GraduationCap className="h-5 w-5" style={{ color: "hsl(var(--primary-foreground))" }} />
                </div>
                <div
                  className="absolute inset-0 rounded-full animate-ping opacity-0 group-hover:opacity-100"
                  style={{ backgroundColor: "hsl(173 80% 40% / 0.3)", animationDuration: "1.5s" }}
                />
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
      ))}

      {/* Mosque Markers from Backend */}
      {hasSearched && nearbyMosquesFromBackend.map((mosque, index) => (
        <AdvancedMarker
          key={`mosque-backend-${index}`}
          position={{ lat: Number(mosque.lat), lng: Number(mosque.lon) }}
          zIndex={50}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative group cursor-pointer transition-all duration-300 hover:scale-125 hover:-translate-y-2">
                <div
                  className="p-2 rounded-full shadow-elevated border-2"
                  style={{ backgroundColor: "hsl(142 76% 36%)", borderColor: "hsl(var(--background))" }}
                >
                  <img src={mosqueIcon} alt="Mosque" className="h-5 w-5 invert" />
                </div>
                <div
                  className="absolute inset-0 rounded-full animate-ping opacity-0 group-hover:opacity-100"
                  style={{
                    backgroundColor: "hsl(142 76% 36% / 0.3)",
                    animationDuration: "1.5s",
                  }}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">{mosque.name}</p>
              {(mosque.walk_minutes !== undefined || mosque.drive_minutes !== undefined) && (
                <p className="text-xs text-muted-foreground">
                  {mosque.walk_minutes
                    ? `${t("walkingTime") || "وقت المشي"}: ${Math.round(mosque.walk_minutes)} ${t("minutes") || "دقيقة"}`
                    : `${t("drivingTime") || "وقت القيادة"}: ${Math.round(mosque.drive_minutes)} ${t("minutes") || "دقيقة"}`}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        </AdvancedMarker>
      ))}

      {/* Standard Mosque Markers (Manual Filters) */}
      {hasSearched && nearbyMosques.map((mosque) => (
        <AdvancedMarker 
          key={`mosque-${mosque.id}`} 
          position={{ lat: mosque.lat, lng: mosque.lon }} 
          zIndex={50}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative group cursor-pointer transition-all duration-300 hover:scale-125 hover:-translate-y-2">
                <div
                  className="p-2 rounded-full shadow-elevated border-2"
                  style={{ backgroundColor: "hsl(142 76% 36%)", borderColor: "hsl(var(--background))" }}
                >
                  <img src={mosqueIcon} alt="Mosque" className="h-5 w-5 invert" />
                </div>
                <div
                  className="absolute inset-0 rounded-full animate-ping opacity-0 group-hover:opacity-100"
                  style={{ backgroundColor: "hsl(142 76% 36% / 0.3)", animationDuration: "1.5s" }}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">{mosque.name}</p>
              {mosque.travelTime !== undefined && (
                <p className="text-xs text-muted-foreground">
                  {t("maxTravelTime")}: {mosque.travelTime} {t("minutes")}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        </AdvancedMarker>
      ))}
    </Map>
  );
};
