/**
 * Top Search Bar Component
 * 
 * Contains the header section with logo, action buttons,
 * transaction type toggles, and search input.
 */

import { Search, MapPin, Languages, ArrowLeft, Heart, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import riyalEstateLogo from "@/assets/riyal-estate-logo.jpg";

interface TopSearchBarProps {
  transactionType: "rent" | "sale";
  searchQuery: string;
  favoritesCount: number;
  language: string;
  onTransactionTypeChange: (type: "rent" | "sale") => void;
  onSearchQueryChange: (query: string) => void;
  onSearchExecute: () => void;
  onToggleLanguage: () => void;
  onToggleFavorites: () => void;
  onProfileClick: () => void;
  onBack: () => void;
  filterButton: React.ReactNode;
  t: (key: string) => string;
  isRTL: boolean;
}

export const TopSearchBar = ({
  transactionType,
  searchQuery,
  favoritesCount,
  language,
  onTransactionTypeChange,
  onSearchQueryChange,
  onSearchExecute,
  onToggleLanguage,
  onToggleFavorites,
  onProfileClick,
  onBack,
  filterButton,
  t,
  isRTL,
}: TopSearchBarProps) => {
  return (
    <div className="absolute top-4 left-4 right-4 z-10">
      <Card className="p-6 glass-effect shadow-elevated border-primary/20 animate-fade-in backdrop-blur-md card-shine">
        <div className="flex flex-col gap-4">
          {/* Header Section */}
          <div className="flex items-center gap-3 pb-4 border-b border-border/40">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="hover:bg-primary/10 transition-all duration-300 hover:scale-110"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img
              src={riyalEstateLogo}
              alt="RiyalEstate"
              className="h-16 w-16 rounded-full object-cover ring-2 ring-primary/40 shadow-elegant transition-all duration-300 hover:ring-primary hover:scale-110"
            />
            <div className="flex-1">
              <h1 className="text-3xl font-bold gradient-text">
                {t("riyalEstate")}
              </h1>
              <p className="text-sm text-muted-foreground font-medium">
                {t("propertySearch")}
              </p>
            </div>
            <div className="flex gap-2">
              {/* Favorites Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleFavorites}
                className="gap-2 relative hover:bg-red-50 hover:border-red-300 transition-all duration-300 hover:scale-105"
              >
                <Heart
                  className={`h-4 w-4 transition-all duration-300 ${
                    favoritesCount > 0 ? "fill-red-500 text-red-500" : ""
                  }`}
                />
                {favoritesCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse-glow">
                    {favoritesCount}
                  </span>
                )}
              </Button>
              {/* Language Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleLanguage}
                className="gap-2 hover:bg-accent-light hover:border-primary transition-all duration-300 hover:scale-105"
              >
                <Languages className="h-4 w-4" />
                {language === "en" ? "ع" : "EN"}
              </Button>
              {/* Profile Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={onProfileClick}
                className="gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary transition-all duration-300 hover:scale-105"
              >
                <User className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Transaction Type Toggles */}
          <div className="flex gap-3">
            <Button
              variant={transactionType === "sale" ? "default" : "outline"}
              size="lg"
              className={`flex-1 transition-all duration-300 font-semibold text-base ${
                transactionType === "sale"
                  ? "bg-gradient-to-r from-primary to-accent shadow-glow hover:shadow-elevated hover:scale-105"
                  : "hover:border-primary/50 hover:bg-accent-light/50"
              }`}
              onClick={() => onTransactionTypeChange("sale")}
            >
              {t("forSale")}
            </Button>
            <Button
              variant={transactionType === "rent" ? "default" : "outline"}
              size="lg"
              className={`flex-1 transition-all duration-300 font-semibold text-base ${
                transactionType === "rent"
                  ? "bg-gradient-to-r from-primary to-accent shadow-glow hover:shadow-elevated hover:scale-105"
                  : "hover:border-primary/50 hover:bg-accent-light/50"
              }`}
              onClick={() => onTransactionTypeChange("rent")}
            >
              {t("forRent")}
            </Button>
          </div>

          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="flex-1 relative group">
              <MapPin
                className={`absolute top-1/2 -translate-y-1/2 h-5 w-5 text-primary transition-all duration-300 group-hover:scale-125 ${
                  isRTL ? "right-3" : "left-3"
                }`}
              />
              <Input
                placeholder={t("searchLocation")}
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && onSearchExecute()}
                className={`bg-background/90 backdrop-blur-sm border-border/60 focus-visible:ring-primary focus-visible:border-primary focus-visible:shadow-glow transition-all duration-300 h-12 ${
                  isRTL ? "pr-10" : "pl-10"
                }`}
              />
            </div>
            <Button
              size="icon"
              onClick={onSearchExecute}
              className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent shadow-elevated hover:scale-110 hover:rotate-12 transition-all duration-300 border-2 border-primary/20 relative group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <Search className="h-5 w-5 text-primary-foreground relative z-10 group-hover:scale-110 transition-transform duration-300" />
            </Button>
            {filterButton}
          </div>
        </div>
      </Card>
    </div>
  );
};
