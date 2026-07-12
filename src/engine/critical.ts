import { digest } from './canonical.js';
import { ibanDigest, maskIban } from './redact.js';
import type { CriticalStateDisplay, FinancePrBody, SupplierInvoiceEvidence } from './types.js';

export function criticalStateDigest(invoice: SupplierInvoiceEvidence): string {
  const key = {
    amount_value: invoice.amount.value,
    amount_currency: invoice.amount.currency,
    iban_digest: ibanDigest(invoice.iban),
    supplier_name: invoice.supplier_name,
    supplier_id: invoice.supplier_id,
    status: invoice.status,
  };
  return digest('critical', JSON.stringify(key));
}

export function criticalStateDisplay(invoice: SupplierInvoiceEvidence): CriticalStateDisplay {
  return {
    amount: invoice.amount,
    iban_masked: maskIban(invoice.iban),
    supplier_name: invoice.supplier_name,
    status: invoice.status,
  };
}

export function criticalFieldDiffs(body: FinancePrBody, freshInvoice: SupplierInvoiceEvidence): string[] {
  const diffs: string[] = [];
  const disp = body.critical_state_display;
  if (freshInvoice.amount.value !== disp.amount.value) diffs.push('amount changed');
  if (freshInvoice.amount.currency !== disp.amount.currency) diffs.push('currency changed');
  if (ibanDigest(freshInvoice.iban) !== ibanDigest(disp.iban_masked ? disp.iban_masked.slice(-4) : null))
    diffs.push('IBAN changed');
  if (freshInvoice.supplier_name !== disp.supplier_name) diffs.push('supplier name changed');
  if (freshInvoice.status !== disp.status) diffs.push('status changed');
  return diffs;
}
