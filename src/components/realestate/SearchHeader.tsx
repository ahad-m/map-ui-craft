import { ArrowLeft, Languages, User, Heart, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import riyalEstateLogo from '@/assets/riyal-estate-logo.jpg';

interface SearchHeaderProps {
  onBack: () => void;
  onToggleLanguage: () => void;
  onToggleFilters: () => void;
  onToggleFavorites: () => void;
  onProfileClick: () => void;
  favoritesCount: number;
  isRTL: boolean;
}

/**
 * SearchHeader component
 * Top navigation bar for real estate search page
 */
export const SearchHeader = ({
  onBack,
  onToggleLanguage,
  onToggleFilters,
  onToggleFavorites,
  onProfileClick,
  favoritesCount,
  isRTL,
}: SearchHeaderProps) => {
  return (
    <div className="flex items-center justify-between p-4 bg-background/95 backdrop-blur-sm border-b">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
          <ArrowLeft className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
        </Button>
        <img
          src={riyalEstateLogo}
          alt="Riyal Estate"
          className="h-10 w-10 rounded-full object-cover ring-2 ring-primary/20"
        />
        <div>
          <h1 className="font-bold text-lg">Riyal Estate</h1>
          <p className="text-xs text-muted-foreground">البحث عن العقارات</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onToggleLanguage} className="rounded-full">
          <Languages className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onToggleFilters} className="rounded-full">
          <SlidersHorizontal className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleFavorites}
          className="rounded-full relative"
        >
          <Heart className="h-5 w-5" />
          {favoritesCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {favoritesCount}
            </span>
          )}
        </Button>
        <Button variant="ghost" size="icon" onClick={onProfileClick} className="rounded-full">
          <User className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};
