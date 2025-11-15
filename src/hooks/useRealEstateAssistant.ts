/**
 * Hook لإدارة المساعد العقاري الذكي مع دعم المحادثة الصوتية
 * النسخة المحدثة مع Voice Assistant
 */
import { useState, useEffect, useCallback } from "react";
import { useVoiceAssistant } from "./useVoiceAssistant";
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
  // إضافات الصوت الجديدة
  isListening: boolean;
  isSpeaking: boolean;
  voiceTranscript: string;
  voiceEnabled: boolean;
  startListening: () => void;
  stopListening: () => void;
  toggleVoice: () => void;
  speak: (text: string, options?: any) => void;
}

export function useRealEstateAssistant(): UseRealEstateAssistantReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [currentCriteria, setCurrentCriteria] = useState<PropertyCriteria | null>(null);
  const [searchResults, setSearchResults] = useState<Property[]>([]);

  // إضافة Voice Assistant
  const {
    isListening,
    isSpeaking,
    transcript: voiceTranscript,
    voiceEnabled,
    speak,
    startListening,
    stopListening,
    toggleVoice,
  } = useVoiceAssistant({
    lang: "ar-SA",
    voiceRate: 0.9,
    autoSpeak: true,
  });

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
          const welcomeMsg = "مرحباً! أنا مساعدك العقاري الذكي 🏡";
          addAssistantMessage(welcomeMsg);
        }
      } else {
        const offlineMsg =
          "⚠️ عذراً، لا يمكن الاتصال بالمساعد الذكي حالياً.\n\nتأكد من تشغيل Backend على http://localhost:8000";
        addAssistantMessage(offlineMsg);
      }
    };

    checkHealth();
  }, []);

  // إضافة رسالة من المساعد مع النطق الصوتي
  const addAssistantMessage = useCallback(
    (content: string, criteria?: PropertyCriteria) => {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "assistant",
        content,
        timestamp: new Date(),
        criteria,
      };
      setMessages((prev) => [...prev, newMessage]);

      // 🔊 النطق التلقائي للرد
      if (voiceEnabled) {
        // تنظيف النص قبل النطق
        const cleanedContent = content
          .replace(/[🏡👍✓😊🎉😔]/g, "") // إزالة الإيموجي
          .replace(/\n+/g, ". ") // تحويل الأسطر لنقاط
          .replace(/[•▪]/g, "") // إزالة الرموز
          .trim();

        speak(cleanedContent, {
          onEnd: () => {
            console.log("انتهى النطق الصوتي");
            // يمكن هنا إضافة منطق لبدء الاستماع تلقائياً
          },
        });
      }
    },
    [voiceEnabled, speak],
  );

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

          // إضافة رد المساعد مع النطق
          addAssistantMessage(response.message, response.criteria);
        } else {
          const errorMsg = response.message || "عذراً، حدث خطأ في فهم طلبك. حاول مرة أخرى.";
          addAssistantMessage(errorMsg);
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
          const successMsg = `تمام! وجدت ${response.total_count} عقار ${modeText} لطلبك 🎉\n\nشوف النتائج على الخريطة!`;
          addAssistantMessage(successMsg);
        } else {
          setSearchResults([]);
          const noResultsMsg = `للأسف ما لقيت عقارات ${mode === "exact" ? "مطابقة" : "مشابهة"} لطلبك 😔\n\nتبي تجرب ${
            mode === "exact" ? "العقارات المشابهة" : "معايير مختلفة"
          }؟`;
          addAssistantMessage(noResultsMsg);
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

    // إيقاف أي صوت جاري
    stopListening();

    // إضافة رسالة ترحيب جديدة
    const newWelcomeMsg = "مرحباً! كيف أقدر أساعدك اليوم؟ 🏡";
    addAssistantMessage(newWelcomeMsg);
  }, [addAssistantMessage, stopListening]);

  return {
    // الخصائص الأساسية
    messages,
    isLoading,
    isBackendOnline,
    currentCriteria,
    searchResults,
    sendMessage,
    selectSearchMode,
    clearChat,

    // خصائص الصوت الجديدة
    isListening,
    isSpeaking,
    voiceTranscript,
    voiceEnabled,
    startListening,
    stopListening,
    toggleVoice,
    speak,
  };
}
