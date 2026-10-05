const PX_PATTERN = /^(-?\d+(?:\.\d+)?)px$/;

export function parsePx(value: string): number {
  const match = PX_PATTERN.exec(value);
  if (!match) throw new Error(`Invalid px value: ${value}`);
  return Number(match[1]);
}
