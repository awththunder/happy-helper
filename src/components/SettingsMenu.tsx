import { Settings, Download, Upload, Trash2, Shield, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Account } from '@/types/account';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

const accountSchema = z.object({
  id: z.string(),
  issuer: z.string().max(100),
  label: z.string().max(200),
  secret: z.string().max(500),
  algorithm: z.enum(['SHA1', 'SHA256', 'SHA512']),
  digits: z.number().min(1).max(10),
  period: z.number().min(1).max(300),
  createdAt: z.number(),
  backupCodes: z.array(z.string().max(100)).optional(),
});

const backupSchema = z.object({
  version: z.literal(1),
  exportedAt: z.number(),
  accounts: z.array(accountSchema),
});

interface SettingsMenuProps {
  accounts: Account[];
  onImportAccounts: (accounts: Account[]) => void;
  onClearAllAccounts: () => void;
}

export function SettingsMenu({ accounts, onImportAccounts, onClearAllAccounts }: SettingsMenuProps) {
  const [showClearDialog, setShowClearDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleExport = () => {
    if (accounts.length === 0) {
      toast.error('No accounts to export');
      return;
    }

    const backup = {
      version: 1,
      exportedAt: Date.now(),
      accounts: accounts,
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `authenticator-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Backup exported successfully');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      const result = backupSchema.safeParse(data);
      if (!result.success) {
        toast.error('Invalid backup file format');
        return;
      }

      const importedAccounts: Account[] = result.data.accounts.map(acc => ({
        issuer: acc.issuer,
        label: acc.label,
        secret: acc.secret,
        algorithm: acc.algorithm,
        digits: acc.digits,
        period: acc.period,
        backupCodes: acc.backupCodes,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
      }));

      onImportAccounts(importedAccounts);
      toast.success(`Imported ${importedAccounts.length} account(s)`);
    } catch {
      toast.error('Failed to read backup file');
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearAll = () => {
    onClearAllAccounts();
    setShowClearDialog(false);
    toast.success('All accounts cleared');
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        className="hidden"
      />
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Settings className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => navigate('/backup-codes')}>
            <KeyRound className="mr-2 h-4 w-4" />
            Backup Codes
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export Backup
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleImportClick}>
            <Upload className="mr-2 h-4 w-4" />
            Import Backup
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="text-destructive focus:text-destructive"
            onClick={() => setShowClearDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear All Data
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-destructive" />
              Clear All Data
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {accounts.length} account(s) and their backup codes. 
              You will lose access to your 2FA codes. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
