import type { IntentClass, IntentResult, UserRequest } from './types.js';

const APPROVAL_RE = /approve\s+finance\s+pr\s+([A-Za-z0-9-]+)\s*[,;:]?\s*fingerprint\s+([0-9A-Fa-f]{4}-[0-9A-Fa-f]{4})/i;

export function parseApproval(text: string): { pr_id: string; fingerprint: string } | null {
  const m = text.match(APPROVAL_RE);
  return m ? { pr_id: m[1], fingerprint: m[2] } : null;
}

const INSTRUCTION_PATTERNS = [
  /ignore\s+(all\s+|any\s+)?(previous|prior)\s+(instructions|rules)/i,
  /approve\s+(this|the)?\s*(payment|invoice)/i,
  /pay\s+(this|it|immediately|now)/i,
  /execute\s+(this|the)?\s*(transfer|payment)/i,
  /no\s+approval\s+is\s+required/i,
];

export function classifyIntent(request: UserRequest, attachmentText?: string | null): IntentResult {
  const lower = request.text.toLowerCase();
  const detected: string[] = [];

  // Detect injected instructions
  const fullText = `${request.text} ${attachmentText || ''}`;
  for (const pat of INSTRUCTION_PATTERNS) {
    const m = fullText.match(pat);
    if (m) detected.push(m[0]);
  }

  // Classify intent
  let intent_class: IntentClass;
  if (/pay|execute|transfer|approve\s*\.?\s*($|\s)/i.test(lower)) {
    intent_class = 'ACT';
  } else if (/prepare|draft|review|check/i.test(lower)) {
    intent_class = 'PREPARE';
  } else if (/^(what|how|when|who|which|where|why|is|are|does|can|should|would)/i.test(lower)) {
    intent_class = 'ADVICE_ONLY';
  } else if (/observe|read|fetch|get|list/i.test(lower)) {
    intent_class = 'OBSERVE';
  } else {
    intent_class = 'AMBIGUOUS';
  }

  return {
    intent_class,
    source_is_authoritative: request.source === 'user_chat' && intent_class !== 'ADVICE_ONLY',
    target_and_action_unambiguous: !detected.length && intent_class !== 'AMBIGUOUS',
    interpretation:
      intent_class === 'ADVICE_ONLY'
        ? 'User asked for advice/opinion about paying — a question, not an instruction.'
        : intent_class === 'ACT'
          ? 'User asked to pay, execute, or transfer — an action instruction.'
          : intent_class === 'PREPARE'
            ? 'User asked to prepare an invoice for payment review (no execution).'
            : intent_class === 'OBSERVE'
              ? 'User asked to read/fetch data (no action).'
              : 'Request is ambiguous; intent cannot be clearly determined.',
    ambiguity_notes: detected.length
      ? `Document contains ${detected.length} instruction-like phrase(s) — treated as data, never authority.`
      : '',
    detected_instructions: detected,
  };
}
