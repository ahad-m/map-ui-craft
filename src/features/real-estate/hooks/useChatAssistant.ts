/**
 * useChatAssistant Hook
 * 
 * SOLID Principles:
 * - Single Responsibility: Wraps chat functionality
 * - Open/Closed: Extends useRealEstateAssistant without modifying it
 * 
 * النسخة المحدثة: دعم المحادثة التفاعلية (Multi-Turn)
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRealEstateAssistant } from '@/hooks/useRealEstateAssistant';
import { toast } from '@/hooks/use-toast';
import type { Property, PropertyFilters, SearchCriteria, ActionType } from '../types';

interface UseChatAssistantProps {
  onResultsReceived: (properties: Property[]) => void;
  onFiltersSync: (criteria: SearchCriteria) => void;
}

interface UseChatAssistantReturn {
  // State
  isChatOpen: boolean;
  chatInput: string;
  isListening: boolean;
  
  // From useRealEstateAssistant
  messages: Array<{
    id: string;
    type: 'user' | 'assistant';
    content: string;
    criteria?: SearchCriteria;
    actionType?: ActionType;
    changesSummary?: string | null;
  }>;
  isLoading: boolean;
  isBackendOnline: boolean;
  currentCriteria?: SearchCriteria;
  
  // [جديد] للمحادثة التفاعلية
  lastCriteria: SearchCriteria | null;
  lastActionType: ActionType | null;
  isModifyingPrevious: boolean;
  
  // Actions
  setIsChatOpen: (open: boolean) => void;
  setChatInput: (input: string) => void;
  handleSendMessage: () => Promise<void>;
  handleSearchModeSelection: (mode: 'exact' | 'similar') => Promise<void>;
  handleVoiceInput: () => void;
  clearChat: () => void;
  clearLastCriteria: () => void;
  
  // Refs
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export function useChatAssistant({
  onResultsReceived,
  onFiltersSync,
}: UseChatAssistantProps): UseChatAssistantReturn {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isLoading,
    isBackendOnline,
    currentCriteria,
    searchResults,
    lastCriteria,
    lastActionType,
    sendMessage,
    selectSearchMode,
    clearChat: clearChatBase,
    clearLastCriteria: clearLastCriteriaBase,
  } = useRealEstateAssistant();

  // [جديد] حساب ما إذا كنا في وضع التعديل
  const isModifyingPrevious = lastCriteria !== null;

  /**
   * Auto-scroll messages
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Sync results when received
   */
  useEffect(() => {
    if (searchResults.length > 0) {
      onResultsReceived(searchResults as unknown as Property[]);
      
      if (currentCriteria) {
        onFiltersSync(currentCriteria);
      }
    }
  }, [searchResults, currentCriteria, onResultsReceived, onFiltersSync]);

  /**
   * [جديد] إظهار toast عند التعديل
   */
  useEffect(() => {
    if (lastActionType === 'UPDATE_CRITERIA') {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.changesSummary) {
        toast({
          title: '✅ تم التعديل',
          description: lastMessage.changesSummary,
        });
      }
    }
  }, [lastActionType, messages]);

  /**
   * Send message to assistant
   */
  const handleSendMessage = useCallback(async () => {
    if (!chatInput.trim() || isLoading) return;
    
    const messageToSend = chatInput;
    setChatInput(''); // مسح الحقل فوراً
    
    await sendMessage(messageToSend);
  }, [chatInput, isLoading, sendMessage]);

  /**
   * Handle search mode selection (exact/similar)
   */
  const handleSearchModeSelection = useCallback(
    async (mode: 'exact' | 'similar') => {
      await selectSearchMode(mode);
    },
    [selectSearchMode]
  );

  /**
   * Handle voice input
   */
  const handleVoiceInput = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast({
        title: 'غير مدعوم',
        description: 'متصفحك لا يدعم ميزة الإدخال الصوتي. جرب متصفح Chrome أو Edge.',
        variant: 'destructive',
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ar-SA';
    recognition.continuous = false;
    recognition.interimResults = false;

    let finalTranscript = '';

    recognition.onstart = () => {
      setIsListening(true);
      setChatInput('...جاري الاستماع');
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      finalTranscript = transcript;
      setChatInput(transcript);
    };

    recognition.onnomatch = () => {
      toast({
        title: 'لم يتم التعرف على الكلام',
        description: 'حاول التحدث بوضوح أكثر.',
        variant: 'destructive',
      });
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed') {
        toast({
          title: 'المايكروفون محجوب',
          description: 'تحتاج إلى السماح بالوصول إلى المايكروفون في إعدادات المتصفح (علامة القفل 🔒).',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'خطأ في الصوت',
          description: `حدث خطأ: ${event.error}. حاول مرة أخرى.`,
          variant: 'destructive',
        });
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      if (finalTranscript === '') {
        setChatInput('');
      }
    };

    try {
      recognition.start();
    } catch (e) {
      setIsListening(false);
      setChatInput('');
      toast({
        title: 'خطأ',
        description: 'لم يتمكن من بدء خدمة التعرف على الصوت. قد تكون قيد الاستخدام.',
        variant: 'destructive',
      });
    }
  }, []);

  /**
   * Clear chat and reset input
   */
  const clearChat = useCallback(() => {
    clearChatBase();
    setChatInput('');
  }, [clearChatBase]);

  /**
   * [جديد] Clear last criteria only (لبدء بحث جديد)
   */
  const clearLastCriteria = useCallback(() => {
    clearLastCriteriaBase();
    toast({
      title: '🆕 بحث جديد',
      description: 'تم إعادة تعيين البحث. ابدأ طلب جديد.',
    });
  }, [clearLastCriteriaBase]);

  return {
    // State
    isChatOpen,
    chatInput,
    isListening,
    
    // From useRealEstateAssistant
    messages,
    isLoading,
    isBackendOnline,
    currentCriteria,
    
    // [جديد] للمحادثة التفاعلية
    lastCriteria,
    lastActionType,
    isModifyingPrevious,
    
    // Actions
    setIsChatOpen,
    setChatInput,
    handleSendMessage,
    handleSearchModeSelection,
    handleVoiceInput,
    clearChat,
    clearLastCriteria,
    
    // Refs
    messagesEndRef,
  };
}
