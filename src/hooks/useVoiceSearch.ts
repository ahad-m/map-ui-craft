import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

/**
 * Custom hook for voice search functionality
 */
export const useVoiceSearch = (onResult: (transcript: string) => void) => {
  const [isListening, setIsListening] = useState(false);

  const startListening = () => {
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

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
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
    };

    try {
      recognition.start();
    } catch (e) {
      setIsListening(false);
      toast({
        title: 'خطأ',
        description: 'لم يتمكن من بدء خدمة التعرف على الصوت. قد تكون قيد الاستخدام.',
        variant: 'destructive',
      });
    }
  };

  return {
    isListening,
    startListening,
  };
};
