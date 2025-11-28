/**
 * ChatPanel Component
 * 
 * SOLID Principles:
 * - Single Responsibility: Handles the chat UI
 * - Dependency Inversion: Receives chat logic through props/hooks
 */

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
    <div className="fixed bottom-24 left-6 w-96 h-[500px] glass-effect rounded-2xl shadow-elevated z-50 flex flex-col animate-slide-up overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 rounded-t-2xl flex items-center justify-between relative">
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer pointer-events-none"
          style={{ backgroundSize: '200% 100%' }}
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
            onClick={onClearChat}
            className="text-white hover:bg-white/20 h-8 w-8 relative z-20"
            title="إعادة المحادثة"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
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
            <ChatMessage
              key={msg.id}
              message={msg}
              onSearchModeSelection={onSearchModeSelection}
              isLoading={isLoading}
            />
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
            onChange={(e) => onChatInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isListening ? '...جاري الاستماع' : 'اكتب طلبك هنا...'}
            disabled={isLoading || !isBackendOnline || isListening}
            className="flex-1"
            dir="rtl"
          />
          <Button
            onClick={onVoiceInput}
            disabled={isLoading || !isBackendOnline || isListening}
            variant="outline"
            size="icon"
            className={cn(
              'h-10 w-10',
              isListening && 'animate-pulse bg-green-100 border-green-300 text-green-700'
            )}
          >
            <Mic className="h-4 w-4" />
          </Button>
          <Button
            onClick={onSendMessage}
            disabled={isLoading || !isBackendOnline || !chatInput.trim() || isListening}
            className="bg-green-600 hover:bg-green-700"
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
});
