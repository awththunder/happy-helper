import { useState } from 'react';
import { Copy, Check, Trash2, MoreVertical, Eye, KeyRound } from 'lucide-react';
import { Account } from '@/types/account';
import { useTOTP } from '@/hooks/useTOTP';
import { CountdownRing } from './CountdownRing';
import { ViewSecretDialog } from './ViewSecretDialog';
import { BackupCodesDialog } from './BackupCodesDialog';
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
import { toast } from 'sonner';

interface AccountCardProps {
  account: Account;
  onDelete: (id: string) => void;
  onUpdateBackupCodes: (accountId: string, codes: string[]) => void;
}

export function AccountCard({ account, onDelete, onUpdateBackupCodes }: AccountCardProps) {
  const { code, timeLeft, period } = useTOTP(account);
  const [copied, setCopied] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSecretDialog, setShowSecretDialog] = useState(false);
  const [showBackupCodesDialog, setShowBackupCodesDialog] = useState(false);

  const formattedCode = code.slice(0, 3) + ' ' + code.slice(3);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('Code copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy code');
    }
  };

  const handleDelete = () => {
    onDelete(account.id);
    setShowDeleteDialog(false);
    toast.success('Account removed');
  };

  // Get initials for avatar
  const initials = account.issuer
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <div className="group card-gradient rounded-xl border border-border/50 p-4 transition-all duration-300 hover:border-primary/30 hover:shadow-lg animate-fade-in">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold text-sm">
            {initials}
          </div>

          {/* Account info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{account.issuer}</h3>
            <p className="text-sm text-muted-foreground truncate">{account.label}</p>
          </div>

          {/* Actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowSecretDialog(true)}>
                <Eye className="mr-2 h-4 w-4" />
                View Secret
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowBackupCodesDialog(true)}>
                <KeyRound className="mr-2 h-4 w-4" />
                Backup Codes
                {account.backupCodes && account.backupCodes.length > 0 && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {account.backupCodes.length}
                  </span>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Code display */}
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={handleCopy}
            className="flex items-center gap-3 rounded-lg bg-secondary/50 px-4 py-3 transition-all hover:bg-secondary"
          >
            <span className="code-display">{formattedCode}</span>
            {copied ? (
              <Check className="h-5 w-5 text-success" />
            ) : (
              <Copy className="h-5 w-5 text-muted-foreground" />
            )}
          </button>

          <CountdownRing timeLeft={timeLeft} period={period} />
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{account.issuer}</strong> ({account.label})? 
              This action cannot be undone and you may lose access to your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ViewSecretDialog
        account={account}
        open={showSecretDialog}
        onOpenChange={setShowSecretDialog}
      />

      <BackupCodesDialog
        account={account}
        open={showBackupCodesDialog}
        onOpenChange={setShowBackupCodesDialog}
        onUpdateBackupCodes={onUpdateBackupCodes}
      />
    </>
  );
}
