export function isValidHour(hour: number): boolean {
  return Number.isInteger(hour) && hour >= 0 && hour <= 23;
}

export function isValidRange(startHour: number, endHour: number): boolean {
  return isValidHour(startHour) && isValidHour(endHour) && endHour > startHour;
}

export function rangesOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number,
): boolean {
  return startA < endB && startB < endA;
}

export function containsRange(
  containerStart: number,
  containerEnd: number,
  targetStart: number,
  targetEnd: number,
): boolean {
  return containerStart <= targetStart && containerEnd >= targetEnd;
}
