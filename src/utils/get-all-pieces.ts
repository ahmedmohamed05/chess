import type { Piece, PiecesMap } from "../types";

export default function getPieces(
  pieces: PiecesMap,
  predict: (p: Piece) => boolean
) {
  const result: PiecesMap = new Map();
  for (const [key, piece] of pieces) {
    if (predict(piece)) result.set(key, piece);
  }

  return result;
}
