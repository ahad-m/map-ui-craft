/**
 * SearchBar Component
 * 
 * A comprehensive search input component with integrated voice search and clear functionality.
 * Supports both LTR and RTL layouts for multilingual applications.
 * 
 * Features:
 * - Text input with search icon
 * - Voice search button (microphone icon)
 * - Clear button (X icon) - appears only when text is entered
 * - Enter key support for quick search
 * - RTL/LTR layout support
 * 
 * @module components/map/SearchBar
 */

import { useRef } from 'react';
import { Search, Mic, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * Props for SearchBar component
 */
interface SearchBarProps {
  /** Current search query value */
  searchQuery: string;
  /** Callback when search query changes */
  onSearchChange: (value: string) => void;
  /** Callback to execute search */
  onSearch: () => void;
  /** Callback to clear search input */
  onClear: () => void;
  /** Callback to activate voice search */
  onVoiceSearch: () => void;
  /** Placeholder text for input field */
  placeholder: string;
  /** Whether to use right-to-left layout */
  isRTL: boolean;
}

/**
 * SearchBar Component
 * 
 * Provides a feature-rich search input with voice capabilities and clear functionality.
 * Adapts layout based on language direction (RTL/LTR).
 * 
 * @param props - Component props
 * @returns Rendered search bar component
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
  // Reference to input element for programmatic focus if needed
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Handle keyboard events
   * Triggers search when Enter key is pressed
   * 
   * @param e - Keyboard event
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="flex-1 relative">
      {/* Search icon - positioned based on language direction */}
      <Search 
        className={`absolute top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground ${
          isRTL ? 'right-3' : 'left-3'
        } pointer-events-none`} 
      />
      
      {/* Main search input field */}
      <Input
        ref={inputRef}
        placeholder={placeholder}
        className={`h-12 bg-card ${isRTL ? 'pr-10 pl-20' : 'pl-10 pr-20'}`}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      
      {/* Clear button - only visible when text exists */}
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
      
      {/* Voice search button - always visible */}
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
