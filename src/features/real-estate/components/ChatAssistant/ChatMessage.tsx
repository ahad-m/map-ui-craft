/**
 * ChatMessage Component
 * 
 * SOLID Principles:
 * - Single Responsibility: Renders a single chat message
 */

import { memo } from 'react';
import { Button } from '@/components/ui/button';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  criteria?: any;
}

interface ChatMessageProps {
  message: Message;
  onSearchModeSelection: (mode: 'exact' | 'similar') => void;
  isLoading: boolean;
}

export const ChatMessage = memo(function ChatMessage({
  message,
  onSearchModeSelection,
  isLoading,
}: ChatMessageProps) {
  const isUser = message.type === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg p-3 ${
          isUser ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-900'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        
        {/* Search mode selection buttons */}
        {message.criteria && !isUser && (
          <div className="mt-3 space-y-2">
            <Button
              onClick={() => onSearchModeSelection('exact')}
              disabled={isLoading}
              className="w-full bg-white text-green-600 hover:bg-gray-50 border border-green-600"
              size="sm"
            >
              بس المطابق
            </Button>
            <Button
              onClick={() => onSearchModeSelection('similar')}
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
  );
});
