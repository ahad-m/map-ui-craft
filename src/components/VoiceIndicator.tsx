/**
 * مؤشر بصري للصوت
 * يعرض حالة الاستماع والتحدث
 */
import { cn } from '@/lib/utils';
import { Mic, Volume2, MicOff } from 'lucide-react';

interface VoiceIndicatorProps {
  isListening: boolean;
  isSpeaking: boolean;
  voiceEnabled: boolean;
  className?: string;
}

export function VoiceIndicator({ 
  isListening, 
  isSpeaking, 
  voiceEnabled,
  className 
}: VoiceIndicatorProps) {
  
  if (!isListening && !isSpeaking) return null;

  return (
    <div className={cn(
      "fixed top-4 right-4 z-50",
      "bg-white/95 backdrop-blur-sm rounded-full",
      "px-4 py-2 shadow-lg border",
      "flex items-center gap-2",
      "animate-in fade-in slide-in-from-top-2",
      className
    )}>
      {isListening && (
        <>
          <Mic className="h-4 w-4 text-red-500 animate-pulse" />
          <div className="flex gap-1">
            <span className="w-1 h-4 bg-red-500 animate-pulse rounded-full" />
            <span className="w-1 h-4 bg-red-500 animate-pulse rounded-full" style={{ animationDelay: '0.2s' }} />
            <span className="w-1 h-4 bg-red-500 animate-pulse rounded-full" style={{ animationDelay: '0.4s' }} />
          </div>
          <span className="text-sm text-red-600 font-medium">
            جاري الاستماع...
          </span>
        </>
      )}
      
      {isSpeaking && !isListening && (
        <>
          <Volume2 className="h-4 w-4 text-blue-500 animate-pulse" />
          <div className="flex gap-1">
            <span className="w-1 h-3 bg-blue-500 animate-bounce rounded-full" />
            <span className="w-1 h-4 bg-blue-500 animate-bounce rounded-full" style={{ animationDelay: '0.1s' }} />
            <span className="w-1 h-5 bg-blue-500 animate-bounce rounded-full" style={{ animationDelay: '0.2s' }} />
            <span className="w-1 h-4 bg-blue-500 animate-bounce rounded-full" style={{ animationDelay: '0.3s' }} />
            <span className="w-1 h-3 bg-blue-500 animate-bounce rounded-full" style={{ animationDelay: '0.4s' }} />
          </div>
          <span className="text-sm text-blue-600 font-medium">
            المساعد يتحدث...
          </span>
        </>
      )}
    </div>
  );
}

/**
 * زر التحكم بالصوت
 * للتبديل بين تفعيل/تعطيل الصوت
 */
interface VoiceControlButtonProps {
  voiceEnabled: boolean;
  onToggle: () => void;
  className?: string;
}

export function VoiceControlButton({ 
  voiceEnabled, 
  onToggle,
  className 
}: VoiceControlButtonProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "p-2 rounded-lg transition-all",
        "hover:bg-gray-100",
        voiceEnabled 
          ? "text-blue-600 bg-blue-50" 
          : "text-gray-400 bg-gray-50",
        className
      )}
      title={voiceEnabled ? "تعطيل الصوت" : "تفعيل الصوت"}
    >
      {voiceEnabled ? (
        <Volume2 className="h-5 w-5" />
      ) : (
        <MicOff className="h-5 w-5" />
      )}
    </button>
  );
}
