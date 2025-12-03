import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type MarketStat = {
  district: string;
  avg_price_per_m2: number;
  properties_count: number;
  purpose: string;
};

export const useMarketStats = (purpose: 'بيع' | 'إيجار') => {
  return useQuery({
    queryKey: ['market-stats', purpose],
    queryFn: async () => {
      // التغيير هنا: قمنا بإضافة "as any" داخل الأقواس
      const { data, error } = await supabase
        .from('district_market_stats' as any) 
        .select('*')
        .eq('normalized_purpose', purpose)
        .order('avg_price_per_m2', { ascending: false });

      if (error) throw error;
      
      // هنا نقوم بتحويل البيانات إلى النوع الذي عرفناه بالأعلى
      return data as unknown as MarketStat[];
    },
    staleTime: 1000 * 60 * 60, 
  });
};