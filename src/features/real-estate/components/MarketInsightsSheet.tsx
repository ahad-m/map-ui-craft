import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, Search, MapPin, Loader2, Map } from 'lucide-react'; // تم إضافة Map
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useMarketStats } from '../hooks/useMarketStats';
// 1. استدعاء السياق
import { useHeatmap } from '../context/HeatmapContext';

export const MarketInsightsSheet = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'بيع' | 'إيجار'>('بيع');
  const [searchTerm, setSearchTerm] = useState('');
  
  // 2. استخدام السياق للتحكم بالزر
  const { isHeatmapVisible, toggleHeatmap } = useHeatmap();

  const { data: stats, isLoading } = useMarketStats(activeTab);

  const filteredStats = useMemo(() => {
    if (!stats) return [];
    return stats.filter(stat => {
      const districtName = stat.district;
      if (!districtName || typeof districtName !== 'string') return false;
      if (!searchTerm.trim()) return true;
      return districtName.includes(searchTerm.trim());
    });
  }, [stats, searchTerm]);

  const maxPrice = stats?.length ? Math.max(...stats.map(s => s.avg_price_per_m2 || 0)) : 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="h-8 w-8 sm:h-9 sm:w-9 p-0 relative hover:bg-primary/10 hover:border-primary transition-all duration-300 hover:scale-105" 
          title="تحليل أسعار السوق"
        >
          <TrendingUp className="h-4 w-4 text-primary" />
        </Button>
      </SheetTrigger>
      
      <SheetContent side="left" className="w-full sm:w-[400px] md:w-[480px] lg:w-[540px] flex flex-col h-full p-4 sm:p-6">
        <SheetHeader className="mb-4 sm:mb-6 flex-shrink-0">
          <SheetTitle className="flex items-center gap-2 text-lg sm:text-xl text-primary">
            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
            مؤشر أسعار الأحياء
          </SheetTitle>
          <SheetDescription className="text-sm sm:text-base">
            متوسط سعر المتر المربع في أحياء الرياض بناءً على العروض الحالية
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 flex-shrink-0">
          <Tabs value={activeTab} dir="rtl" onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="بيع">أسعار البيع</TabsTrigger>
              <TabsTrigger value="إيجار">أسعار الإيجار</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث عن اسم الحي..."
              className="pr-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* 3. زر تفعيل الخريطة الحرارية الجديد */}
          <Button 
            variant={isHeatmapVisible ? "default" : "outline"} 
            className={`w-full gap-2 transition-all duration-300 ${
              isHeatmapVisible 
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 border-none shadow-lg hover:from-green-700 hover:to-emerald-700' 
                : 'hover:border-primary/50'
            }`}
            onClick={toggleHeatmap}
          >
            <Map className="h-4 w-4" />
            {isHeatmapVisible ? 'إخفاء الخريطة الحرارية' : 'عرض الخريطة الحرارية للأسعار'}
          </Button>

        </div>

        <ScrollArea className="flex-1 mt-4 -mr-4 pr-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p>جاري تحليل بيانات السوق...</p>
            </div>
          ) : filteredStats.length === 0 ? (
             <div className="text-center py-10 space-y-3">
               <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                 <Search className="h-8 w-8 text-muted-foreground/50" />
               </div>
               <p className="text-muted-foreground">
                 {searchTerm ? `لا توجد نتائج لـ "${searchTerm}"` : "لا تتوفر بيانات كافية حالياً"}
               </p>
             </div>
          ) : (
            <div className="space-y-6 pb-6">
              {filteredStats.map((stat, index) => (
                <div key={`${stat.district}-${index}`} className="group relative bg-card hover:bg-accent/5 p-3 rounded-lg transition-colors border border-transparent hover:border-border/50">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <div className="bg-primary/10 p-1.5 rounded-full">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <span className="font-bold block text-base">{stat.district}</span>
                        <span className="text-xs text-muted-foreground">
                          بناءً على {stat.properties_count} عقار
                        </span>
                      </div>
                    </div>
                    <div className="text-left">
                      <span className="font-bold text-primary text-lg block">
                        {formatPrice(stat.avg_price_per_m2)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">متوسط المتر</span>
                    </div>
                  </div>
                  
                  <div className="relative h-2 w-full bg-secondary rounded-full overflow-hidden">
                     <div 
                        className="h-full bg-primary transition-all duration-500 ease-out"
                        style={{ width: `${maxPrice > 0 ? (stat.avg_price_per_m2 / maxPrice) * 100 : 0}%` }}
                     />
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
