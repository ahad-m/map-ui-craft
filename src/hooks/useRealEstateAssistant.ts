/**
 Hook لإدارة المساعد العقاري الذكي
**/
import { useState, useEffect, useCallback } from "react";
import {
  getWelcomeMessage,
  sendUserQuery,
  searchProperties,
  checkBackendHealth,
  type AssistantMessage,
  type Property,
  type PropertyCriteria,
} from "../api/realEstateAssistant";

export interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  criteria?: PropertyCriteria;
}

export interface UseRealEstateAssistantReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  isBackendOnline: boolean;
  currentCriteria: PropertyCriteria | null;
  searchResults: Property[];
  sendMessage: (message: string) => Promise<void>;
  selectSearchMode: (mode: "exact" | "similar") => Promise<void>;
  clearChat: () => void;
}

export function useRealEstateAssistant(): UseRealEstateAssistantReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [currentCriteria, setCurrentCriteria] = useState<PropertyCriteria | null>(null);
  const [searchResults, setSearchResults] = useState<Property[]>([]);

  // فحص حالة Backend عند التحميل
  useEffect(() => {
    const checkHealth = async () => {
      const isOnline = await checkBackendHealth();
      setIsBackendOnline(isOnline);

      if (isOnline) {
        // الحصول على رسالة الترحيب
        try {
          const welcome = await getWelcomeMessage();
          addAssistantMessage(welcome.message);
        } catch (error) {
          console.error("Failed to get welcome message:", error);
          addAssistantMessage("مرحباً! أنا مساعدك العقاري الذكي 🏡");
        }
      } else {
        addAssistantMessage(
          "⚠️ عذراً، لا يمكن الاتصال بالمساعد الذكي حالياً.\n\nتأكد من تشغيل Backend على http://localhost:8000",
        );
      }
    };

    checkHealth();
  }, []);

  // إضافة رسالة من المساعد
  const addAssistantMessage = useCallback((content: string, criteria?: PropertyCriteria) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "assistant",
      content,
      timestamp: new Date(),
      criteria,
    };
    setMessages((prev) => [...prev, newMessage]);
  }, []);

  // إضافة رسالة من المستخدم
  const addUserMessage = useCallback((content: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  }, []);

  // إرسال رسالة
  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim() || !isBackendOnline) return;

      setIsLoading(true);
      addUserMessage(message);

      try {
        // إرسال الطلب للـ Backend
        const response: AssistantMessage = await sendUserQuery(message);

        if (response.success) {
          // حفظ المعايير
          if (response.criteria) {
            setCurrentCriteria(response.criteria);
          }

          // إضافة رد المساعد
          addAssistantMessage(response.message, response.criteria);
        } else {
          addAssistantMessage(response.message || "عذراً، حدث خطأ في فهم طلبك. حاول مرة أخرى.");
        }
      } catch (error) {
        console.error("Error sending message:", error);
        addAssistantMessage("عذراً، حدث خطأ في الاتصال. حاول مرة أخرى.");
      } finally {
        setIsLoading(false);
      }
    },
    [isBackendOnline, addUserMessage, addAssistantMessage],
  );

  // اختيار نمط البحث
  const selectSearchMode = useCallback(
    async (mode: "exact" | "similar") => {
      if (!currentCriteria) {
        addAssistantMessage("لم يتم تحديد معايير البحث بعد.");
        return;
      }

      setIsLoading(true);

      try {
        // البحث عن العقارات
        const response = await searchProperties(currentCriteria, mode);

        if (response.success && response.properties && response.properties.length > 0) {
          setSearchResults(response.properties);

          const modeText = mode === "exact" ? "المطابقة" : "المشابهة";
          addAssistantMessage(
            `تمام! وجدت ${response.total_count} عقار ${modeText} لطلبك 🎉\n\nشوف النتائج على الخريطة!`,
          );
        } else {
          setSearchResults([]);
          addAssistantMessage(
            `للأسف ما لقيت عقارات ${mode === "exact" ? "مطابقة" : "مشابهة"} لطلبك 😔\n\nتبي تجرب ${
              mode === "exact" ? "العقارات المشابهة" : "معايير مختلفة"
            }؟`,
          );
        }
      } catch (error) {
        console.error("Error searching properties:", error);
        setSearchResults([]);
        addAssistantMessage("عذراً، حدث خطأ في البحث. حاول مرة أخرى.");
      } finally {
        setIsLoading(false);
      }
    },
    [currentCriteria, addAssistantMessage],
  );

  // مسح المحادثة
  const clearChat = useCallback(() => {
    setMessages([]);
    setCurrentCriteria(null);
    setSearchResults([]);

    // إضافة رسالة ترحيب جديدة
    addAssistantMessage("مرحباً! كيف أقدر أساعدك اليوم؟ 🏡");
  }, [addAssistantMessage]);

  return {
    messages,
    isLoading,
    isBackendOnline,
    currentCriteria,
    searchResults,
    sendMessage,
    selectSearchMode,
    clearChat,
  };
}
