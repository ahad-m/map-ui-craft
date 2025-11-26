import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Category {
  icon: LucideIcon;
  label: string;
  searchTerm: string;
}

interface CategoryButtonsProps {
  categories: Category[];
  onCategoryClick: (category: Category) => void;
}

/**
 * CategoryButtons component
 * Displays a horizontal scrollable list of category buttons
 */
export const CategoryButtons = ({ categories, onCategoryClick }: CategoryButtonsProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((category) => (
        <Button
          key={category.label}
          variant="outline"
          size="sm"
          className="flex items-center gap-2 whitespace-nowrap rounded-full transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95"
          onClick={() => onCategoryClick(category)}
        >
          <category.icon className="h-4 w-4 transition-transform duration-200 group-hover:rotate-12" />
          {category.label}
        </Button>
      ))}
    </div>
  );
};
