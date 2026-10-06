export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function currentLevel(): LogLevel {
  const raw = (process.env.LOG_LEVEL ?? 'info').toLowerCase();
  if (raw === 'debug' || raw === 'info' || raw === 'warn' || raw === 'error') {
    return raw;
  }
  return 'info';
}

/**
 * Emit a single-line JSON log record: { ts, level, event, ...fields }.
 * Records below LOG_LEVEL (default 'info') are suppressed.
 */
export function log(
  event: string,
  fields: Record<string, unknown> = {},
  level: LogLevel = 'info',
): void {
  if (LEVEL_WEIGHT[level] < LEVEL_WEIGHT[currentLevel()]) return;
  const record = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    event,
    ...fields,
  });
  process.stdout.write(record + '\n');
}
