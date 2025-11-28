/**
 * useChatAssistant Hook
 * 
 * SOLID Principles:
 * - Single Responsibility: Wraps chat functionality
 * - Open/Closed: Extends useRealEstateAssistant without modifying it
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRealEstateAssistant } from '@/hooks/useRealEstateAssistant';
import { toast } from '@/hooks/use-toast';
import type { Property, PropertyFilters, SearchCriteria } from '../types';

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
  }>;
  isLoading: boolean;
  isBackendOnline: boolean;
  currentCriteria?: SearchCriteria;
  
  // Actions
  setIsChatOpen: (open: boolean) => void;
  setChatInput: (input: string) => void;
  handleSendMessage: () => Promise<void>;
  handleSearchModeSelection: (mode: 'exact' | 'similar') => Promise<void>;
  handleVoiceInput: () => void;
  clearChat: () => void;
  
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
    sendMessage,
    selectSearchMode,
    clearChat: clearChatBase,
  } = useRealEstateAssistant();

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
   * Send message to assistant
   */
  const handleSendMessage = useCallback(async () => {
    if (!chatInput.trim() || isLoading) return;
    await sendMessage(chatInput);
    setChatInput('');
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
    
    // Actions
    setIsChatOpen,
    setChatInput,
    handleSendMessage,
    handleSearchModeSelection,
    handleVoiceInput,
    clearChat,
    
    // Refs
    messagesEndRef,
  };
}
