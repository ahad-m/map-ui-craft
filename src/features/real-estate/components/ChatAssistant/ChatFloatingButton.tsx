/**
 * ChatFloatingButton Component
 * 
 * SOLID Principles:
 * - Single Responsibility: Renders the floating chat button
 */

import { memo } from 'react';
import { Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatFloatingButtonProps {
  onClick: () => void;
  isBackendOnline: boolean;
}

export const ChatFloatingButton = memo(function ChatFloatingButton({
  onClick,
  isBackendOnline,
}: ChatFloatingButtonProps) {
  return (
    <div className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-50 animate-float">
      <div className="relative">
        <Button
          onClick={onClick}
          className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-full shadow-elevated bg-gradient-to-br from-green-600 via-green-700 to-green-800 hover:from-green-700 hover:to-green-900 hover-lift relative group overflow-hidden border-2 border-white/30"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          <Bot className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-white relative z-10 group-hover:scale-125 transition-transform duration-300 drop-shadow-lg" />
          {isBackendOnline && (
            <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 h-3 w-3 sm:h-4 sm:w-4 bg-green-400 rounded-full border-2 border-white animate-pulse-glow shadow-glow" />
          )}
        </Button>
      </div>
    </div>
  );
});
