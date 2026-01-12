import { useState, useRef } from 'react';
import { Shield, Lock } from 'lucide-react';
import { useAccounts } from '@/hooks/useAccounts';
import { AccountCard } from '@/components/AccountCard';
import { AddAccountDialog } from '@/components/AddAccountDialog';
import { EmptyState } from '@/components/EmptyState';
import { SettingsMenu } from '@/components/SettingsMenu';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, QrCode, Keyboard } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QRScanner } from '@/components/QRScanner';
import { parseOTPAuthURI, validateSecret } from '@/lib/otpauth-parser';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { z } from 'zod';

const manualEntrySchema = z.object({
  issuer: z.string().trim().min(1, 'Service name is required').max(50, 'Service name too long'),
  label: z.string().trim().min(1, 'Account name is required').max(100, 'Account name too long'),
  secret: z.string().trim().min(1, 'Secret key is required'),
});

export default function Index() {
  const { accounts, isLoading, addAccount, removeAccount, updateBackupCodes, importAccounts, clearAllAccounts } = useAccounts();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tab, setTab] = useState<'scan' | 'manual'>('scan');
  const [issuer, setIssuer] = useState('');
  const [label, setLabel] = useState('');
  const [secret, setSecret] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setIssuer('');
    setLabel('');
    setSecret('');
    setErrors({});
    setTab('scan');
  };

  const handleQRScan = (data: string) => {
    const parsed = parseOTPAuthURI(data);
    if (parsed) {
      addAccount({
        issuer: parsed.issuer,
        label: parsed.label,
        secret: parsed.secret,
        algorithm: parsed.algorithm,
        digits: parsed.digits,
        period: parsed.period,
      });
      toast.success(`Added ${parsed.issuer}`);
      setDialogOpen(false);
      resetForm();
    } else {
      toast.error('Invalid QR code. Please scan a valid authenticator QR code.');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = manualEntrySchema.safeParse({ issuer, label, secret });
    
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    const cleanSecret = secret.replace(/\s/g, '').toUpperCase();
    
    if (!validateSecret(cleanSecret)) {
      setErrors({ secret: 'Invalid secret key format. Must be a valid Base32 string.' });
      return;
    }

    addAccount({
      issuer: result.data.issuer,
      label: result.data.label,
      secret: cleanSecret,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    });

    toast.success(`Added ${result.data.issuer}`);
    setDialogOpen(false);
    resetForm();
  };

  const openAddDialog = () => setDialogOpen(true);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background glow effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] opacity-20" 
          style={{ background: 'var(--gradient-glow)' }} 
        />
      </div>

      <div className="relative max-w-lg mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="w-9" /> {/* Spacer for alignment */}
            <div className="flex items-center justify-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                <Shield className="h-6 w-6 text-primary" />
              </div>
            </div>
            <SettingsMenu 
              accounts={accounts}
              onImportAccounts={importAccounts}
              onClearAllAccounts={clearAllAccounts}
            />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Authenticator</h1>
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Lock className="h-3.5 w-3.5" />
            Secure 2FA codes
          </p>
        </header>

        {/* Add button - only show when there are accounts */}
        {accounts.length > 0 && (
          <div className="flex justify-end mb-6">
            <Dialog open={dialogOpen} onOpenChange={(isOpen) => {
              setDialogOpen(isOpen);
              if (!isOpen) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Account
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Account</DialogTitle>
                </DialogHeader>

                <Tabs value={tab} onValueChange={(v) => setTab(v as 'scan' | 'manual')} className="mt-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="scan" className="gap-2">
                      <QrCode className="h-4 w-4" />
                      Scan QR
                    </TabsTrigger>
                    <TabsTrigger value="manual" className="gap-2">
                      <Keyboard className="h-4 w-4" />
                      Manual
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="scan" className="mt-4">
                    <QRScanner 
                      onScan={handleQRScan}
                      onError={(error) => toast.error(error)}
                    />
                  </TabsContent>

                  <TabsContent value="manual" className="mt-4">
                    <form onSubmit={handleManualSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="issuer">Service Name</Label>
                        <Input
                          id="issuer"
                          placeholder="e.g., Google, GitHub, Discord"
                          value={issuer}
                          onChange={(e) => setIssuer(e.target.value)}
                          className={errors.issuer ? 'border-destructive' : ''}
                        />
                        {errors.issuer && (
                          <p className="text-sm text-destructive">{errors.issuer}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="label">Account Name</Label>
                        <Input
                          id="label"
                          placeholder="e.g., your@email.com"
                          value={label}
                          onChange={(e) => setLabel(e.target.value)}
                          className={errors.label ? 'border-destructive' : ''}
                        />
                        {errors.label && (
                          <p className="text-sm text-destructive">{errors.label}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="secret">Secret Key</Label>
                        <Input
                          id="secret"
                          placeholder="Enter the secret key"
                          value={secret}
                          onChange={(e) => setSecret(e.target.value)}
                          className={`font-mono ${errors.secret ? 'border-destructive' : ''}`}
                        />
                        {errors.secret && (
                          <p className="text-sm text-destructive">{errors.secret}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          The secret key provided by the service (usually shown as a backup code)
                        </p>
                      </div>

                      <Button type="submit" className="w-full">
                        Add Account
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Account list or empty state */}
        {accounts.length === 0 ? (
          <>
            <EmptyState onAddClick={openAddDialog} />
            <Dialog open={dialogOpen} onOpenChange={(isOpen) => {
              setDialogOpen(isOpen);
              if (!isOpen) resetForm();
            }}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Account</DialogTitle>
                </DialogHeader>

                <Tabs value={tab} onValueChange={(v) => setTab(v as 'scan' | 'manual')} className="mt-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="scan" className="gap-2">
                      <QrCode className="h-4 w-4" />
                      Scan QR
                    </TabsTrigger>
                    <TabsTrigger value="manual" className="gap-2">
                      <Keyboard className="h-4 w-4" />
                      Manual
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="scan" className="mt-4">
                    <QRScanner 
                      onScan={handleQRScan}
                      onError={(error) => toast.error(error)}
                    />
                  </TabsContent>

                  <TabsContent value="manual" className="mt-4">
                    <form onSubmit={handleManualSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="issuer2">Service Name</Label>
                        <Input
                          id="issuer2"
                          placeholder="e.g., Google, GitHub, Discord"
                          value={issuer}
                          onChange={(e) => setIssuer(e.target.value)}
                          className={errors.issuer ? 'border-destructive' : ''}
                        />
                        {errors.issuer && (
                          <p className="text-sm text-destructive">{errors.issuer}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="label2">Account Name</Label>
                        <Input
                          id="label2"
                          placeholder="e.g., your@email.com"
                          value={label}
                          onChange={(e) => setLabel(e.target.value)}
                          className={errors.label ? 'border-destructive' : ''}
                        />
                        {errors.label && (
                          <p className="text-sm text-destructive">{errors.label}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="secret2">Secret Key</Label>
                        <Input
                          id="secret2"
                          placeholder="Enter the secret key"
                          value={secret}
                          onChange={(e) => setSecret(e.target.value)}
                          className={`font-mono ${errors.secret ? 'border-destructive' : ''}`}
                        />
                        {errors.secret && (
                          <p className="text-sm text-destructive">{errors.secret}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          The secret key provided by the service (usually shown as a backup code)
                        </p>
                      </div>

                      <Button type="submit" className="w-full">
                        Add Account
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </>
        ) : (
          <div className="space-y-4">
            {accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onDelete={removeAccount}
                onUpdateBackupCodes={updateBackupCodes}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 text-center">
          <p className="text-xs text-muted-foreground">
            Your codes are stored locally on this device
          </p>
        </footer>
      </div>
    </div>
  );
}
