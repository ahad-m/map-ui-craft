/**
 * Optimized ChatbotPanel Component
 * 
 * High-performance AI chatbot with memoization
 */

import { useState, useRef, useEffect, useCallback, memo } from "react";
import { Bot, X, RotateCcw, Mic, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  criteria?: any;
}

interface OptimizedChatbotPanelProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  messages: ChatMessage[];
  isLoading: boolean;
  isBackendOnline: boolean;
  onSendMessage: (message: string) => Promise<void>;
  onClearChat: () => void;
  onSearchModeSelect: (mode: "exact" | "similar") => void;
}

/**
 * Optimized ChatbotPanel with React.memo for performance
 */
export const OptimizedChatbotPanel = memo(({
  isOpen,
  onOpenChange,
  messages,
  isLoading,
  isBackendOnline,
  onSendMessage,
  onClearChat,
  onSearchModeSelect,
}: OptimizedChatbotPanelProps) => {
  const [chatInput, setChatInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Memoized voice input handler
  const handleVoiceInput = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast({
        title: "غير مدعوم",
        description: "متصفحك لا يدعم ميزة الإدخال الصوتي. جرب متصفح Chrome أو Edge.",
        variant: "destructive",
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ar-SA";
    recognition.continuous = false;
    recognition.interimResults = false;
    let finalTranscript = "";

    recognition.onstart = () => {
      setIsListening(true);
      setChatInput("...جاري الاستماع");
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      finalTranscript = transcript;
      setChatInput(transcript);
    };

    recognition.onnomatch = () => {
      toast({
        title: "لم يتم التعرف على الكلام",
        description: "حاول التحدث بوضوح أكثر.",
        variant: "destructive",
      });
    };

    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed") {
        toast({
          title: "المايكروفون محجوب",
          description: "تحتاج إلى السماح بالوصول إلى المايكروفون في إعدادات المتصفح (علامة القفل 🔒).",
          variant: "destructive",
        });
      } else {
        toast({
          title: "خطأ في الصوت",
          description: `حدث خطأ: ${event.error}. حاول مرة أخرى.`,
          variant: "destructive",
        });
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      if (finalTranscript === "") {
        setChatInput("");
      }
    };

    try {
      recognition.start();
    } catch (e) {
      setIsListening(false);
      setChatInput("");
      toast({
        title: "خطأ",
        description: "لم يتمكن من بدء خدمة التعرف على الصوت. قد تكون قيد الاستخدام.",
        variant: "destructive",
      });
    }
  }, []);

  // Memoized send message handler
  const handleSendMessage = useCallback(async () => {
    if (!chatInput.trim() || isLoading) return;
    
    const message = chatInput;
    setChatInput("");
    await onSendMessage(message);
  }, [chatInput, isLoading, onSendMessage]);

  // Memoized clear chat handler
  const handleClearChat = useCallback(() => {
    setChatInput("");
    onClearChat();
  }, [onClearChat]);

  // Memoized toggle handler
  const handleToggle = useCallback(() => {
    onOpenChange(!isOpen);
  }, [isOpen, onOpenChange]);

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 left-6 z-50 animate-float">
        <div className="relative">
          <Button
            onClick={handleToggle}
            className="h-16 w-16 rounded-full shadow-elevated bg-gradient-to-br from-green-600 via-green-700 to-green-800 hover:from-green-700 hover:to-green-900 hover-lift relative group overflow-hidden border-2 border-white/30"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            <Bot className="h-7 w-7 text-white relative z-10 group-hover:scale-125 transition-transform duration-300 drop-shadow-lg" />
            {isBackendOnline && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-green-400 rounded-full border-2 border-white animate-pulse-glow shadow-glow" />
            )}
          </Button>
        </div>
      </div>

      {/* Chatbot Panel */}
      {isOpen && (
        <div className="fixed bottom-24 left-6 w-96 h-[500px] glass-effect rounded-2xl shadow-elevated z-50 flex flex-col animate-slide-up overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 rounded-t-2xl flex items-center justify-between relative">
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer pointer-events-none"
              style={{ backgroundSize: "200% 100%" }}
            />
            <div className="flex items-center gap-2 relative z-10">
              <Bot className="h-5 w-5 animate-float" />
              <span className="font-semibold">المساعد العقاري الذكي</span>
            </div>
            <div className="flex items-center gap-2 relative z-10">
              {isBackendOnline ? (
                <span className="text-xs bg-green-500 px-2 py-1 rounded-full">متصل</span>
              ) : (
                <span className="text-xs bg-red-500 px-2 py-1 rounded-full">غير متصل</span>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearChat}
                className="text-white hover:bg-white/20 h-8 w-8 relative z-20"
                title="إعادة المحادثة"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggle}
                className="text-white hover:bg-white/20 h-8 w-8 relative z-20"
                title="إغلاق"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.type === "user" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    {msg.criteria && msg.type === "assistant" && (
                      <div className="mt-3 space-y-2">
                        <Button
                          onClick={() => onSearchModeSelect("exact")}
                          disabled={isLoading}
                          className="w-full bg-white text-green-600 hover:bg-gray-50 border border-green-600"
                          size="sm"
                        >
                          بس المطابق
                        </Button>
                        <Button
                          onClick={() => onSearchModeSelect("similar")}
                          disabled={isLoading}
                          className="w-full bg-green-600 text-white hover:bg-green-700"
                          size="sm"
                        >
                          اللي يشبهه
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-3">
                    <Loader2 className="h-5 w-5 animate-spin text-green-600" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder={isListening ? "...جاري الاستماع" : "اكتب طلبك هنا..."}
                disabled={isLoading || !isBackendOnline || isListening}
                className="flex-1"
                dir="rtl"
              />
              <Button
                onClick={handleVoiceInput}
                disabled={isLoading || !isBackendOnline || isListening}
                variant="outline"
                size="icon"
                className={cn(
                  "h-10 w-10",
                  isListening && "animate-pulse bg-green-100 border-green-300 text-green-700"
                )}
              >
                <Mic className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !isBackendOnline || !chatInput.trim() || isListening}
                className="bg-green-600 hover:bg-green-700"
                size="icon"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

OptimizedChatbotPanel.displayName = "OptimizedChatbotPanel";
