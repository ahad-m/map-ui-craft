import React, { createContext, useContext, useState } from 'react';

type HeatmapContextType = {
  isHeatmapVisible: boolean;
  toggleHeatmap: () => void;
};

const HeatmapContext = createContext<HeatmapContextType | undefined>(undefined);

export const HeatmapProvider = ({ children }: { children: React.ReactNode }) => {
  const [isHeatmapVisible, setIsHeatmapVisible] = useState(false);

  const toggleHeatmap = () => setIsHeatmapVisible(prev => !prev);

  return (
    <HeatmapContext.Provider value={{ isHeatmapVisible, toggleHeatmap }}>
      {children}
    </HeatmapContext.Provider>
  );
};

export const useHeatmap = () => {
  const context = useContext(HeatmapContext);
  if (!context) throw new Error('useHeatmap must be used within a HeatmapProvider');
  return context;
};