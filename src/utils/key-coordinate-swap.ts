import type { Coordinates, PositionKey } from "../types";

export function coordinateToKey(coords: Coordinates): PositionKey {
  return `${coords.file},${coords.rank}`;
}

export function keyToCoordinate(key: PositionKey): Coordinates {
  const [file, rank] = key.split(",").map(Number);
  return { file, rank };
}
