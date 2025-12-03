import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type MarketStat = {
  district: string;
  avg_price_per_m2: number;
  properties_count: number;
  purpose: string;
  district_points: { lat: number; lng: number }[];
  // الإضافات الجديدة: الإحداثيات لرسم الخريطة الحرارية
  avg_lat: number;
  avg_lon: number;
};

export const useMarketStats = (purpose: 'بيع' | 'إيجار') => {
  return useQuery({
    queryKey: ['market-stats', purpose],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('district_market_stats' as any) 
        .select('*')
        .eq('normalized_purpose', purpose)
        .order('avg_price_per_m2', { ascending: false });

      if (error) throw error;
      
      return data as unknown as MarketStat[];
    },
    staleTime: 1000 * 60 * 60, 
  });
};
