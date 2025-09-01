import type { Piece } from "../types";
import sameCoordinates from "./check-coordinates";

export default function samePiece(p1: Piece, p2: Piece): boolean {
  return (
    p1.type === p2.type &&
    p1.color === p2.color &&
    sameCoordinates(p1.coordinates, p2.coordinates) &&
    p1.hasMoved === p2.hasMoved
  );
}
