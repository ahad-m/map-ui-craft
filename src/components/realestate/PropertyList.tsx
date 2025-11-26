import { ScrollArea } from '@/components/ui/scroll-area';
import { PropertyCard } from './PropertyCard';

interface PropertyListProps {
  properties: any[];
  favorites: string[];
  visitedProperties: Set<string>;
  onPropertyClick: (property: any) => void;
  onToggleFavorite: (id: string) => void;
  isRTL: boolean;
  emptyMessage?: string;
}

/**
 * PropertyList component
 * Displays a scrollable list of property cards
 */
export const PropertyList = ({
  properties,
  favorites,
  visitedProperties,
  onPropertyClick,
  onToggleFavorite,
  isRTL,
  emptyMessage = 'لا توجد عقارات',
}: PropertyListProps) => {
  if (properties.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="grid gap-4 p-4">
        {properties.map((property) => (
          <PropertyCard
            key={property.id}
            property={property}
            isFavorite={favorites.includes(property.id)}
            isVisited={visitedProperties.has(property.id)}
            onToggleFavorite={onToggleFavorite}
            onClick={() => onPropertyClick(property)}
            isRTL={isRTL}
          />
        ))}
      </div>
    </ScrollArea>
  );
};
