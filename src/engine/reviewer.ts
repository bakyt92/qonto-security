import type { FinancePrBody, ReviewOutput, ReviewVerdict } from './types.js';

export interface IndependentReviewer {
  id: string;
  review(context: { body: FinancePrBody; intent_ambiguous: boolean; high_value: boolean }): ReviewOutput;
}

export class HeuristicReviewer implements IndependentReviewer {
  id = 'heuristic-escalate-only';

  review(context: { body: FinancePrBody; intent_ambiguous: boolean; high_value: boolean }): ReviewOutput {
    const verdict: ReviewVerdict = context.intent_ambiguous || context.high_value ? 'escalate' : 'agree';
    const rationale =
      verdict === 'escalate'
        ? 'Escalation required: ambiguous intent or high value. Human approval is final authority.'
        : 'Intent and values are consistent. Ready for Finance review.';

    return { verdict, rationale, reviewer_id: this.id, available: true };
  }
}
