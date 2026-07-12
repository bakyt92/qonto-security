export interface WriteResult {
  outcome: string;
  note: string;
}

export interface WriteAdapter {
  id: string;
  submit(body: unknown): Promise<WriteResult>;
}

export class DisabledWriteAdapter implements WriteAdapter {
  id = 'disabled';
  async submit(): Promise<WriteResult> {
    return {
      outcome: 'ready_for_qonto',
      note: 'Qonto writes are disabled by default — Act stops at a verified ready_for_qonto handoff.',
    };
  }
}

export class SyntheticQontoAdapter implements WriteAdapter {
  id = 'synthetic-qonto';
  async submit(): Promise<WriteResult> {
    return {
      outcome: 'qonto_native_approval_pending',
      note: '(Synthetic) Proposal reached Qonto native approval workflow.',
    };
  }
}
