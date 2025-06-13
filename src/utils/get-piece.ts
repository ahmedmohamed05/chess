import type { Coordinates, Piece } from "../types";
import sameCoordinates from "./check-coordinates";

export default function getPiece(pieces: Piece[], coordinates: Coordinates) {
  return (
    pieces.find((p) => sameCoordinates(p.coordinates, coordinates)) ?? null
  );
}
