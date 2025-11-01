import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bed, Bath, Maximize, MapPin, Heart, ExternalLink, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PropertyDetailsDialogProps {
  property: any;
  isOpen: boolean;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export const PropertyDetailsDialog = ({
  property,
  isOpen,
  onClose,
  isFavorite,
  onToggleFavorite,
}: PropertyDetailsDialogProps) => {
  const { t } = useTranslation();

  if (!property) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center justify-between">
            <span>{property.title}</span>
            <Button
              variant={isFavorite ? "default" : "outline"}
              size="icon"
              onClick={onToggleFavorite}
              className={isFavorite ? "bg-red-500 hover:bg-red-600" : ""}
            >
              <Heart className={`h-5 w-5 ${isFavorite ? "fill-white" : ""}`} />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Property Image */}
          {property.image_url && (
            <div className="relative w-full h-64 rounded-lg overflow-hidden">
              <img
                src={property.image_url}
                alt={property.title}
                className="w-full h-full object-cover"
              />
              <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground">
                {property.purpose}
              </Badge>
            </div>
          )}

          {/* Price and Location */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-primary">
                  {property.price_num} {property.price_currency}
                </p>
                {property.price_period && (
                  <p className="text-muted-foreground">/ {property.price_period}</p>
                )}
              </div>
              <Badge variant="outline" className="text-lg px-4 py-2">
                {property.property_type}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{property.district}, {property.city}</span>
            </div>
          </div>

          {/* Property Features */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {property.rooms && (
              <div className="flex flex-col items-center p-4 bg-secondary/20 rounded-lg">
                <Bed className="h-6 w-6 mb-2 text-primary" />
                <span className="text-sm text-muted-foreground">{t('bedrooms')}</span>
                <span className="text-xl font-bold">{property.rooms}</span>
              </div>
            )}
            {property.baths && (
              <div className="flex flex-col items-center p-4 bg-secondary/20 rounded-lg">
                <Bath className="h-6 w-6 mb-2 text-primary" />
                <span className="text-sm text-muted-foreground">{t('bathrooms')}</span>
                <span className="text-xl font-bold">{property.baths}</span>
              </div>
            )}
            {property.halls && (
              <div className="flex flex-col items-center p-4 bg-secondary/20 rounded-lg">
                <Home className="h-6 w-6 mb-2 text-primary" />
                <span className="text-sm text-muted-foreground">{t('livingRooms')}</span>
                <span className="text-xl font-bold">{property.halls}</span>
              </div>
            )}
            {property.area_m2 && (
              <div className="flex flex-col items-center p-4 bg-secondary/20 rounded-lg">
                <Maximize className="h-6 w-6 mb-2 text-primary" />
                <span className="text-sm text-muted-foreground">{t('areaSize')}</span>
                <span className="text-xl font-bold">{property.area_m2} m²</span>
              </div>
            )}
          </div>

          {/* Metro Time */}
          {property.time_to_metro_min && (
            <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                <span className="text-blue-600 font-medium">
                  {Math.round(parseFloat(property.time_to_metro_min))} {t('minToMetro')}
                </span>
              </div>
            </div>
          )}

          {/* Description */}
          {property.description && (
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">{t('description')}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {property.description}
              </p>
            </div>
          )}

          {/* Action Button */}
          {property.url && (
            <Button className="w-full" size="lg" asChild>
              <a href={property.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-5 w-5 mr-2" />
                {t('viewDetails')}
              </a>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
