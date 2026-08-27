function normalizeText(text) {
  if (typeof text !== 'string') return text;
  return text.toUpperCase().trim();
}

function normalizeKeys(obj, keys) {
  if (!obj || typeof obj !== 'object') return obj;
  const normalized = { ...obj };
  for (const key of keys) {
    if (normalized[key] && typeof normalized[key] === 'string') {
      normalized[key] = normalizeText(normalized[key]);
    }
  }
  return normalized;
}

module.exports = { normalizeText, normalizeKeys };
