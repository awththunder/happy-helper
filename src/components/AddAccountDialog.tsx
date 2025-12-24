import { useState } from 'react';
import { QrCode, Keyboard, Plus } from 'lucide-react';
import { z } from 'zod';
import { QRScanner } from './QRScanner';
import { parseOTPAuthURI, validateSecret } from '@/lib/otpauth-parser';
import { Account } from '@/types/account';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const manualEntrySchema = z.object({
  issuer: z.string().trim().min(1, 'Service name is required').max(50, 'Service name too long'),
  label: z.string().trim().min(1, 'Account name is required').max(100, 'Account name too long'),
  secret: z.string().trim().min(1, 'Secret key is required'),
});

interface AddAccountDialogProps {
  onAdd: (account: Omit<Account, 'id' | 'createdAt'>) => void;
}

export function AddAccountDialog({ onAdd }: AddAccountDialogProps) {
  const [open, setOpen] = useState(false);
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
      onAdd({
        issuer: parsed.issuer,
        label: parsed.label,
        secret: parsed.secret,
        algorithm: parsed.algorithm,
        digits: parsed.digits,
        period: parsed.period,
      });
      toast.success(`Added ${parsed.issuer}`);
      setOpen(false);
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

    onAdd({
      issuer: result.data.issuer,
      label: result.data.label,
      secret: cleanSecret,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    });

    toast.success(`Added ${result.data.issuer}`);
    setOpen(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
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
  );
}
