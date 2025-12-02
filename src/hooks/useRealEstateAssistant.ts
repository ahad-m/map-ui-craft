/**
 * useRealEstateAssistant Hook
 * 
 * Hook رئيسي للتواصل مع المساعد العقاري الذكي
 * 
 * النسخة المحدثة: دعم المحادثة التفاعلية (Multi-Turn)
 * - يحتفظ بـ lastCriteria لدعم التعديلات على الطلب السابق
 * - يمرر المعايير السابقة مع كل طلب جديد
 * - يتتبع نوع الإجراء (NEW_SEARCH / UPDATE_CRITERIA)
 */

import { useState, useCallback, useEffect } from 'react';
import {
  sendUserQuery,
  searchProperties,
  getWelcomeMessage,
  checkBackendHealth,
  type PropertyCriteria,
  type AssistantMessage,
  type Property,
  type ActionType,
} from '@/api/realEstateAssistant';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  criteria?: PropertyCriteria;
  // [جديد] حقول المحادثة التفاعلية
  actionType?: ActionType;
  changesSummary?: string | null;
}

interface UseRealEstateAssistantReturn {
  // State
  messages: Message[];
  isLoading: boolean;
  isBackendOnline: boolean;
  currentCriteria: PropertyCriteria | undefined;
  searchResults: Property[];
  
  // [جديد] للمحادثة التفاعلية
  lastCriteria: PropertyCriteria | null;
  lastActionType: ActionType | null;
  
  // Actions
  sendMessage: (message: string) => Promise<void>;
  selectSearchMode: (mode: 'exact' | 'similar') => Promise<void>;
  clearChat: () => void;
  clearLastCriteria: () => void;
}

export function useRealEstateAssistant(): UseRealEstateAssistantReturn {
  // ============================================
  // State
  // ============================================
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBackendOnline, setIsBackendOnline] = useState(true);
  const [currentCriteria, setCurrentCriteria] = useState<PropertyCriteria | undefined>();
  const [searchResults, setSearchResults] = useState<Property[]>([]);
  
  // [جديد] State للمحادثة التفاعلية
  const [lastCriteria, setLastCriteria] = useState<PropertyCriteria | null>(null);
  const [lastActionType, setLastActionType] = useState<ActionType | null>(null);

  // ============================================
  // Backend Health Check
  // ============================================
  useEffect(() => {
    const checkHealth = async () => {
      const isOnline = await checkBackendHealth();
      setIsBackendOnline(isOnline);
    };
    
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // كل 30 ثانية
    
    return () => clearInterval(interval);
  }, []);

  // ============================================
  // Welcome Message
  // ============================================
  useEffect(() => {
    const fetchWelcome = async () => {
      try {
        const welcomeResponse = await getWelcomeMessage();
        const welcomeMessage: Message = {
          id: `welcome-${Date.now()}`,
          type: 'assistant',
          content: welcomeResponse.message,
          actionType: welcomeResponse.action_type || 'GREETING',
        };
        setMessages([welcomeMessage]);
      } catch (error) {
        console.error('Error fetching welcome message:', error);
        // رسالة افتراضية
        const defaultWelcome: Message = {
          id: `welcome-${Date.now()}`,
          type: 'assistant',
          content: 'مرحباً فيك! 🏡\n\nأنا مساعدك العقاري الذكي.\nاطلب اللي تبي وأنا بجيبه لك!\n\n💡 تقدر تعدّل طلبك بسهولة! مثلاً:\n• "هونت، أبي أربع غرف"\n• "نسيت، أبي قريب من مدرسة"',
          actionType: 'GREETING',
        };
        setMessages([defaultWelcome]);
      }
    };
    
    fetchWelcome();
  }, []);

  // ============================================
  // Send Message
  // ============================================
  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isLoading) return;

    setIsLoading(true);

    // إضافة رسالة المستخدم
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: message,
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // [محدث] إرسال الرسالة مع المعايير السابقة
      console.log('📤 Sending message with previous criteria:', {
        message,
        hasPreviousCriteria: !!lastCriteria,
      });

      const response: AssistantMessage = await sendUserQuery(message, lastCriteria);

      // [جديد] تسجيل نوع الإجراء
      console.log('📥 Response received:', {
        actionType: response.action_type,
        changesSummary: response.changes_summary,
        success: response.success,
      });

      // إضافة رسالة المساعد
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: response.message,
        criteria: response.criteria,
        actionType: response.action_type,
        changesSummary: response.changes_summary,
      };
      setMessages(prev => [...prev, assistantMessage]);

      // [محدث] تحديث المعايير والـ state
      if (response.success && response.criteria) {
        setCurrentCriteria(response.criteria);
        setLastCriteria(response.criteria); // [جديد] حفظ للطلب القادم
        setLastActionType(response.action_type || 'NEW_SEARCH');
        
        console.log('✅ Criteria saved for next request:', response.criteria);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        type: 'assistant',
        content: 'عذراً، حدث خطأ في الاتصال. حاول مرة ثانية. 🔄',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, lastCriteria]);

  // ============================================
  // Select Search Mode
  // ============================================
  const selectSearchMode = useCallback(async (mode: 'exact' | 'similar') => {
    if (!currentCriteria) {
      console.warn('No criteria available for search');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔍 Starting search:', { mode, criteria: currentCriteria });
      
      const searchResponse = await searchProperties(currentCriteria, mode);
      
      setSearchResults(searchResponse.properties as Property[]);

      // إضافة رسالة النتائج
      const resultsMessage: Message = {
        id: `results-${Date.now()}`,
        type: 'assistant',
        content: searchResponse.message || `لقيت لك ${searchResponse.total_count} عقار! 🎉\n\nشوفهم على الخريطة 👇`,
      };
      setMessages(prev => [...prev, resultsMessage]);

      console.log('✅ Search completed:', { count: searchResponse.total_count });

    } catch (error) {
      console.error('Error searching properties:', error);
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        type: 'assistant',
        content: 'عذراً، حدث خطأ في البحث. حاول مرة ثانية. 🔄',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [currentCriteria]);

  // ============================================
  // Clear Chat
  // ============================================
  const clearChat = useCallback(() => {
    setMessages([]);
    setCurrentCriteria(undefined);
    setSearchResults([]);
    setLastCriteria(null); // [جديد] مسح المعايير السابقة
    setLastActionType(null);
    
    // إعادة رسالة الترحيب
    const welcomeMessage: Message = {
      id: `welcome-${Date.now()}`,
      type: 'assistant',
      content: 'مرحباً فيك من جديد! 🏡\n\nكيف أقدر أساعدك؟',
      actionType: 'GREETING',
    };
    setMessages([welcomeMessage]);
    
    console.log('🗑️ Chat cleared, criteria reset');
  }, []);

  // ============================================
  // [جديد] Clear Last Criteria Only
  // ============================================
  const clearLastCriteria = useCallback(() => {
    setLastCriteria(null);
    setLastActionType(null);
    console.log('🗑️ Last criteria cleared (starting fresh search)');
  }, []);

  // ============================================
  // Return
  // ============================================
  return {
    // State
    messages,
    isLoading,
    isBackendOnline,
    currentCriteria,
    searchResults,
    
    // [جديد] للمحادثة التفاعلية
    lastCriteria,
    lastActionType,
    
    // Actions
    sendMessage,
    selectSearchMode,
    clearChat,
    clearLastCriteria,
  };
}
