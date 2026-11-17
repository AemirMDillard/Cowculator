export function numberOrZero(value: unknown): number {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}
