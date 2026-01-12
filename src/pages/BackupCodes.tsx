import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Copy, Check, Trash2, Eye, EyeOff, KeyRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { z } from 'zod';
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

const BACKUP_CODES_KEY = 'authenticator_backup_codes';

interface BackupCode {
  id: string;
  code: string;
  label?: string;
  createdAt: number;
}

const codeSchema = z.string().trim().min(1, 'Code cannot be empty').max(100, 'Code too long');

export default function BackupCodes() {
  const [codes, setCodes] = useState<BackupCode[]>([]);
  const [newCode, setNewCode] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem(BACKUP_CODES_KEY);
    if (stored) {
      try {
        setCodes(JSON.parse(stored));
      } catch {
        console.error('Failed to parse backup codes');
      }
    }
  }, []);

  const saveCodes = (newCodes: BackupCode[]) => {
    localStorage.setItem(BACKUP_CODES_KEY, JSON.stringify(newCodes));
    setCodes(newCodes);
  };

  const handleAddCode = () => {
    setError('');
    const result = codeSchema.safeParse(newCode);
    
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    const trimmedCode = newCode.trim();
    
    const newBackupCode: BackupCode = {
      id: crypto.randomUUID(),
      code: trimmedCode,
      label: newLabel.trim() || undefined,
      createdAt: Date.now(),
    };

    saveCodes([newBackupCode, ...codes]);
    setNewCode('');
    setNewLabel('');
    toast.success('Backup code added');
  };

  const handleDeleteCode = (id: string) => {
    saveCodes(codes.filter(c => c.id !== id));
    setDeleteId(null);
    toast.success('Backup code deleted');
  };

  const handleCopyCode = async (code: BackupCode) => {
    try {
      await navigator.clipboard.writeText(code.code);
      setCopiedId(code.id);
      toast.success('Code copied');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const maskCode = (code: string) => {
    if (code.length <= 4) return '••••';
    return code.slice(0, 2) + '•'.repeat(Math.min(code.length - 4, 12)) + code.slice(-2);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] opacity-20" 
          style={{ background: 'var(--gradient-glow)' }} 
        />
      </div>

      <div className="relative max-w-lg mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm" className="mb-4 -ml-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
              <KeyRound className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Backup Codes</h1>
              <p className="text-sm text-muted-foreground">Store your recovery codes safely</p>
            </div>
          </div>
        </header>

        {/* Add new code form */}
        <div className="card-gradient rounded-xl border border-border/50 p-4 mb-6">
          <div className="space-y-3">
            <Input
              placeholder="Enter backup code (e.g., 9383736 or ABC-123-XYZ)"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCode()}
              className={`font-mono ${error ? 'border-destructive' : ''}`}
            />
            <Input
              placeholder="Label (optional, e.g., Google, GitHub)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCode()}
            />
            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
            <Button onClick={handleAddCode} className="w-full gap-2">
              <Plus className="h-4 w-4" />
              Add Backup Code
            </Button>
          </div>
        </div>

        {/* Code list */}
        {codes.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                {codes.length} code{codes.length !== 1 ? 's' : ''} stored
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setRevealed(!revealed)}
              >
                {revealed ? (
                  <><EyeOff className="h-3.5 w-3.5 mr-1.5" /> Hide All</>
                ) : (
                  <><Eye className="h-3.5 w-3.5 mr-1.5" /> Show All</>
                )}
              </Button>
            </div>

            {codes.map((code) => (
              <div
                key={code.id}
                className="group card-gradient rounded-xl border border-border/50 p-4 transition-all duration-300 hover:border-primary/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {code.label && (
                      <p className="text-sm font-medium text-foreground mb-1">{code.label}</p>
                    )}
                    <p className="font-mono text-lg break-all">
                      {revealed ? code.code : maskCode(code.code)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Added {new Date(code.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleCopyCode(code)}
                    >
                      {copiedId === code.id ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(code.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <KeyRound className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <h3 className="font-medium text-foreground mb-1">No backup codes</h3>
            <p className="text-sm text-muted-foreground">
              Add recovery codes from your services to keep them safe
            </p>
          </div>
        )}

        {/* Info box */}
        <div className="mt-6 bg-primary/5 border border-primary/10 rounded-lg p-4">
          <p className="text-xs text-muted-foreground">
            💡 Backup codes are stored locally on this device. Keep a separate secure copy in case you lose access to this device.
          </p>
        </div>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Backup Code</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this backup code? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDeleteCode(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
