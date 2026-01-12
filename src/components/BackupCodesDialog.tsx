import { useState } from 'react';
import { KeyRound, Plus, Trash2, Copy, Check, Eye, EyeOff } from 'lucide-react';
import { Account } from '@/types/account';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { z } from 'zod';

const backupCodeSchema = z.string().trim().min(4, 'Code too short').max(50, 'Code too long');

interface BackupCodesDialogProps {
  account: Account;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateBackupCodes: (accountId: string, codes: string[]) => void;
}

export function BackupCodesDialog({ 
  account, 
  open, 
  onOpenChange, 
  onUpdateBackupCodes 
}: BackupCodesDialogProps) {
  const [newCode, setNewCode] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [error, setError] = useState('');

  const backupCodes = account.backupCodes || [];

  const handleAddCode = () => {
    setError('');
    const result = backupCodeSchema.safeParse(newCode);
    
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    const trimmedCode = newCode.trim();
    if (backupCodes.includes(trimmedCode)) {
      setError('This code already exists');
      return;
    }

    onUpdateBackupCodes(account.id, [...backupCodes, trimmedCode]);
    setNewCode('');
    toast.success('Backup code added');
  };

  const handleDeleteCode = (index: number) => {
    const updatedCodes = backupCodes.filter((_, i) => i !== index);
    onUpdateBackupCodes(account.id, updatedCodes);
    toast.success('Backup code removed');
  };

  const handleCopyCode = async (code: string, index: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedIndex(index);
      toast.success('Code copied');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleCopyAll = async () => {
    if (backupCodes.length === 0) return;
    try {
      await navigator.clipboard.writeText(backupCodes.join('\n'));
      toast.success('All codes copied');
    } catch {
      toast.error('Failed to copy');
    }
  };

  const maskCode = (code: string) => {
    if (code.length <= 4) return '••••';
    return code.slice(0, 2) + '•'.repeat(code.length - 4) + code.slice(-2);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setNewCode('');
      setError('');
      setRevealed(false);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Backup Codes
          </DialogTitle>
          <DialogDescription>
            Store recovery codes for {account.issuer}. These codes let you regain access if you lose your 2FA device.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Add new code */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Enter backup code"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCode()}
                className={error ? 'border-destructive' : ''}
              />
              {error && (
                <p className="text-xs text-destructive mt-1">{error}</p>
              )}
            </div>
            <Button onClick={handleAddCode} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Code list */}
          {backupCodes.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {backupCodes.length} code{backupCodes.length !== 1 ? 's' : ''} stored
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setRevealed(!revealed)}
                  >
                    {revealed ? (
                      <><EyeOff className="h-3 w-3 mr-1" /> Hide</>
                    ) : (
                      <><Eye className="h-3 w-3 mr-1" /> Show</>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleCopyAll}
                  >
                    <Copy className="h-3 w-3 mr-1" /> Copy All
                  </Button>
                </div>
              </div>
              
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {backupCodes.map((code, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-secondary/50 rounded-lg px-3 py-2 border border-border/50"
                  >
                    <span className="font-mono text-sm">
                      {revealed ? code : maskCode(code)}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleCopyCode(code, index)}
                      >
                        {copiedIndex === index ? (
                          <Check className="h-3 w-3 text-success" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteCode(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <KeyRound className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No backup codes stored</p>
              <p className="text-xs mt-1">Add codes provided by {account.issuer}</p>
            </div>
          )}

          <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">
              💡 Backup codes are stored locally on this device. Keep a separate secure copy.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
