/**
 * CategoryButtons Component
 * 
 * Displays a horizontal scrollable list of category buttons for quick navigation.
 * Each button includes an icon and label with smooth hover animations.
 * 
 * Features:
 * - Horizontal scrollable layout
 * - Icon with animated rotation on hover
 * - Scale animation on hover and click
 * - Rounded pill-shaped buttons
 * - Hidden scrollbar for clean appearance
 * 
 * @module components/map/CategoryButtons
 */

import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Category data structure
 */
interface Category {
  /** Icon component from lucide-react */
  icon: LucideIcon;
  /** Display label for the category */
  label: string;
  /** Search term associated with category */
  searchTerm: string;
}

/**
 * Props for CategoryButtons component
 */
interface CategoryButtonsProps {
  /** Array of category objects to display */
  categories: Category[];
  /** Callback when a category is clicked */
  onCategoryClick: (category: Category) => void;
}

/**
 * CategoryButtons Component
 * 
 * Renders a scrollable list of category buttons with icons and labels.
 * Includes smooth animations for better user interaction feedback.
 * 
 * @param props - Component props
 * @returns Rendered category buttons list
 */
export const CategoryButtons = ({ categories, onCategoryClick }: CategoryButtonsProps) => {
  return (
    // Horizontal scrollable container with hidden scrollbar
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((category) => (
        <Button
          key={category.label}
          variant="outline"
          size="sm"
          // Animation classes:
          // - hover:scale-105: Slight scale up on hover
          // - hover:shadow-md: Add shadow on hover
          // - active:scale-95: Scale down on click for tactile feedback
          className="flex items-center gap-2 whitespace-nowrap rounded-full transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95"
          onClick={() => onCategoryClick(category)}
        >
          {/* Icon with rotation animation on hover */}
          <category.icon className="h-4 w-4 transition-transform duration-200 group-hover:rotate-12" />
          {/* Category label */}
          {category.label}
        </Button>
      ))}
    </div>
  );
};
