/**
 * Hook للمحادثة الصوتية ثنائية الاتجاه
 * يدعم التحدث والاستماع للمساعد العقاري
 */
import { useState, useRef, useCallback, useEffect } from 'react';

interface VoiceAssistantConfig {
  lang?: string;
  voiceRate?: number;
  voicePitch?: number;
  autoSpeak?: boolean;
}

export function useVoiceAssistant(config: VoiceAssistantConfig = {}) {
  const {
    lang = 'ar-SA',
    voiceRate = 0.9,
    voicePitch = 1,
    autoSpeak = true
  } = config;

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(autoSpeak);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [speechSupported, setSpeechSupported] = useState(false);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // تهيئة Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // فحص دعم Speech Recognition
      const SpeechRecognition = (window as any).webkitSpeechRecognition || 
                                (window as any).SpeechRecognition;
      
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = lang;
        recognitionRef.current.maxAlternatives = 1;
        setSpeechSupported(true);
      }

      // فحص دعم Speech Synthesis
      if ('speechSynthesis' in window) {
        synthRef.current = window.speechSynthesis;
        loadVoices();
      }
    }
  }, [lang]);

  // تحميل الأصوات المتاحة
  const loadVoices = useCallback(() => {
    if (!synthRef.current) return;

    const setVoices = () => {
      const voices = synthRef.current!.getVoices();
      
      // البحث عن أفضل صوت عربي
      const arabicVoices = voices.filter(voice => 
        voice.lang.includes('ar') || voice.lang.includes('AR')
      );
      
      // تفضيل الأصوات السعودية أو الخليجية
      const preferredVoice = 
        arabicVoices.find(voice => voice.lang.includes('SA')) ||
        arabicVoices.find(voice => voice.lang.includes('AE')) ||
        arabicVoices.find(voice => voice.lang.includes('EG')) ||
        arabicVoices[0];
      
      if (preferredVoice) {
        setSelectedVoice(preferredVoice);
        console.log('تم اختيار الصوت:', preferredVoice.name);
      }
    };

    // بعض المتصفحات تحتاج event listener
    if (synthRef.current.onvoiceschanged !== undefined) {
      synthRef.current.onvoiceschanged = setVoices;
    }
    setVoices();
  }, []);

  // بدء الاستماع
  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return;

    // إيقاف أي كلام جاري
    stopSpeaking();

    recognitionRef.current.onstart = () => {
      console.log('بدأ الاستماع...');
      setIsListening(true);
      setTranscript('');
    };

    recognitionRef.current.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      // عرض النص المؤقت
      if (interimTranscript) {
        setTranscript(interimTranscript);
      }

      // النص النهائي
      if (finalTranscript) {
        setTranscript(finalTranscript);
        console.log('النص النهائي:', finalTranscript);
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('خطأ في التعرف على الصوت:', event.error);
      
      let errorMessage = '';
      switch(event.error) {
        case 'no-speech':
          errorMessage = 'لم أسمع صوتك، حاول مرة أخرى';
          break;
        case 'audio-capture':
          errorMessage = 'لا يمكن الوصول للمايكروفون';
          break;
        case 'not-allowed':
          errorMessage = 'يجب السماح باستخدام المايكروفون';
          break;
        case 'network':
          errorMessage = 'خطأ في الاتصال بالإنترنت';
          break;
        default:
          errorMessage = 'حدث خطأ، حاول مرة أخرى';
      }
      
      if (voiceEnabled) {
        speak(errorMessage);
      }
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      console.log('انتهى الاستماع');
      setIsListening(false);
    };

    try {
      recognitionRef.current.start();
      
      // رسالة ترحيبية
      if (voiceEnabled) {
        speak('أنا أسمعك، تفضل');
      }
    } catch (error) {
      console.error('خطأ في بدء التعرف على الصوت:', error);
      setIsListening(false);
    }
  }, [isListening, voiceEnabled]);

  // إيقاف الاستماع
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  // التحدث (Text-to-Speech)
  const speak = useCallback((text: string, options: {
    onStart?: () => void;
    onEnd?: () => void;
  } = {}) => {
    if (!synthRef.current || !voiceEnabled) return;

    // تنظيف النص من الرموز
    const cleanText = text
      .replace(/[👍✓🏡😊🎉🎊😔]/g, '')  // إزالة الإيموجي
      .replace(/[•▪▸◆]/g, '')             // إزالة الرموز
      .replace(/\n+/g, '. ')               // تحويل الأسطر لنقاط
      .replace(/\.+/g, '.')                // إزالة النقاط المتكررة
      .trim();

    if (!cleanText) return;

    // إيقاف أي كلام سابق
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = lang;
    utterance.rate = voiceRate;
    utterance.pitch = voicePitch;
    utterance.volume = 1;

    // استخدام الصوت المحدد
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    // معالجات الأحداث
    utterance.onstart = () => {
      setIsSpeaking(true);
      options.onStart?.();
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      options.onEnd?.();
    };

    utterance.onerror = (event) => {
      console.error('خطأ في النطق:', event);
      setIsSpeaking(false);
    };

    // بدء النطق
    synthRef.current.speak(utterance);
  }, [lang, voiceRate, voicePitch, selectedVoice, voiceEnabled]);

  // إيقاف التحدث
  const stopSpeaking = useCallback(() => {
    if (synthRef.current && isSpeaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, [isSpeaking]);

  // إيقاف مؤقت/استئناف
  const pauseSpeaking = useCallback(() => {
    if (synthRef.current && isSpeaking) {
      synthRef.current.pause();
    }
  }, [isSpeaking]);

  const resumeSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.resume();
    }
  }, []);

  // تبديل الاستماع
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // تبديل الصوت
  const toggleVoice = useCallback(() => {
    setVoiceEnabled(prev => !prev);
  }, []);

  return {
    // الحالات
    isListening,
    isSpeaking,
    transcript,
    voiceEnabled,
    speechSupported,
    selectedVoice,
    
    // الدوال الأساسية
    startListening,
    stopListening,
    toggleListening,
    speak,
    stopSpeaking,
    pauseSpeaking,
    resumeSpeaking,
    
    // دوال التحكم
    toggleVoice,
    setVoiceEnabled,
    
    // معلومات إضافية
    availableVoices: synthRef.current?.getVoices() || [],
  };
}
