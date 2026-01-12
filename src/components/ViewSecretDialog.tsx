import { useState } from 'react';
import { Eye, EyeOff, Copy, Check, ShieldAlert } from 'lucide-react';
import { Account } from '@/types/account';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface ViewSecretDialogProps {
  account: Account;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewSecretDialog({ account, open, onOpenChange }: ViewSecretDialogProps) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(account.secret);
      setCopied(true);
      toast.success('Secret copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy secret');
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setRevealed(false);
      setCopied(false);
    }
    onOpenChange(isOpen);
  };

  const maskedSecret = '•'.repeat(Math.min(account.secret.length, 32));

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-warning" />
            Secret Key
          </DialogTitle>
          <DialogDescription>
            Keep this secret safe. Anyone with access to this key can generate your 2FA codes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              {account.issuer} ({account.label})
            </div>
            <div className="relative">
              <div className="font-mono text-sm bg-secondary/50 rounded-lg p-4 pr-24 break-all border border-border/50">
                {revealed ? account.secret : maskedSecret}
              </div>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setRevealed(!revealed)}
                >
                  {revealed ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
            <p className="text-xs text-warning">
              ⚠️ Never share your secret key with anyone. Store it securely as a backup.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
