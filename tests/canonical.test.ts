import { describe, it, expect } from 'vitest';
import { canonicalize, hashBody, fingerprintFromHash } from '../src/engine/canonical.js';
describe('Canonical JSON', () => {
  it('produces deterministic output', () => {
    const obj = { b: 2, a: 1 };
    const c1 = canonicalize(obj);
    const c2 = canonicalize({ a: 1, b: 2 });
    expect(c1).toBe(c2);
  });
  it('hashes consistently', () => {
    const hash1 = hashBody({ test: 'data' });
    const hash2 = hashBody({ test: 'data' });
    expect(hash1).toBe(hash2);
  });
  it('creates valid fingerprints', () => {
    const hash = '1234567890abcdef';
    const fp = fingerprintFromHash(hash);
    expect(fp).toMatch(/^[0-9A-F]{4}-[0-9A-F]{4}$/);
  });
});