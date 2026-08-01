export function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function findMatches(text, needle) {
  if (!text || !needle) return [];
  const normalizedText = text.toLowerCase();
  const normalizedNeedle = needle.toLowerCase();
  const matches = [];
  let fromIndex = 0;
  while (fromIndex < normalizedText.length) {
    const index = normalizedText.indexOf(normalizedNeedle, fromIndex);
    if (index === -1) break;
    matches.push({ start: index, end: index + needle.length });
    fromIndex = index + needle.length;
  }
  return matches;
}

export function buildSnippet(clauseText, maxLength = 48) {
  const trimmed = clauseText.replace(/\s+/g, ' ').trim();
  if (trimmed.length <= maxLength) return trimmed;
  return trimmed.slice(0, maxLength);
}

export function findBestMatchLocation(text, clauseText) {
  if (!text || !clauseText) return null;

  const exact = findMatches(text, clauseText);
  if (exact.length) return exact[0];

  const normalizedText = text.toLowerCase().replace(/\s+/g, ' ');
  const snippet = buildSnippet(clauseText).toLowerCase();

  if (snippet.length >= 12) {
    const index = normalizedText.indexOf(snippet);
    if (index !== -1) {
      return { start: index, end: index + snippet.length };
    }
  }

  const words = snippet
    .split(' ')
    .filter((word) => word.length > 4);

  for (const word of words) {
    const index = normalizedText.indexOf(word);
    if (index !== -1) {
      return { start: index, end: index + word.length };
    }
  }

  return null;
}

export function highlightRangesForClause(text, clauseText) {
  const location = findBestMatchLocation(text, clauseText);
  if (!location) return [];
  return [location];
}
