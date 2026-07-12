import { digest } from './canonical.js';

export function normalizeIban(iban: string | null): string | null {
  if (!iban) return null;
  return iban.replace(/\s/g, '').toUpperCase();
}

export function maskIban(iban: string | null): string | null {
  if (!iban) return null;
  const norm = normalizeIban(iban);
  if (!norm || norm.length < 4) return norm;
  return '•••• ' + norm.slice(-4);
}

export function ibanDigest(iban: string | null): string {
  if (!iban) return '';
  return digest('iban', normalizeIban(iban) || '').slice(0, 12);
}

export function maskId(id: string): string {
  return id.slice(0, 8) + '…';
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  return local[0] + '•••@' + domain;
}

export function stripSensitive(text: string): string {
  return text
    .replace(/https?:\/\/[^\s"'<>]+/gi, '[url-redacted]')
    .replace(/sk-[A-Za-z0-9_-]{20,}/g, '[token-redacted]')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, '[token-redacted]');
}
