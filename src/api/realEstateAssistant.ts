// ملف: src/api/realEstateAssistant.ts
// (النسخة الكاملة المحدثة التي تدعم "الحوار" و "إعادة التشغيل")

import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";

// ==========================================================
// !! تعريف النماذج (Types) - يجب أن تكون مطابقة لـ models.py !!
// ==========================================================
// (يمكنك نقل هذا إلى ملف منفصل @/types/index.ts إذا أردت)

// 1. العقار
export interface Property {
  id: string;
  lat?: number;
  lon?: number;
  title?: string;
  price_num?: number;
  image_url?: string;
  district?: string;
  city?: string;
  rooms?: number;
  baths?: number;
  area_m2?: number;
  // ... أضف أي حقول أخرى تحتاجها الواجهة
}

// 2. معايير البحث
export interface PropertyCriteria {
  purpose: string;
  property_type: string;
  district?: string;
  city?: string;
  rooms?: { min?: number; max?: number; exact?: number };
  price?: { min?: number; max?: number };
  metro_time_max?: number;
  school_requirements?: {
    required: boolean;
    name?: string;
    proximity_minutes?: number;
    gender?: string;
    level?: string;
  };
  university_requirements?: {
    required: boolean;
    name?: string;
    proximity_minutes?: number;
  };
  original_query?: string;
}

// 3. رسالة الشات (الواجهة)
export interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  criteria?: PropertyCriteria | null; // <-- المعايير المستخرجة
}

// 4. رسالة الشات (للباك إند)
export interface BackendChatMessage {
  role: "user" | "assistant";
  content: string;
}

// 5. استجابة الباك إند (استخراج)
export interface CriteriaExtractionResponse {
  success: boolean;
  message: string;
  criteria?: PropertyCriteria;
  needs_clarification?: boolean;
}

// 6. استجابة الباك إند (بحث)
export interface SearchResponse {
  success: boolean;
  message: string;
  properties: Property[];
  total_count: number;
}
// ==========================================================
// !! نهاية تعريف النماذج (Types) !!
// ==========================================================

// الرابط للباك إند (من ملفك .tsx)
const API_BASE_URL = "https://riyal-estate-56q6.onrender.com"; // <-- الرابط الصحيح

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  type: "assistant",
  content: "مرحباً فيك! أنا مساعدك العقاري الذكي 🏡\nاطلب اللي تبي وأنا بجيبه لك",
};

export const useRealEstateAssistant = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [searchResults, setSearchResults] = useState<Property[]>([]);

  // ==========================================================
  // !! تعديل: إضافة حالة لتخزين المعايير الحالية !!
  // ==========================================================
  const [currentCriteria, setCurrentCriteria] = useState<PropertyCriteria | null>(null);
  // ==========================================================

  // (دالة فحص الاتصال بالباك إند)
  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/health`, { method: "GET" });
        if (response.ok) {
          setIsBackendOnline(true);
        } else {
          setIsBackendOnline(false);
        }
      } catch (error) {
        setIsBackendOnline(false);
      }
    };
    checkBackendStatus();
  }, []);

  // ==========================================================
  // !! تعديل: دالة إرسال الرسالة (الآن ترسل التاريخ) !!
  // ==========================================================
  const sendMessage = async (messageContent: string) => {
    setIsLoading(true);

    // 1. إضافة رسالة المستخدم للشاشة فوراً
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: messageContent,
    };
    setMessages((prev) => [...prev, userMessage]);

    // 2. تحضير "تاريخ المحادثة" لإرساله للباك إند
    const historyPayload: BackendChatMessage[] = messages.map((msg) => ({
      role: msg.type,
      content: msg.content,
    }));

    try {
      // 3. إرسال الطلب (مع التاريخ)
      const response = await fetch(`${API_BASE_URL}/api/chat/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageContent,
          conversation_history: historyPayload, // <-- إرسال التاريخ
        }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data: CriteriaExtractionResponse = await response.json();

      // 4. إضافة رد المساعد للشاشة
      const assistantMessage: ChatMessage = {
        id: Date.now().toString() + "-bot",
        type: "assistant",
        content: data.message,
        criteria: data.criteria || null, // <-- أهم نقطة: تخزين المعايير في الرسالة
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // 5. حفظ المعايير في "الحالة" ليتم استخدامها في الخطوة التالية
      if (data.success && data.criteria) {
        setCurrentCriteria(data.criteria);
        setSearchResults([]); // مسح النتائج القديمة
      }
    } catch (error) {
      console.error("Error processing query:", error);
      const errorMsg: ChatMessage = {
        id: Date.now().toString() + "-err",
        type: "assistant",
        content: "عذراً، حدث خطأ في الاتصال. حاول مرة أخرى.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================================
  // !! تعديل: دالة اختيار نمط البحث (الآن تستخدم المعايير المخزنة) !!
  // ==========================================================
  const selectSearchMode = async (mode: "exact" | "similar") => {
    // التأكد من أن المعايير موجودة
    if (!currentCriteria) {
      toast({ title: "خطأ", description: "لا توجد معايير بحث لبدء البحث.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setSearchResults([]); // مسح النتائج القديمة فوراً

    try {
      const response = await fetch(`${API_BASE_URL}/api/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: mode,
          criteria: currentCriteria, // <-- استخدام المعايير المخزنة
        }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data: SearchResponse = await response.json();

      // إضافة رسالة "وجدت لك..." + "هل تبي شي ثاني؟"
      const assistantMessage: ChatMessage = {
        id: Date.now().toString() + "-results",
        type: "assistant",
        content: data.message, // <-- هذه الرسالة الآن تحتوي على سؤال المتابعة
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // تحديث نتائج البحث (الخريطة ستتحدث تلقائياً)
      if (data.success && data.properties) {
        setSearchResults(data.properties);
      }
    } catch (error) {
      console.error("Error performing search:", error);
      const errorMsg: ChatMessage = {
        id: Date.now().toString() + "-err",
        type: "assistant",
        content: "عذراً، حدث خطأ في البحث. حاول مرة أخرى.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================================
  // !! إضافة: دالة إعادة التشغيل (Reset) !!
  // ==========================================================
  const resetChat = () => {
    setMessages([WELCOME_MESSAGE]); // مسح الرسائل
    setSearchResults([]); // مسح نتائج الخريطة
    setCurrentCriteria(null); // مسح المعايير
    toast({ title: "تم بدء محادثة جديدة" });
  };

  return {
    messages,
    isLoading: isChatLoading,
    isBackendOnline,
    searchResults: searchResults, // <-- الواجهة يجب أن تقرأ من هذا المتغير
    sendMessage,
    selectSearchMode,
    resetChat, // <-- تصدير الدالة الجديدة
  };
};
