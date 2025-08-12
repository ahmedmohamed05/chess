import type { Coordinates, Move, PieceColor, PiecesMap } from "../../types";
import { coordinateToKey } from "../../utils/key-coordinate-swap";

export default function getFEN(
  pieces: PiecesMap,
  turn: PieceColor,
  enPassantTarget: Coordinates | undefined
): string {
  let fen = "";

  // Convert the map to array
  for (let rank = 8; rank >= 1; rank--) {
    let emptySquares = 0;
    for (let file = 8; file >= 1; file--) {
      const key = coordinateToKey({ rank, file });
      const pieceOnSquare = pieces.get(key);
      if (pieceOnSquare) {
        if (emptySquares !== 0) fen += emptySquares.toString();
      } else emptySquares++;
    }
  }

  return fen;
}
