import type { JourneyLocationSnapshot, JourneyState } from "../domain/types.js";
import { AppError } from "../errors/app-error.js";
import type { ThemeMap } from "../theme/types.js";

export function calculateJourneyState(
  xp: number,
  map: ThemeMap,
  targetXP = map.targetXP
): JourneyState {
  validateInputs(xp, map, targetXP);

  const cappedXP = Math.min(xp, targetXP);
  const progressPercent = roundToOneDecimal((cappedXP / targetXP) * 100);
  const effectiveLocations = scaleJourneyLocations(map, targetXP);
  const currentLocation = findCurrentLocation(cappedXP, effectiveLocations);
  const nextLocation = findNextLocation(cappedXP, effectiveLocations);
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
    segmentProgressPercent,
    effectiveLocations
  };
}

export function scaleJourneyLocations(map: ThemeMap, targetXP: number): JourneyLocationSnapshot[] {
  return map.locations.map((location, index) => ({
    id: location.id,
    name: location.name,
    requiredXP:
      index === 0
        ? 0
        : index === map.locations.length - 1
          ? targetXP
          : Math.round((location.requiredXP / map.targetXP) * targetXP),
    x: location.x
  }));
}

function findCurrentLocation(
  xp: number,
  locations: JourneyLocationSnapshot[]
): JourneyLocationSnapshot {
  return locations.reduce((current, location) => {
    return location.requiredXP <= xp ? location : current;
  }, locations[0]);
}

function findNextLocation(
  xp: number,
  locations: JourneyLocationSnapshot[]
): JourneyLocationSnapshot | undefined {
  return locations.find((location) => location.requiredXP > xp);
}

function calculateSegmentProgressPercent(
  xp: number,
  currentLocation: JourneyLocationSnapshot,
  nextLocation: JourneyLocationSnapshot | undefined
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
  currentLocation: JourneyLocationSnapshot,
  nextLocation: JourneyLocationSnapshot | undefined,
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
    throw new AppError("JOURNEY_INVALID_XP", "Journey XP must be a non-negative number.");
  }

  if (!Number.isFinite(targetXP) || targetXP <= 0) {
    throw new AppError("JOURNEY_INVALID_TARGET", "Journey target XP must be greater than zero.");
  }

  if (map.locations.length === 0) {
    throw new AppError("JOURNEY_INVALID_MAP", "Journey map must contain at least one location.");
  }
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}
