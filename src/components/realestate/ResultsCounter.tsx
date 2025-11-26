/**
 * Results Counter Component
 * 
 * Displays the count of properties found or loading/error states.
 */

import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

interface ResultsCounterProps {
  isLoading: boolean;
  propertiesCount: number;
  hasSearched: boolean;
  selectedProperty: any;
  t: (key: string) => string;
}

export const ResultsCounter = ({
  isLoading,
  propertiesCount,
  hasSearched,
  selectedProperty,
  t,
}: ResultsCounterProps) => {
  // Don't show if property dialog is open or no search has been performed
  if (selectedProperty || !hasSearched) return null;

  return (
    <div className="absolute bottom-24 left-4 right-4 z-10 animate-slide-up">
      <Card className="glass-effect shadow-elevated border-primary/30 backdrop-blur-md card-shine">
        <div className="p-4">
          <div className="text-center">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <p className="text-sm font-bold gradient-text">
                  {t("loading")}
                </p>
              </div>
            ) : propertiesCount === 0 ? (
              <div className="space-y-1">
                <p className="text-sm font-bold text-destructive">
                  {t("noPropertiesFound")}
                </p>
                <p className="text-xs text-muted-foreground font-medium">
                  {t("tryAdjustingFilters")}
                </p>
              </div>
            ) : (
              <p className="text-base font-extrabold gradient-text">
                {`${propertiesCount} ${t("propertiesFound")}`}
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
