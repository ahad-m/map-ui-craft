import { useRef, useEffect } from 'react';
import { Bot, Send, Loader2, Mic, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';

interface Message {
  type: 'user' | 'assistant';
  content: string;
  criteria?: any;
  needs_clarification?: boolean;
  clarification_questions?: string[];
}

interface ChatBotProps {
  messages: Message[];
  chatInput: string;
  onChatInputChange: (value: string) => void;
  onSendMessage: () => void;
  onVoiceInput: () => void;
  onClearChat: () => void;
  onSearchModeSelection: (mode: 'exact' | 'similar') => void;
  isLoading: boolean;
  isListening: boolean;
  isBackendOnline: boolean;
}

/**
 * ChatBot component for real estate property search
 * Handles conversational search interface
 */
export const ChatBot = ({
  messages,
  chatInput,
  onChatInputChange,
  onSendMessage,
  onVoiceInput,
  onClearChat,
  onSearchModeSelection,
  isLoading,
  isListening,
  isBackendOnline,
}: ChatBotProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" />
          <div>
            <h3 className="font-semibold">مساعد البحث الذكي</h3>
            <p className="text-xs text-muted-foreground">
              {isBackendOnline ? '🟢 متصل' : '🔴 غير متصل'}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClearChat}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <Card
                className={`max-w-[80%] p-3 ${
                  msg.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                
                {/* Search mode selection buttons */}
                {msg.needs_clarification && msg.type === 'assistant' && (
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onSearchModeSelection('exact')}
                    >
                      بحث دقيق
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onSearchModeSelection('similar')}
                    >
                      بحث مشابه
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          ))}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <Card className="p-3 bg-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
              </Card>
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
            onKeyDown={handleKeyDown}
            placeholder="اكتب رسالتك..."
            disabled={isLoading || !isBackendOnline}
            className="flex-1"
          />
          <Button
            size="icon"
            variant="outline"
            onClick={onVoiceInput}
            disabled={isLoading || !isBackendOnline}
            className={isListening ? 'animate-pulse' : ''}
          >
            <Mic className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            onClick={onSendMessage}
            disabled={!chatInput.trim() || isLoading || !isBackendOnline}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
