/** Low tension keeps Earth intact; damage grows continuously toward 100. */
export function getTensionFireIntensity(score: number): number {
  return Math.max(0, Math.min(1, (score - 25) / 75));
}