import { ParsedOTPAuth } from '@/types/account';

export function parseOTPAuthURI(uri: string): ParsedOTPAuth | null {
  try {
    const url = new URL(uri);
    
    if (url.protocol !== 'otpauth:') {
      throw new Error('Invalid protocol');
    }

    if (url.host !== 'totp') {
      throw new Error('Only TOTP is supported');
    }

    const path = decodeURIComponent(url.pathname.slice(1));
    let issuer = '';
    let label = path;

    // Parse label format: "issuer:account" or just "account"
    if (path.includes(':')) {
      const parts = path.split(':');
      issuer = parts[0];
      label = parts.slice(1).join(':');
    }

    const params = url.searchParams;
    const secret = params.get('secret');

    if (!secret) {
      throw new Error('Secret is required');
    }

    // Override issuer from params if present
    if (params.has('issuer')) {
      issuer = params.get('issuer') || issuer;
    }

    const algorithm = (params.get('algorithm')?.toUpperCase() || 'SHA1') as 'SHA1' | 'SHA256' | 'SHA512';
    const digits = parseInt(params.get('digits') || '6', 10);
    const period = parseInt(params.get('period') || '30', 10);

    return {
      issuer: issuer || 'Unknown',
      label,
      secret,
      algorithm,
      digits,
      period,
    };
  } catch (error) {
    console.error('Failed to parse OTPAuth URI:', error);
    return null;
  }
}

export function validateSecret(secret: string): boolean {
  // Base32 validation (A-Z, 2-7)
  const cleanSecret = secret.replace(/\s/g, '').toUpperCase();
  return /^[A-Z2-7]+=*$/.test(cleanSecret) && cleanSecret.length >= 16;
}
