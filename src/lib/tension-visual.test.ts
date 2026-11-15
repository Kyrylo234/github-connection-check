import { describe, expect, it } from "vitest";
import { getTensionFireIntensity } from "./tension-visual";

describe("tension globe fire intensity", () => {
  it("keeps the globe normal at low tension", () => {
    expect(getTensionFireIntensity(0)).toBe(0);
    expect(getTensionFireIntensity(25)).toBe(0);
  });

  it("increases fire as tension approaches 100", () => {
    expect(getTensionFireIntensity(50)).toBeCloseTo(1 / 3);
    expect(getTensionFireIntensity(75)).toBeCloseTo(2 / 3);
    expect(getTensionFireIntensity(100)).toBe(1);
  });

  it("clamps fire intensity to the image opacity range", () => {
    expect(getTensionFireIntensity(-20)).toBe(0);
    expect(getTensionFireIntensity(120)).toBe(1);
  });
});