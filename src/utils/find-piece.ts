import type { Piece, PiecesMap } from "../types";

export default function findPiece(
  pieces: PiecesMap,
  predict: (p: Piece) => boolean
) {
  for (const [, piece] of pieces) {
    if (predict(piece)) return piece;
  }
  return undefined;
}
