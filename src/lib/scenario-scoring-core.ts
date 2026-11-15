import type { DimensionScores } from "@/types/scenario";
import { SCENARIO_DIMENSIONS } from "@/types/scenario";

export function calculateWeightedScore(dimensions: DimensionScores): number {
  return Math.round(
    SCENARIO_DIMENSIONS.reduce((total, dimension) => total + dimensions[dimension.id] * dimension.weight, 0),
  );
}
