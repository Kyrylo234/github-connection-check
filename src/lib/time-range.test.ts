import { describe, expect, it } from "vitest";

import {
  formatTimeRange,
  MAX_TIME_RANGE_MINUTES,
  minutesToSliderPosition,
  sliderPositionToMinutes,
  TIME_RANGE_SLIDER_MAX,
} from "@/lib/time-range";

describe("continuous time range slider", () => {
  it("covers ten minutes through thirty days", () => {
    expect(sliderPositionToMinutes(0)).toBe(10);
    expect(sliderPositionToMinutes(TIME_RANGE_SLIDER_MAX)).toBeCloseTo(MAX_TIME_RANGE_MINUTES);
    expect(minutesToSliderPosition(10)).toBe(0);
    expect(minutesToSliderPosition(MAX_TIME_RANGE_MINUTES)).toBeCloseTo(TIME_RANGE_SLIDER_MAX);
  });

  it("round trips intermediate ranges and gives short ranges usable track space", () => {
    for (const minutes of [15, 30, 60, 24 * 60, 7 * 24 * 60]) {
      expect(sliderPositionToMinutes(minutesToSliderPosition(minutes))).toBeCloseTo(minutes);
    }
    expect(minutesToSliderPosition(60)).toBeGreaterThan(200);
    expect(minutesToSliderPosition(60)).toBeLessThan(300);
  });

  it("formats minute, hour and day ranges", () => {
    expect(formatTimeRange(10)).toBe("10 minutes");
    expect(formatTimeRange(90)).toBe("1h 30m");
    expect(formatTimeRange(MAX_TIME_RANGE_MINUTES)).toBe("30 days");
  });
});
