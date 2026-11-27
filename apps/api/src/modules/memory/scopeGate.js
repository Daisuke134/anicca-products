// Pure enforcement boundary: grants come only from a verified server-side authority.
 // This module does not authenticate requests or mint grants.
export function filterScopedMemories(records, grant, now = Date.now()) {
  if (!Array.isArray(records) || !grant || !Number.isFinite(now)) return [];
  const valid = v => typeof v === 'string' && v.trim().length > 0;
  const { subjectId, recipientId, purpose, expiresAt, allowedIds, revoked } = grant;
  if (![subjectId, recipientId, purpose].every(valid) ||
      revoked !== false || !Number.isFinite(expiresAt) || expiresAt <= now ||
      !Array.isArray(allowedIds) || !allowedIds.every(valid)) return [];
  const permitted = new Set(allowedIds);
  const counts = new Map();
  for (const record of records) {
    if (valid(record?.id)) counts.set(record.id, (counts.get(record.id) || 0) + 1);
  }
  return records.filter(record =>
    valid(record?.id) && counts.get(record.id) === 1 &&
    permitted.has(record.id) && record.subjectId === subjectId &&
    record.recipientId === recipientId && record.purpose === purpose &&
    record.revoked === false && Number.isFinite(record.expiresAt) &&
    record.expiresAt > now
  );
}
