import type { JourneyState } from "../domain/types.js";
import type { ThemeMap, ThemeMapLocation } from "../theme/types.js";

export function calculateJourneyState(
  xp: number,
  map: ThemeMap,
  targetXP = map.targetXP
): JourneyState {
  validateInputs(xp, map, targetXP);

  const cappedXP = Math.min(xp, targetXP);
  const progressPercent = roundToOneDecimal((cappedXP / targetXP) * 100);
  const currentLocation = findCurrentLocation(cappedXP, map.locations);
  const nextLocation = findNextLocation(cappedXP, map.locations);
  const segmentProgressPercent = calculateSegmentProgressPercent(
    cappedXP,
    currentLocation,
    nextLocation
  );
  const characterX = calculateCharacterX(currentLocation, nextLocation, segmentProgressPercent);

  return {
    xp,
    targetXP,
    progressPercent,
    currentLocationId: currentLocation.id,
    currentLocationName: currentLocation.name,
    nextLocationId: nextLocation?.id,
    nextLocationName: nextLocation?.name,
    characterX,
    segmentProgressPercent
  };
}

function findCurrentLocation(xp: number, locations: ThemeMapLocation[]): ThemeMapLocation {
  return locations.reduce((current, location) => {
    return location.requiredXP <= xp ? location : current;
  }, locations[0]);
}

function findNextLocation(
  xp: number,
  locations: ThemeMapLocation[]
): ThemeMapLocation | undefined {
  return locations.find((location) => location.requiredXP > xp);
}

function calculateSegmentProgressPercent(
  xp: number,
  currentLocation: ThemeMapLocation,
  nextLocation: ThemeMapLocation | undefined
): number {
  if (!nextLocation) {
    return 100;
  }

  const segmentXP = nextLocation.requiredXP - currentLocation.requiredXP;

  if (segmentXP <= 0) {
    return 100;
  }

  return roundToOneDecimal(((xp - currentLocation.requiredXP) / segmentXP) * 100);
}

function calculateCharacterX(
  currentLocation: ThemeMapLocation,
  nextLocation: ThemeMapLocation | undefined,
  segmentProgressPercent: number
): number {
  if (!nextLocation) {
    return currentLocation.x;
  }

  const progress = segmentProgressPercent / 100;
  return roundToOneDecimal(currentLocation.x + (nextLocation.x - currentLocation.x) * progress);
}

function validateInputs(xp: number, map: ThemeMap, targetXP: number): void {
  if (!Number.isFinite(xp) || xp < 0) {
    throw new Error("Journey XP must be a non-negative number.");
  }

  if (!Number.isFinite(targetXP) || targetXP <= 0) {
    throw new Error("Journey target XP must be greater than zero.");
  }

  if (map.locations.length === 0) {
    throw new Error("Journey map must contain at least one location.");
  }
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}
