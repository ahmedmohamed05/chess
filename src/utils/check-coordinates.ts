import type { Coordinates } from "../types";

export default function sameCoordinates(a: Coordinates, b: Coordinates) {
  return a.rank == b.rank && a.file == b.file;
}
