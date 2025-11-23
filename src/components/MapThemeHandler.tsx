import { useEffect } from 'react';
import { useMap } from '@vis.gl/react-google-maps';

interface MapThemeHandlerProps {
  theme: string | undefined;
  darkMapStyles: google.maps.MapTypeStyle[];
}

export const MapThemeHandler = ({ theme, darkMapStyles }: MapThemeHandlerProps) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    if (theme === 'dark') {
      map.setOptions({ styles: darkMapStyles });
    } else {
      map.setOptions({ styles: [] });
    }
  }, [map, theme, darkMapStyles]);

  return null;
};
