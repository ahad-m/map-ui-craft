
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Bot, X, RotateCcw, Send, Mic, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ChatMessage } from './ChatMessage';
import { ChatFloatingButton } from './ChatFloatingButton';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  criteria?: any;
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  isLoading: boolean;
  isBackendOnline: boolean;
  chatInput: string;
  onChatInputChange: (value: string) => void;
  onSendMessage: () => void;
  onSearchModeSelection: (mode: 'exact' | 'similar') => void;
  onVoiceInput: () => void;
  onClearChat: () => void;
  isListening: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export const ChatPanel = memo(function ChatPanel({
  isOpen,
  onClose,
  messages,
  isLoading,
  isBackendOnline,
  chatInput,
  onChatInputChange,
  onSendMessage,
  onSearchModeSelection,
  onVoiceInput,
  onClearChat,
  isListening,
  messagesEndRef,
}: ChatPanelProps) {
  const { t } = useTranslation();

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-x-2 bottom-20 sm:inset-auto sm:bottom-24 sm:left-4 md:left-6 w-auto sm:w-80 md:w-96 h-[60vh] sm:h-[450px] md:h-[500px] max-h-[calc(100vh-120px)] glass-effect rounded-2xl shadow-elevated z-50 flex flex-col animate-slide-up overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-3 sm:p-4 rounded-t-2xl flex items-center justify-between relative">
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer pointer-events-none"
          style={{ backgroundSize: '200% 100%' }}
        />
        <div className="flex items-center gap-2 relative z-10">
          <Bot className="h-4 w-4 sm:h-5 sm:w-5 animate-float" />
          <span className="font-semibold text-sm sm:text-base">المساعد العقاري الذكي</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 relative z-10">
          {isBackendOnline ? (
            <span className="text-[10px] sm:text-xs bg-green-500 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">متصل</span>
          ) : (
            <span className="text-[10px] sm:text-xs bg-red-500 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">غير متصل</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClearChat}
            className="text-white hover:bg-white/20 h-7 w-7 sm:h-8 sm:w-8 relative z-20"
            title="إعادة المحادثة"
          >
            <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/20 h-7 w-7 sm:h-8 sm:w-8 relative z-20"
            title="إغلاق"
          >
            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3 sm:p-4">
        <div className="space-y-3 sm:space-y-4">
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              onSearchModeSelection={onSearchModeSelection}
              isLoading={isLoading}
            />
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-2 sm:p-3">
                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-green-600" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 sm:p-4 border-t">
        <div className="flex gap-1.5 sm:gap-2">
          <Input
            value={chatInput}
            onChange={(e) => onChatInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isListening ? '...جاري الاستماع' : 'اكتب طلبك هنا...'}
            disabled={isLoading || !isBackendOnline || isListening}
            className="flex-1 h-9 sm:h-10 text-sm"
            dir="rtl"
          />
          <Button
            onClick={onVoiceInput}
            disabled={isLoading || !isBackendOnline || isListening}
            variant="outline"
            size="icon"
            className={cn(
              'h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0',
              isListening && 'animate-pulse bg-green-100 border-green-300 text-green-700'
            )}
          >
            <Mic className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
          <Button
            onClick={onSendMessage}
            disabled={isLoading || !isBackendOnline || !chatInput.trim() || isListening}
            className="bg-green-600 hover:bg-green-700 h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
});
