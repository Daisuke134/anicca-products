export function deriveStatus(
  row: {
    status?: string | null;
    ts?: number | string | null;
  } | null | undefined,
  nowSec: number,
): 'alive' | 'stale' | 'critical' | 'dead';
