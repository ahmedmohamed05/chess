import type { CoordinateKey, Coordinates } from "../types";

export function coordinateToKey(coords: Coordinates): CoordinateKey {
  return `${coords.rank},${coords.file}`;
}

export function keyToCoordinate(key: CoordinateKey): Coordinates {
  const [rank, file] = key.split(",").map(Number);
  return { rank, file };
}
