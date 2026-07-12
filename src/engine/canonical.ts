import { sha256 } from 'js-sha256';

export function canonicalize(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'boolean' || typeof value === 'number') return JSON.stringify(value);
  if (typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  if (typeof value === 'object') {
    const keys = Object.keys(value as Record<string, unknown>).sort();
    const pairs = keys.map((k) => `${JSON.stringify(k)}:${canonicalize((value as Record<string, unknown>)[k])}`);
    return `{${pairs.join(',')}}`;
  }
  return 'null';
}

export function hashBody(body: unknown): string {
  const canonical = canonicalize(body);
  return sha256(canonical);
}

export function fingerprintFromHash(hash: string): string {
  const upper = hash.toUpperCase();
  return `${upper.slice(0, 4)}-${upper.slice(4, 8)}`;
}

export function digest(...parts: string[]): string {
  const salt = 'finance-pr.2026-07-12';
  const combined = [salt, ...parts].join('|');
  return sha256(combined);
}
