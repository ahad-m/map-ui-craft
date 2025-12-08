import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bed, Bath, Maximize, MapPin, Heart, ExternalLink, Home, School, GraduationCap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PropertyDetailsDialogProps {
  property: any;
  isOpen: boolean;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  selectedSchool?: { name: string; lat: number; lon: number } | null;
  selectedUniversity?: { name: string; lat: number; lon: number } | null;
}

export const PropertyDetailsDialog = ({
  property,
  isOpen,
  onClose,
  isFavorite,
  onToggleFavorite,
  selectedSchool,
  selectedUniversity,
}: PropertyDetailsDialogProps) => {
  const { t } = useTranslation();

  if (!property) return null;

  // Calculate distance using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Calculate estimated travel time (assuming average city speed of 30 km/h)
  const calculateTravelTime = (distanceKm: number): number => {
    const avgSpeed = 30; // km/h in city traffic
    return Math.round((distanceKm / avgSpeed) * 60); // Convert to minutes
  };

  // Calculate school distance and travel time if available
  const schoolDistance = selectedSchool && property.final_lat && property.final_lon
    ? calculateDistance(selectedSchool.lat, selectedSchool.lon, Number(property.final_lat), Number(property.final_lon))
    : null;
  const schoolTravelTime = schoolDistance !== null ? calculateTravelTime(schoolDistance) : null;

  // Calculate university distance and travel time if available
  const universityDistance = selectedUniversity && property.final_lat && property.final_lon
    ? calculateDistance(selectedUniversity.lat, selectedUniversity.lon, Number(property.final_lat), Number(property.final_lon))
    : null;
  const universityTravelTime = universityDistance !== null ? calculateTravelTime(universityDistance) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl lg:text-2xl flex items-center justify-between gap-2">
            <span className="line-clamp-2 flex-1">{property.title}</span>
            <Button
              variant={isFavorite ? "default" : "outline"}
              size="icon"
              onClick={onToggleFavorite}
              className={`flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 ${isFavorite ? "bg-red-500 hover:bg-red-600" : ""}`}
            >
              <Heart className={`h-4 w-4 sm:h-5 sm:w-5 ${isFavorite ? "fill-white" : ""}`} />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Property Image */}
          {property.image_url && (
            <div className="relative w-full h-40 sm:h-52 md:h-64 rounded-lg overflow-hidden">
              <img
                src={property.image_url}
                alt={property.title}
                className="w-full h-full object-cover"
              />
              <Badge className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-primary text-primary-foreground text-xs sm:text-sm">
                {property.purpose}
              </Badge>
            </div>
          )}

          {/* Price and Location */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary">
                  {property.price_num} {property.price_currency}
                </p>
                {property.price_period && (
                  <p className="text-sm sm:text-base text-muted-foreground">/ {property.price_period}</p>
                )}
              </div>
              <Badge variant="outline" className="text-sm sm:text-lg px-3 py-1 sm:px-4 sm:py-2 w-fit">
                {property.property_type}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2 text-muted-foreground text-sm sm:text-base">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{property.district}, {property.city}</span>
            </div>
          </div>

          {/* Property Features */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            {property.rooms && (
              <div className="flex flex-col items-center p-2 sm:p-4 bg-secondary/20 rounded-lg">
                <Bed className="h-5 w-5 sm:h-6 sm:w-6 mb-1 sm:mb-2 text-primary" />
                <span className="text-xs sm:text-sm text-muted-foreground">{t('bedrooms')}</span>
                <span className="text-lg sm:text-xl font-bold">{property.rooms}</span>
              </div>
            )}
            {property.baths && (
              <div className="flex flex-col items-center p-2 sm:p-4 bg-secondary/20 rounded-lg">
                <Bath className="h-5 w-5 sm:h-6 sm:w-6 mb-1 sm:mb-2 text-primary" />
                <span className="text-xs sm:text-sm text-muted-foreground">{t('bathrooms')}</span>
                <span className="text-lg sm:text-xl font-bold">{property.baths}</span>
              </div>
            )}
            {property.halls && (
              <div className="flex flex-col items-center p-2 sm:p-4 bg-secondary/20 rounded-lg">
                <Home className="h-5 w-5 sm:h-6 sm:w-6 mb-1 sm:mb-2 text-primary" />
                <span className="text-xs sm:text-sm text-muted-foreground">{t('livingRooms')}</span>
                <span className="text-lg sm:text-xl font-bold">{property.halls}</span>
              </div>
            )}
            {property.area_m2 && (
              <div className="flex flex-col items-center p-2 sm:p-4 bg-secondary/20 rounded-lg">
                <Maximize className="h-5 w-5 sm:h-6 sm:w-6 mb-1 sm:mb-2 text-primary" />
                <span className="text-xs sm:text-sm text-muted-foreground">{t('areaSize')}</span>
                <span className="text-lg sm:text-xl font-bold">{property.area_m2} m²</span>
              </div>
            )}
          </div>

          {/* Proximity Information */}
          <div className="space-y-2 sm:space-y-3">
            {/* Metro Time */}
            {property.time_to_metro_min && (
              <div className="p-3 sm:p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                  <span className="text-blue-600 font-medium text-sm sm:text-base">
                    {Math.round(parseFloat(property.time_to_metro_min))} {t('minToMetro')}
                  </span>
                </div>
              </div>
            )}

            {/* School Travel Time */}
            {schoolTravelTime !== null && selectedSchool && (
              <div className="p-3 sm:p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div className="flex items-center gap-2">
                  <School className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                  <span className="text-blue-600 font-medium text-sm sm:text-base truncate">
                    {schoolTravelTime} {t('minToSchool')}: {selectedSchool.name}
                  </span>
                </div>
              </div>
            )}

            {/* University Travel Time */}
            {universityTravelTime !== null && selectedUniversity && (
              <div className="p-3 sm:p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 flex-shrink-0" />
                  <span className="text-purple-600 font-medium text-sm sm:text-base truncate">
                    {universityTravelTime} {t('minToUniversity')}: {selectedUniversity.name}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {property.description && (
            <div className="space-y-2">
              <h3 className="font-semibold text-base sm:text-lg">{t('description')}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                {property.description}
              </p>
            </div>
          )}

          {/* Action Button */}
          {property.url && (
            <Button className="w-full h-10 sm:h-12" size="lg" asChild>
              <a href={property.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                <span className="text-sm sm:text-base">{t('viewDetails')}</span>
              </a>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
