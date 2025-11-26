import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

interface UserProfileSheetProps {
  title: string;
  description: string;
  signInLabel: string;
  isRTL: boolean;
}

/**
 * UserProfileSheet component
 * Displays user profile options in a slide-out sheet
 */
export const UserProfileSheet = ({ 
  title, 
  description, 
  signInLabel,
  isRTL 
}: UserProfileSheetProps) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="icon" variant="outline" className="h-12 w-12 rounded-full">
          <User className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side={isRTL ? 'left' : 'right'}>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className="py-4 space-y-4">
          <p className="text-sm text-muted-foreground">{description}</p>
          <Button className="w-full">{signInLabel}</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
