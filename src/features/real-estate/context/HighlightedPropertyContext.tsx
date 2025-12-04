/**
 * HighlightedPropertyContext
 * 
 * Context to share a highlighted/selected property from BestValueSheet
 * with PropertyMap so it can be displayed as a special marker.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { BestValueProperty } from '../types/bestValue';

interface HighlightedPropertyContextType {
  /** The currently highlighted property (from best value selection) */
  highlightedProperty: BestValueProperty | null;
  
  /** Set a property to highlight on the map */
  setHighlightedProperty: (property: BestValueProperty | null) => void;
  
  /** Clear the highlighted property */
  clearHighlightedProperty: () => void;
  
  /** Whether to show the highlighted property marker */
  showHighlightedMarker: boolean;
}

const HighlightedPropertyContext = createContext<HighlightedPropertyContextType | undefined>(undefined);

export function HighlightedPropertyProvider({ children }: { children: React.ReactNode }) {
  const [highlightedProperty, setHighlightedPropertyState] = useState<BestValueProperty | null>(null);
  const [showHighlightedMarker, setShowHighlightedMarker] = useState(false);

  const setHighlightedProperty = useCallback((property: BestValueProperty | null) => {
    setHighlightedPropertyState(property);
    setShowHighlightedMarker(!!property);
  }, []);

  const clearHighlightedProperty = useCallback(() => {
    setHighlightedPropertyState(null);
    setShowHighlightedMarker(false);
  }, []);

  return (
    <HighlightedPropertyContext.Provider
      value={{
        highlightedProperty,
        setHighlightedProperty,
        clearHighlightedProperty,
        showHighlightedMarker,
      }}
    >
      {children}
    </HighlightedPropertyContext.Provider>
  );
}

export function useHighlightedProperty() {
  const context = useContext(HighlightedPropertyContext);
  if (context === undefined) {
    throw new Error('useHighlightedProperty must be used within a HighlightedPropertyProvider');
  }
  return context;
}
