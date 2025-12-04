/**
 * ClearHighlightedPropertyButton Component
 * 
 * A floating button to clear/hide the highlighted property marker from the map.
 * Appears when a property is highlighted from the Best Value list.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHighlightedProperty } from '../context/HighlightedPropertyContext';

export const ClearHighlightedPropertyButton = () => {
  const { t } = useTranslation();
  const { highlightedProperty, showHighlightedMarker, clearHighlightedProperty } = useHighlightedProperty();

  // Don't show if no highlighted property
  if (!showHighlightedMarker || !highlightedProperty) {
    return null;
  }

  return (
    <div className="absolute bottom-24 left-4 z-20 animate-fade-in">
      <Button
        onClick={clearHighlightedProperty}
        className="gap-2 bg-amber-500 hover:bg-amber-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 group"
        size="sm"
      >
        <div className="relative">
          <Star className="h-4 w-4 fill-white" />
          <X className="h-3 w-3 absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5" />
        </div>
        <span>{t('bestValue.clearHighlight', 'إخفاء العقار المميز')}</span>
      </Button>
    </div>
  );
};
