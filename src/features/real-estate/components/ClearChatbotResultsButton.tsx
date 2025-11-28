/**
 * ClearChatbotResultsButton Component
 * 
 * SOLID Principles:
 * - Single Responsibility: Button to clear chatbot results
 */

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ClearChatbotResultsButtonProps {
  isVisible: boolean;
  onClear: () => void;
}

export const ClearChatbotResultsButton = memo(function ClearChatbotResultsButton({
  isVisible,
  onClear,
}: ClearChatbotResultsButtonProps) {
  const { i18n } = useTranslation();

  if (!isVisible) return null;

  return (
    <div className="absolute bottom-24 right-4 z-10">
      <Button
        onClick={onClear}
        variant="outline"
        className="bg-white/95 backdrop-blur-sm shadow-lg"
      >
        <X className="h-4 w-4 mr-2" />
        {i18n.language === 'ar' ? 'إلغاء نتائج المساعد' : 'Clear Assistant Results'}
      </Button>
    </div>
  );
});
