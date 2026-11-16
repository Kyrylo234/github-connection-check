export const MIN_TIME_RANGE_MINUTES = 10;
export const MAX_TIME_RANGE_MINUTES = 30 * 24 * 60;
export const TIME_RANGE_SLIDER_MAX = 1000;

export function clampTimeRangeMinutes(minutes: number) {
  if (!Number.isFinite(minutes)) return MAX_TIME_RANGE_MINUTES;
  return Math.max(MIN_TIME_RANGE_MINUTES, Math.min(MAX_TIME_RANGE_MINUTES, minutes));
}

/** A logarithmic scale gives short ranges enough room to adjust precisely. */
export function sliderPositionToMinutes(position: number) {
  const fraction = Math.max(0, Math.min(1, position / TIME_RANGE_SLIDER_MAX));
  return MIN_TIME_RANGE_MINUTES * (MAX_TIME_RANGE_MINUTES / MIN_TIME_RANGE_MINUTES) ** fraction;
}

export function minutesToSliderPosition(minutes: number) {
  const fraction = Math.log(clampTimeRangeMinutes(minutes) / MIN_TIME_RANGE_MINUTES) / Math.log(MAX_TIME_RANGE_MINUTES / MIN_TIME_RANGE_MINUTES);
  return fraction * TIME_RANGE_SLIDER_MAX;
}

export function formatTimeRange(minutes: number) {
  const roundedMinutes = Math.round(clampTimeRangeMinutes(minutes));
  if (roundedMinutes < 60) return `${roundedMinutes} minutes`;
  if (roundedMinutes < 24 * 60) {
    const hours = Math.floor(roundedMinutes / 60);
    const remainder = roundedMinutes % 60;
    return remainder ? `${hours}h ${remainder}m` : `${hours} hours`;
  }
  const roundedHours = Math.round(roundedMinutes / 60);
  const days = Math.floor(roundedHours / 24);
  const remainder = roundedHours % 24;
  return remainder ? `${days}d ${remainder}h` : `${days} days`;
}
