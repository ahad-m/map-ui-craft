import React, { useState, useMemo } from 'react'; // 1. تمت إضافة useMemo هنا
import { useTranslation } from 'react-i18next';
import { TrendingUp, Search, MapPin, Loader2 } from 'lucide-react'; // تمت إضافة Loader2
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
import { Progress } from '@/components/ui/progress';
import { useMarketStats } from '../hooks/useMarketStats';

export const MarketInsightsSheet = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'بيع' | 'إيجار'>('بيع');
  const [searchTerm, setSearchTerm] = useState('');
  
  // استدعاء الهوك
  const { data: stats, isLoading } = useMarketStats(activeTab);

  // 2. تم تغيير منطق الفلترة ليكون آمناً باستخدام useMemo
  const filteredStats = useMemo(() => {
    // إذا لم تكن البيانات قد وصلت بعد، نعيد مصفوفة فارغة
    if (!stats) return [];

    return stats.filter(stat => {
      // التحقق الأمني: هل اسم الحي موجود وهو نص؟
      const districtName = stat.district;
      if (!districtName || typeof districtName !== 'string') return false;

      // إذا كان البحث فارغاً، نعيد الحي للعرض
      if (!searchTerm.trim()) return true;

      // البحث الآمن
      return districtName.includes(searchTerm.trim());
    });
  }, [stats, searchTerm]);

  // حساب أعلى سعر لضبط مقياس الـ Progress Bar
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
        <Button variant="outline" size="icon" className="relative hover:bg-secondary/50 transition-colors" title="تحليل أسعار السوق">
          <TrendingUp className="h-5 w-5 text-primary" />
        </Button>
      </SheetTrigger>
      
      <SheetContent side="left" className="w-[400px] sm:w-[540px] flex flex-col h-full">
        <SheetHeader className="mb-6 flex-shrink-0">
          <SheetTitle className="flex items-center gap-2 text-xl text-primary">
            <TrendingUp className="h-6 w-6" />
            مؤشر أسعار الأحياء
          </SheetTitle>
          <SheetDescription>
            متوسط سعر المتر المربع في أحياء الرياض بناءً على العروض الحالية
          </SheetDescription>
        </SheetHeader>

        {/* التبويبات والبحث */}
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
        </div>

        {/* منطقة النتائج */}
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