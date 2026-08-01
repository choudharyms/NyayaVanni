export const CLAUSE_TYPE_RULES = [
  { category: 'Payment Clause', keywords: ['payment', 'consideration', 'invoice', 'fee', 'amount'] },
  { category: 'Liability Clause', keywords: ['liability', 'indemnif', 'limitation of liability'] },
  { category: 'Termination Clause', keywords: ['terminat', 'terminate'] },
  { category: 'Arbitration Clause', keywords: ['arbitration', 'arbitrator'] },
  { category: 'Confidentiality Clause', keywords: ['confidential'] },
  { category: 'Legal Obligations', keywords: ['obligation', 'shall', 'must', 'required'] },
  { category: 'Penalty Clause', keywords: ['penalty', 'liquidated damages', 'fine'] },
  { category: 'Governing Law', keywords: ['governing law', 'jurisdiction'] },
  { category: 'Dispute Resolution', keywords: ['dispute', 'resolution', 'litigation'] },
  { category: 'Force Majeure', keywords: ['force majeure', 'act of god'] },
];

export const HIGH_RISK_KEYWORDS = [
  'unilateral',
  'class action waiver',
  'no liability',
  'as is',
  'waive',
  'binding arbitration',
  'automatic renewal',
];

export function inferClauseType(text) {
  const lower = text.toLowerCase();
  const match = CLAUSE_TYPE_RULES.find((rule) =>
    rule.keywords.some((keyword) => lower.includes(keyword))
  );
  return match ? match.category : 'General Clause';
}

export function inferClauseRisk(text) {
  const lower = text.toLowerCase();
  return HIGH_RISK_KEYWORDS.some((keyword) => lower.includes(keyword))
    ? 'high'
    : 'medium';
}
