import { useEffect, useMemo, useState, useRef } from 'react';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { MarketStat } from '../../hooks/useMarketStats';

interface HeatmapLayerProps {
  data: MarketStat[];
  visible: boolean;
}

export const HeatmapLayer = ({ data, visible }: HeatmapLayerProps) => {
  const map = useMap();
  const visualizationLib = useMapsLibrary('visualization');
  const [heatmap, setHeatmap] = useState<google.maps.visualization.HeatmapLayer | null>(null);
  const zoomListenerRef = useRef<google.maps.MapsEventListener | null>(null);

  // 1. تدرج الألوان
  const gradient = [
    'rgba(0, 255, 255, 0)',   // شفاف
    'rgba(0, 255, 255, 1)',   // سماوي
    'rgba(0, 255, 0, 1)',     // أخضر
    'rgba(255, 255, 0, 1)',   // أصفر
    'rgba(255, 0, 0, 1)'      // أحمر
  ];

  // 2. تحضير البيانات
  const heatmapData = useMemo(() => {
    if (!data || !visualizationLib) return [];
    // فلتر البيانات وتأكد من صحتها
    const validData = data.filter(d => d.avg_lat && d.avg_lon && d.avg_price_per_m2);
    return validData.map(district => ({
      location: new google.maps.LatLng(district.avg_lat, district.avg_lon),
      weight: district.avg_price_per_m2, 
    }));
  }, [data, visualizationLib]);

  // 3. حساب الحد الأقصى (Max Intensity)
  const maxIntensity = useMemo(() => {
    if (!data.length) return 2000;
    const prices = data.map(d => d.avg_price_per_m2).sort((a, b) => a - b);
    const p97Index = Math.floor(prices.length * 0.97);
    return prices[p97Index] || prices[prices.length - 1];
  }, [data]);

  useEffect(() => {
    if (!map || !visualizationLib) return;

    // دالة نصف القطر الديناميكي
    const getRadiusForZoom = (zoom: number) => {
      if (zoom <= 10) return 20;
      if (zoom <= 11) return 35;
      if (zoom <= 12) return 60;
      if (zoom <= 13) return 90;
      return 130;
    };

    // إنشاء أو تحديث الهيت ماب
    if (!heatmap) {
      const newHeatmap = new visualizationLib.HeatmapLayer({
        data: heatmapData,
        map: visible ? map : null,
        opacity: 0.75,
        gradient: gradient,
        maxIntensity: maxIntensity,
        radius: getRadiusForZoom(map.getZoom() || 12),
        dissipating: true,
      });
      setHeatmap(newHeatmap);
    } else {
      heatmap.setData(heatmapData);
      heatmap.setOptions({
        gradient,
        maxIntensity,
        opacity: 0.75,
        radius: getRadiusForZoom(map.getZoom() || 12)
      });
      heatmap.setMap(visible ? map : null);
    }

    // إدارة الزوم
    if (zoomListenerRef.current) {
      google.maps.event.removeListener(zoomListenerRef.current);
    }

    if (visible && heatmap) {
      zoomListenerRef.current = map.addListener('zoom_changed', () => {
        const zoom = map.getZoom() || 12;
        heatmap.set('radius', getRadiusForZoom(zoom));
      });
    }

    // 👇👇👇 الحل هنا 👇👇👇
    // دالة التنظيف (Cleanup Function)
    return () => {
      // 1. حذف مستمع الزوم
      if (zoomListenerRef.current) {
        google.maps.event.removeListener(zoomListenerRef.current);
      }
      
      // 2. حذف الخريطة الحرارية دائماً عند انتهاء المكون
      // أزلنا شرط (!visible) عشان نضمن الحذف حتى عند التبديل
      if (heatmap) {
        heatmap.setMap(null);
      }
    };
    // 👆👆👆 ---------------- 👆👆👆

  }, [map, visualizationLib, heatmapData, visible, heatmap, maxIntensity]);

  return null;
};
