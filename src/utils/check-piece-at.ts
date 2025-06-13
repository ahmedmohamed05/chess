import type { Coordinates, Piece } from "../types";
import getPiece from "./get-piece";

export default function checkPieceAt(pieces: Piece[], position: Coordinates) {
  return getPiece(pieces, position) !== null;
}
