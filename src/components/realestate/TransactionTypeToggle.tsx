import { Button } from '@/components/ui/button';

interface TransactionTypeToggleProps {
  transactionType: 'rent' | 'sale';
  onTypeChange: (type: 'rent' | 'sale') => void;
  rentLabel: string;
  saleLabel: string;
}

/**
 * TransactionTypeToggle component
 * Toggle between rent and sale transaction types
 */
export const TransactionTypeToggle = ({
  transactionType,
  onTypeChange,
  rentLabel,
  saleLabel,
}: TransactionTypeToggleProps) => {
  return (
    <div className="flex gap-2 bg-muted p-1 rounded-lg">
      <Button
        variant={transactionType === 'sale' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onTypeChange('sale')}
        className="flex-1 transition-all duration-200"
      >
        {saleLabel}
      </Button>
      <Button
        variant={transactionType === 'rent' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onTypeChange('rent')}
        className="flex-1 transition-all duration-200"
      >
        {rentLabel}
      </Button>
    </div>
  );
};
