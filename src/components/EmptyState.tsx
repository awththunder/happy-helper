import { ShieldCheck, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onAddClick: () => void;
}

export function EmptyState({ onAddClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      <div className="relative mb-6">
        <div className="absolute inset-0 blur-3xl opacity-30 bg-primary rounded-full" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
          <ShieldCheck className="h-12 w-12 text-primary" />
        </div>
      </div>
      
      <h2 className="text-xl font-semibold text-foreground mb-2">
        No accounts yet
      </h2>
      <p className="text-muted-foreground max-w-sm mb-8">
        Add your first account by scanning a QR code or entering the secret key manually
      </p>
      
      <Button onClick={onAddClick} className="gap-2">
        <Plus className="h-4 w-4" />
        Add Your First Account
      </Button>
    </div>
  );
}
