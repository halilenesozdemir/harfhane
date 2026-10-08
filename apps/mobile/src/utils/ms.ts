const MS_PATTERN = /^(-?\d+(?:\.\d+)?)ms$/;

export function parseMs(value: string): number {
  const match = MS_PATTERN.exec(value);
  if (!match) throw new Error(`Invalid ms value: ${value}`);
  return Number(match[1]);
}
