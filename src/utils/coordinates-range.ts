import type { Coordinates } from "../types";

export default function isValidCoordinates(coordinates: Coordinates) {
  const { rank, file } = coordinates;
  return 1 <= rank && rank <= 8 && 1 <= file && file <= 8;
}
