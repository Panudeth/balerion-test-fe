/**
 * IEEE 754 banker's rounding (round half to even).
 * Avoids floating-point bias of round-half-up.
 */
export function bankersRound(value: number, decimals = 2): number {
  if (!Number.isFinite(value)) return 0
  const factor = 10 ** decimals
  const epsilon = 1e-9
  const n = value * factor
  const floored = Math.floor(n)
  const diff = n - floored

  if (diff > 0.5 + epsilon) return (floored + 1) / factor
  if (diff < 0.5 - epsilon) return floored / factor
  // Tie at .5 — round to even
  return (floored % 2 === 0 ? floored : floored + 1) / factor
}
