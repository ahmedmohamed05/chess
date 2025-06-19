import type { Piece, PiecesMap } from "../types";
import pieceCanSee from "./does-see";
import getPieces from "./get-all-pieces";

export default function isCheckOn(position: PiecesMap, king: Piece): boolean {
  const opponentPieces = getPieces(position, (p) => p.color !== king.color);
  for (const [, piece] of opponentPieces) {
    if (pieceCanSee(position, piece, king.coordinates)) return true;
  }
  return false;
}
