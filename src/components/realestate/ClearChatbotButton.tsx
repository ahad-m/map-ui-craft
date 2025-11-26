/**
 * Clear Chatbot Button Component
 * 
 * Button to clear chatbot search results and reset related filters.
 */

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClearChatbotButtonProps {
  isVisible: boolean;
  language: string;
  onClear: () => void;
}

export const ClearChatbotButton = ({
  isVisible,
  language,
  onClear,
}: ClearChatbotButtonProps) => {
  if (!isVisible) return null;

  return (
    <div className="absolute bottom-24 right-4 z-10">
      <Button
        onClick={onClear}
        variant="outline"
        className="bg-white/95 backdrop-blur-sm shadow-lg"
      >
        <X className="h-4 w-4 mr-2" />
        {language === "ar" ? "إلغاء نتائج المساعد" : "Clear Assistant Results"}
      </Button>
    </div>
  );
};
