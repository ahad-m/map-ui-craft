import { useRef } from 'react';
import { Search, Mic, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
  onVoiceSearch: () => void;
  placeholder: string;
  isRTL: boolean;
}

/**
 * SearchBar component for location search
 * Handles text input, voice search, and clear functionality
 */
export const SearchBar = ({
  searchQuery,
  onSearchChange,
  onSearch,
  onClear,
  onVoiceSearch,
  placeholder,
  isRTL,
}: SearchBarProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="flex-1 relative">
      <Search 
        className={`absolute top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground ${
          isRTL ? 'right-3' : 'left-3'
        } pointer-events-none`} 
      />
      <Input
        ref={inputRef}
        placeholder={placeholder}
        className={`h-12 bg-card ${isRTL ? 'pr-10 pl-20' : 'pl-10 pr-20'}`}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      
      {/* Clear button */}
      {searchQuery && (
        <Button
          size="icon"
          variant="ghost"
          className={`absolute top-1/2 -translate-y-1/2 h-8 w-8 ${
            isRTL ? 'left-10' : 'right-10'
          }`}
          onClick={onClear}
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </Button>
      )}
      
      {/* Voice search button */}
      <Button
        size="icon"
        variant="ghost"
        className={`absolute top-1/2 -translate-y-1/2 h-8 w-8 ${
          isRTL ? 'left-1' : 'right-1'
        }`}
        onClick={onVoiceSearch}
      >
        <Mic className="h-5 w-5 text-muted-foreground" />
      </Button>
    </div>
  );
};
