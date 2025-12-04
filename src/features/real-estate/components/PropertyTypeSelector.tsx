/**
 * PropertyTypeSelector Component
 * 
 * A dropdown/select component for choosing property types.
 * Uses the exact Arabic values stored in the database.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Home, ChevronDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PROPERTY_TYPES, type PropertyType } from '../types/bestValue';

interface PropertyTypeSelectorProps {
  /** Currently selected property type */
  value: PropertyType | null;
  /** Callback when selection changes */
  onChange: (value: PropertyType | null) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether to show "All types" option */
  showAllOption?: boolean;
  /** Custom class name */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Property type selector with Arabic values
 */
export function PropertyTypeSelector({
  value,
  onChange,
  placeholder,
  showAllOption = true,
  className = '',
  disabled = false,
}: PropertyTypeSelectorProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const defaultPlaceholder = t(
    'marketInsights.bestValue.selectPropertyType',
    'اختر نوع العقار'
  );

  const allTypesLabel = t('marketInsights.bestValue.allPropertyTypes', 'جميع الأنواع');

  return (
    <Select
      value={value || 'all'}
      onValueChange={(v) => onChange(v === 'all' ? null : (v as PropertyType))}
      disabled={disabled}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <SelectTrigger className={`w-full ${className}`}>
        <div className="flex items-center gap-2">
          <Home className="h-4 w-4 text-muted-foreground" />
          <SelectValue placeholder={placeholder || defaultPlaceholder} />
        </div>
      </SelectTrigger>
      <SelectContent>
        {showAllOption && (
          <SelectItem value="all">
            <span className="flex items-center gap-2">
              {allTypesLabel}
            </span>
          </SelectItem>
        )}
        {PROPERTY_TYPES.map((type) => (
          <SelectItem key={type.value} value={type.value}>
            <span className="flex items-center gap-2">
              {isRTL ? type.labelAr : type.labelEn}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * Compact property type selector as buttons/chips
 */
export function PropertyTypeChips({
  value,
  onChange,
  className = '',
}: Omit<PropertyTypeSelectorProps, 'placeholder' | 'showAllOption'>) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {/* All types chip */}
      <button
        type="button"
        onClick={() => onChange(null)}
        className={`
          px-2.5 py-1 rounded-full text-xs font-medium transition-all
          ${!value
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'bg-muted hover:bg-muted/80 text-muted-foreground'
          }
        `}
      >
        {t('marketInsights.bestValue.allPropertyTypes', 'الكل')}
      </button>
      
      {/* Property type chips */}
      {PROPERTY_TYPES.map((type) => (
        <button
          key={type.value}
          type="button"
          onClick={() => onChange(type.value)}
          className={`
            px-2.5 py-1 rounded-full text-xs font-medium transition-all
            ${value === type.value
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            }
          `}
        >
          {isRTL ? type.labelAr : type.labelEn}
        </button>
      ))}
    </div>
  );
}
