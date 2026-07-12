// Trusted policy — pure parsing + digest (no filesystem, no LLM, no NL).
// The node layer reads the file bytes and hands them here; this module only ever
// parses a small deterministic structure. Two accepted shapes:
//   - `.txt`  key = value lines (comments with '#', blank lines ignored):
//         currency   = EUR
//         hard_block = 50000
//         role.owner = 10000
//   - `.json` { currency, hard_block_amount, role_limits }
// Both must be an EXPLICITLY trusted operator source. Never parse invoice text.

import { digest } from './canonical.js';
import type { TrustedPolicy } from './types.js';

const DECIMAL = /^\d+(\.\d+)?$/;

function requireAmount(field: string, value: unknown): string {
  const s = String(value).trim();
  if (!DECIMAL.test(s)) throw new Error(`Trusted policy: ${field} must be a non-negative decimal amount, got "${s}".`);
  return s;
}

function finalize(currency: string, hardBlock: unknown, roleLimits: Record<string, unknown>): TrustedPolicy {
  const cur = currency.trim().toUpperCase();
  if (!cur) throw new Error('Trusted policy: a currency is required.');
  const role_limits: Record<string, string> = {};
  for (const [role, v] of Object.entries(roleLimits)) {
    role_limits[role.trim()] = requireAmount(`role_limits.${role}`, v);
  }
  return {
    source: 'trusted_file',
    currency: cur,
    hard_block_amount: requireAmount('hard_block_amount', hardBlock),
    role_limits,
  };
}

/** Parse the deterministic `key = value` text format. */
export function parseTrustedPolicyText(text: string): TrustedPolicy {
  let currency = '';
  let hardBlock: string | undefined;
  const roleLimits: Record<string, string> = {};

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 0) throw new Error(`Trusted policy: cannot parse line "${line}" (expected key = value).`);
    const key = line.slice(0, eq).trim().toLowerCase();
    const value = line.slice(eq + 1).trim();
    if (key === 'currency') currency = value;
    else if (key === 'hard_block' || key === 'hard_block_amount') hardBlock = value;
    else if (key.startsWith('role.')) roleLimits[key.slice('role.'.length)] = value;
    else throw new Error(`Trusted policy: unknown key "${key}".`);
  }
  if (hardBlock === undefined) throw new Error('Trusted policy: hard_block is required.');
  return finalize(currency, hardBlock, roleLimits);
}

/** Parse the JSON object form. */
export function parseTrustedPolicyJson(obj: unknown): TrustedPolicy {
  if (!obj || typeof obj !== 'object') throw new Error('Trusted policy: expected a JSON object.');
  const o = obj as Record<string, unknown>;
  if (typeof o.currency !== 'string') throw new Error('Trusted policy: a currency string is required.');
  if (o.hard_block_amount === undefined) throw new Error('Trusted policy: hard_block_amount is required.');
  const roles = (o.role_limits && typeof o.role_limits === 'object' ? o.role_limits : {}) as Record<string, unknown>;
  return finalize(o.currency, o.hard_block_amount, roles);
}

/** Stable digest binding the exact policy used, for the hashed PR body / audit. */
export function trustedPolicyDigest(tp: TrustedPolicy): string {
  const roles = Object.keys(tp.role_limits)
    .sort()
    .map((k) => `${k}:${tp.role_limits[k]}`)
    .join(',');
  return digest('trusted_policy', tp.source, tp.currency, tp.hard_block_amount, roles);
}
