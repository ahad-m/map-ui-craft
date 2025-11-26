import { Heart, Bed, Bath, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface FavoritesSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  displayedFavorites: any[];
  onPropertyClick: (property: any) => void;
  onToggleFavorite: (propertyId: string) => void;
  t: (key: string) => string;
  language: string;
}

export const FavoritesSheet = ({
  isOpen,
  onOpenChange,
  displayedFavorites,
  onPropertyClick,
  onToggleFavorite,
  t,
  language,
}: FavoritesSheetProps) => {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent 
        side={language === "ar" ? "left" : "right"} 
        className="w-full sm:max-w-lg overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500 fill-red-500" />
            {t("favorites")} ({displayedFavorites.length})
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {displayedFavorites.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4 animate-pulse" />
              <p className="text-muted-foreground font-medium">{t("noFavorites")}</p>
            </div>
          ) : (
            displayedFavorites.map((property, index) => (
              <Card
                key={property.id}
                className="p-4 cursor-pointer hover-lift glass-effect animate-slide-up card-shine shadow-card hover:shadow-elevated transition-all duration-300"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => {
                  onPropertyClick(property);
                  onOpenChange(false);
                }}
              >
                <div className="flex gap-3">
                  {property.image_url && (
                    <img
                      src={property.image_url}
                      alt={property.title}
                      className="w-28 h-28 object-cover rounded-xl ring-2 ring-primary/10 transition-all duration-300 hover:ring-primary/30"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-sm line-clamp-2">{property.title}</h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 flex-shrink-0 hover:bg-red-50 rounded-full transition-all duration-300 hover:scale-110"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(property.id);
                        }}
                      >
                        <Heart className="h-4 w-4 fill-red-500 text-red-500 animate-pulse" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3 font-medium">
                      {property.district}, {property.city}
                    </p>
                    <div className="flex items-center gap-2 text-xs mb-3 flex-wrap">
                      {property.rooms && (
                        <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                          <Bed className="h-4 w-4 text-primary" />
                          <span className="font-semibold">{property.rooms}</span>
                        </span>
                      )}
                      {property.baths && (
                        <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                          <Bath className="h-4 w-4 text-primary" />
                          <span className="font-semibold">{property.baths}</span>
                        </span>
                      )}
                      {property.area_m2 && (
                        <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                          <Maximize className="h-4 w-4 text-primary" />
                          <span className="font-semibold">{property.area_m2} m²</span>
                        </span>
                      )}
                    </div>
                    <div className="pt-3 border-t border-border/50">
                      <p className="gradient-text font-extrabold text-xl">
                        {property.price_num} {property.price_currency}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
