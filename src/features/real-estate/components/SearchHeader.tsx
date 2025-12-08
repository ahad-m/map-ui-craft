/**
 * SearchHeader Component (Updated)
 * 
 * Now includes the BestValueSheet button (star icon) next to MarketInsightsSheet
 * 
 * SOLID Principles:
 * - Single Responsibility: Only handles the top search bar UI
 * - Interface Segregation: Props are minimal and focused
 */

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  SlidersHorizontal,
  ArrowLeft,
  Heart,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import riyalEstateLogo from '@/assets/riyal-estate-logo.jpg';
import type { TransactionType } from '../types';
import { MarketInsightsSheet } from './MarketInsightsSheet';
import { BestValueSheet } from './BestValueSheet'; // ✅ New import

interface SearchHeaderProps {
  transactionType: TransactionType;
  onTransactionTypeChange: (type: TransactionType) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onSearch: () => void;
  onToggleFilters: () => void;
  onToggleFavorites: () => void;
  favoritesCount: number;
}

export const SearchHeader = memo(function SearchHeader({
  transactionType,
  onTransactionTypeChange,
  searchQuery,
  onSearchQueryChange,
  onSearch,
  onToggleFilters,
  onToggleFavorites,
  favoritesCount,
}: SearchHeaderProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/', { replace: true });
      toast({ title: t('loggedOut') || 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/', { replace: true });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="absolute top-2 left-2 right-2 sm:top-4 sm:left-4 sm:right-4 z-10">
      <Card className="p-3 sm:p-4 lg:p-6 glass-effect shadow-elevated border-primary/20 animate-fade-in backdrop-blur-md card-shine">
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Header Row */}
          <div className="flex items-center gap-2 sm:gap-3 pb-3 sm:pb-4 border-b border-border/40">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="hover:bg-primary/10 transition-all duration-300 hover:scale-110 h-8 w-8 sm:h-10 sm:w-10"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            
            <img
              src={riyalEstateLogo}
              alt="RiyalEstate"
              className="h-10 w-10 sm:h-12 sm:w-12 lg:h-16 lg:w-16 rounded-full object-cover ring-2 ring-primary/40 shadow-elegant transition-all duration-300 hover:ring-primary hover:scale-110"
            />
            
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl lg:text-3xl font-bold gradient-text truncate">
                {t('riyalEstate')}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium hidden sm:block">
                {t('propertySearch')}
              </p>
            </div>
            
            {/* Action buttons - unified sizing */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Market Insights Button */}
              <MarketInsightsSheet />

              {/* Best Value Properties Button */}
              <BestValueSheet />

              {/* Favorites Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleFavorites}
                className="h-8 w-8 sm:h-9 sm:w-9 p-0 relative hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-300 transition-all duration-300 hover:scale-105"
              >
                <Heart
                  className={`h-4 w-4 transition-all duration-300 ${
                    favoritesCount > 0 ? 'fill-red-500 text-red-500' : ''
                  }`}
                />
                {favoritesCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-medium rounded-full h-4 w-4 flex items-center justify-center">
                    {favoritesCount > 9 ? '9+' : favoritesCount}
                  </span>
                )}
              </Button>
              
              {/* Theme Toggle */}
              <ThemeToggle variant="compact" />

              {/* Language Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={toggleLanguage}
                className="h-8 w-8 sm:h-9 sm:w-9 p-0 hover:bg-primary/10 hover:border-primary transition-all duration-300 hover:scale-105 font-semibold text-xs"
              >
                {i18n.language === 'en' ? 'ع' : 'EN'}
              </Button>
              
              {/* Profile Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/profile')}
                className="h-8 w-8 sm:h-9 sm:w-9 p-0 hover:bg-primary/10 hover:border-primary transition-all duration-300 hover:scale-105"
              >
                <User className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Transaction Type Buttons */}
          <div className="flex gap-2 sm:gap-3">
            <Button
              variant={transactionType === 'sale' ? 'default' : 'outline'}
              size="default"
              className={`flex-1 transition-all duration-300 font-semibold text-sm sm:text-base h-9 sm:h-10 lg:h-11 ${
                transactionType === 'sale'
                  ? 'bg-gradient-to-r from-primary to-accent shadow-glow hover:shadow-elevated hover:scale-105'
                  : 'hover:border-primary/50 hover:bg-accent-light/50'
              }`}
              onClick={() => onTransactionTypeChange('sale')}
            >
              {t('forSale')}
            </Button>
            <Button
              variant={transactionType === 'rent' ? 'default' : 'outline'}
              size="default"
              className={`flex-1 transition-all duration-300 font-semibold text-sm sm:text-base h-9 sm:h-10 lg:h-11 ${
                transactionType === 'rent'
                  ? 'bg-gradient-to-r from-primary to-accent shadow-glow hover:shadow-elevated hover:scale-105'
                  : 'hover:border-primary/50 hover:bg-accent-light/50'
              }`}
              onClick={() => onTransactionTypeChange('rent')}
            >
              {t('forRent')}
            </Button>
          </div>

          {/* Search Row */}
          <div className="flex gap-2">
            <div className="flex-1 relative group">
              <MapPin
                className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-primary transition-all duration-300 group-hover:scale-125 ${
                  i18n.language === 'ar' ? 'right-3' : 'left-3'
                }`}
              />
              <Input
                placeholder={t('searchLocation')}
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                onKeyPress={handleKeyPress}
                className={`bg-background/90 backdrop-blur-sm border-border/60 focus-visible:ring-primary focus-visible:border-primary focus-visible:shadow-glow transition-all duration-300 h-10 sm:h-12 text-sm sm:text-base ${
                  i18n.language === 'ar' ? 'pr-9 sm:pr-10' : 'pl-9 sm:pl-10'
                }`}
              />
            </div>
            
            <Button
              size="icon"
              onClick={onSearch}
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-primary to-accent shadow-elevated hover:scale-110 hover:rotate-12 transition-all duration-300 border-2 border-primary/20 relative group overflow-hidden flex-shrink-0"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <Search className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground relative z-10 group-hover:scale-110 transition-transform duration-300" />
            </Button>
            
            <Button
              size="default"
              className="gap-1 sm:gap-3 px-3 sm:px-6 lg:px-8 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] text-primary-foreground font-bold text-xs sm:text-sm lg:text-base shadow-glow hover:bg-[position:100%_0] hover:scale-105 sm:hover:scale-110 transition-all duration-500 border-2 border-primary-foreground/20 group relative overflow-hidden h-10 sm:h-12"
              onClick={onToggleFilters}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <SlidersHorizontal className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 group-hover:rotate-180 transition-transform duration-500 relative z-10" />
              <span className="relative z-10 hidden sm:inline">{t('advancedFilters')}</span>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
});
