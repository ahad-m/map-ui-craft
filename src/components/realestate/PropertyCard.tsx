import { Heart, Bed, Bath, Maximize, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PropertyCardProps {
  property: any;
  isFavorite: boolean;
  isVisited: boolean;
  onToggleFavorite: (id: string) => void;
  onClick: () => void;
  isRTL: boolean;
}

/**
 * PropertyCard component
 * Displays property information in a card format
 */
export const PropertyCard = ({
  property,
  isFavorite,
  isVisited,
  onToggleFavorite,
  onClick,
  isRTL,
}: PropertyCardProps) => {
  // Parse numeric values safely
  const parseNumber = (value: any): number => {
    if (typeof value === 'string') {
      return parseFloat(value.replace(/,/g, '')) || 0;
    }
    return Number(value) || 0;
  };

  const price = parseNumber(property.price_num);
  const area = parseNumber(property.area_m2);

  return (
    <Card
      className={`overflow-hidden hover:shadow-lg transition-all cursor-pointer border-2 ${
        isVisited ? 'border-primary/30 bg-accent/5' : 'border-transparent'
      }`}
      onClick={onClick}
    >
      {/* Property Image */}
      <div className="relative h-48 bg-muted">
        {property.image_url ? (
          <img
            src={property.image_url}
            alt={property.title || 'Property'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <MapPin className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        
        {/* Favorite button */}
        <Button
          size="icon"
          variant="secondary"
          className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} rounded-full`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(property.id);
          }}
        >
          <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
        </Button>
      </div>

      {/* Property Details */}
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-lg line-clamp-1">{property.title || 'عقار'}</h3>
        
        <p className="text-sm text-muted-foreground line-clamp-1">
          {property.district}, {property.city}
        </p>
        
        <p className="text-xl font-bold text-primary">
          {price.toLocaleString('ar-SA')} {property.price_currency || 'ر.س'}
          {property.price_period && (
            <span className="text-sm text-muted-foreground">/{property.price_period}</span>
          )}
        </p>

        {/* Property Features */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {property.rooms && (
            <div className="flex items-center gap-1">
              <Bed className="h-4 w-4" />
              <span>{property.rooms}</span>
            </div>
          )}
          {property.baths && (
            <div className="flex items-center gap-1">
              <Bath className="h-4 w-4" />
              <span>{property.baths}</span>
            </div>
          )}
          {area > 0 && (
            <div className="flex items-center gap-1">
              <Maximize className="h-4 w-4" />
              <span>{area.toLocaleString('ar-SA')} م²</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
