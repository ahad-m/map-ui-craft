/**
 * ResultsCounter Component
 * 
 * SOLID Principles:
 * - Single Responsibility: Displays property count
 */

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface ResultsCounterProps {
  count: number;
  isLoading: boolean;
  isVisible: boolean;
}

export const ResultsCounter = memo(function ResultsCounter({
  count,
  isLoading,
  isVisible,
}: ResultsCounterProps) {
  const { t } = useTranslation();

  if (!isVisible) return null;

  return (
    <div className="absolute bottom-24 left-4 right-4 z-10 animate-slide-up">
      <Card className="glass-effect shadow-elevated border-primary/30 backdrop-blur-md card-shine">
        <div className="p-4">
          <div className="text-center">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <p className="text-sm font-bold gradient-text">{t('loading')}</p>
              </div>
            ) : count === 0 ? (
              <div className="space-y-1">
                <p className="text-sm font-bold text-destructive">
                  {t('noPropertiesFound')}
                </p>
                <p className="text-xs text-muted-foreground font-medium">
                  {t('tryAdjustingFilters')}
                </p>
              </div>
            ) : (
              <p className="text-base font-extrabold gradient-text">
                {`${count} ${t('propertiesFound')}`}
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
});
