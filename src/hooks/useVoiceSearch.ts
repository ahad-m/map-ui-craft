/**
 * Voice Search Hook
 * 
 * Custom React hook for implementing voice search functionality using the Web Speech API.
 * Provides speech recognition for Arabic language with proper error handling and user feedback.
 * 
 * Features:
 * - Arabic speech recognition (ar-SA)
 * - Browser compatibility checking
 * - Microphone permission handling
 * - Real-time listening state
 * - User-friendly error messages
 * 
 * @module hooks/useVoiceSearch
 */

import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

/**
 * Custom hook for voice search functionality
 * 
 * Implements speech-to-text conversion using the Web Speech API.
 * Handles browser compatibility, permissions, and error states.
 * 
 * **Browser Support:**
 * - Chrome/Edge: Full support
 * - Safari: Partial support
 * - Firefox: Not supported (as of 2024)
 * 
 * **Permissions:**
 * Requires microphone access. Users will be prompted on first use.
 * 
 * @param onResult - Callback function that receives the transcribed text
 * @returns Object containing listening state and start function
 * 
 * @example
 * const { isListening, startListening } = useVoiceSearch((transcript) => {
 *   console.log("User said:", transcript);
 *   setSearchQuery(transcript);
 * });
 * 
 * // In component JSX
 * <Button onClick={startListening} disabled={isListening}>
 *   {isListening ? "جاري الاستماع..." : "بحث صوتي"}
 * </Button>
 */
export const useVoiceSearch = (onResult: (transcript: string) => void) => {
  // Track whether speech recognition is currently active
  const [isListening, setIsListening] = useState(false);

  /**
   * Start voice recognition process
   * 
   * Initializes the speech recognition service and handles all stages:
   * - Browser compatibility check
   * - Service initialization
   * - Result processing
   * - Error handling
   * - Cleanup
   */
  const startListening = () => {
    // Get SpeechRecognition API (with vendor prefixes for compatibility)
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    // Check if browser supports speech recognition
    if (!SpeechRecognition) {
      toast({
        title: 'غير مدعوم',
        description: 'متصفحك لا يدعم ميزة الإدخال الصوتي. جرب متصفح Chrome أو Edge.',
        variant: 'destructive',
      });
      return;
    }

    // Create new recognition instance
    const recognition = new SpeechRecognition();
    
    // Configure recognition settings
    recognition.lang = 'ar-SA'; // Arabic (Saudi Arabia)
    recognition.continuous = false; // Stop after first result
    recognition.interimResults = false; // Only return final results

    /**
     * Handle recognition start
     * Called when speech recognition service begins listening
     */
    recognition.onstart = () => {
      setIsListening(true);
    };

    /**
     * Handle recognition results
     * Called when speech is successfully recognized
     * 
     * @param event - Speech recognition event containing results
     */
    recognition.onresult = (event: any) => {
      // Extract transcript from first result
      const transcript = event.results[0][0].transcript;
      // Pass transcript to parent component
      onResult(transcript);
    };

    /**
     * Handle no match scenario
     * Called when speech is detected but not understood
     */
    recognition.onnomatch = () => {
      toast({
        title: 'لم يتم التعرف على الكلام',
        description: 'حاول التحدث بوضوح أكثر.',
        variant: 'destructive',
      });
    };

    /**
     * Handle recognition errors
     * Provides specific error messages based on error type
     * 
     * @param event - Error event containing error details
     */
    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed') {
        // Microphone permission denied
        toast({
          title: 'المايكروفون محجوب',
          description: 'تحتاج إلى السماح بالوصول إلى المايكروفون في إعدادات المتصفح (علامة القفل 🔒).',
          variant: 'destructive',
        });
      } else {
        // Other recognition errors
        toast({
          title: 'خطأ في الصوت',
          description: `حدث خطأ: ${event.error}. حاول مرة أخرى.`,
          variant: 'destructive',
        });
      }
    };

    /**
     * Handle recognition end
     * Called when speech recognition service stops listening
     * Resets listening state
     */
    recognition.onend = () => {
      setIsListening(false);
    };

    // Attempt to start recognition
    try {
      recognition.start();
    } catch (e) {
      // Handle case where recognition is already running
      setIsListening(false);
      toast({
        title: 'خطأ',
        description: 'لم يتمكن من بدء خدمة التعرف على الصوت. قد تكون قيد الاستخدام.',
        variant: 'destructive',
      });
    }
  };

  return {
    /** Whether speech recognition is currently active */
    isListening,
    /** Function to start speech recognition */
    startListening,
  };
};
