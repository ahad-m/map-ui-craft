import { LucideIcon } from 'lucide-react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

interface ExploreCategory {
  icon: LucideIcon;
  label: string;
  nameAr: string;
}

interface ExploreSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  categories: ExploreCategory[];
  onCategorySelect: (label: string) => void;
  title: string;
  triggerLabel: string;
}

/**
 * ExploreSheet component
 * Displays explore categories in a bottom sheet
 */
export const ExploreSheet = ({
  isOpen,
  onOpenChange,
  categories,
  onCategorySelect,
  title,
  triggerLabel,
}: ExploreSheetProps) => {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" className="flex flex-col items-center gap-1 h-auto py-2 px-4">
          <Search className="h-5 w-5" />
          <span className="text-xs">{triggerLabel}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[80vh]">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className="grid grid-cols-2 gap-3 mt-6">
          {categories.map((category) => (
            <Button
              key={category.label}
              variant="outline"
              className="flex flex-col items-center gap-2 h-24 hover:bg-accent transition-all duration-200 hover:scale-105"
              onClick={() => {
                onCategorySelect(category.label);
                onOpenChange(false);
              }}
            >
              <category.icon className="h-8 w-8" />
              <span className="text-sm">{category.label}</span>
            </Button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};
