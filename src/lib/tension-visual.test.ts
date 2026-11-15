import { describe, expect, it } from "vitest";
import { getTensionFireIntensity } from "./tension-visual";

describe("tension globe fire intensity", () => {
  it("keeps the globe normal only at zero tension", () => {
    expect(getTensionFireIntensity(0)).toBe(0);
  });

  it("shows a small amount of fire at a score of 10", () => {
    expect(getTensionFireIntensity(10)).toBe(0.1);
  });

  it("increases fire as tension approaches 100", () => {
    expect(getTensionFireIntensity(25)).toBe(0.25);
    expect(getTensionFireIntensity(50)).toBe(0.5);
    expect(getTensionFireIntensity(75)).toBe(0.75);
    expect(getTensionFireIntensity(100)).toBe(1);
  });

  it("clamps fire intensity to the image opacity range", () => {
    expect(getTensionFireIntensity(-20)).toBe(0);
    expect(getTensionFireIntensity(120)).toBe(1);
  });
});