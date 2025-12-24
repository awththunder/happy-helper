import { useState, useEffect, useCallback } from 'react';
import * as OTPAuth from 'otpauth';
import { Account } from '@/types/account';

export function useTOTP(account: Account) {
  const [code, setCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);

  const generateCode = useCallback(() => {
    try {
      const totp = new OTPAuth.TOTP({
        issuer: account.issuer,
        label: account.label,
        algorithm: account.algorithm,
        digits: account.digits,
        period: account.period,
        secret: OTPAuth.Secret.fromBase32(account.secret.replace(/\s/g, '').toUpperCase()),
      });
      return totp.generate();
    } catch (error) {
      console.error('Failed to generate TOTP:', error);
      return '------';
    }
  }, [account]);

  useEffect(() => {
    const updateCode = () => {
      setCode(generateCode());
      const now = Math.floor(Date.now() / 1000);
      const remaining = account.period - (now % account.period);
      setTimeLeft(remaining);
    };

    updateCode();
    const interval = setInterval(updateCode, 1000);
    return () => clearInterval(interval);
  }, [generateCode, account.period]);

  return { code, timeLeft, period: account.period };
}
