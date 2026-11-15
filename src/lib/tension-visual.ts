/** Fire grows linearly from an intact Earth at zero to full intensity at 100. */
export function getTensionFireIntensity(score: number): number {
  return Math.max(0, Math.min(1, score / 100));
}