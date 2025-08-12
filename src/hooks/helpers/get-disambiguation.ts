import type {
  Coordinates,
  GameStatus,
  Piece,
  PieceColor,
  PiecesMap,
} from "../../types";
import sameCoordinates from "../../utils/check-coordinates";
import getPieceMoves from "../../utils/get-piece-moves";

// Determine if move needs file/rank disambiguation
export default function getDisambiguation(
  pieces: PiecesMap,
  currentPiece: Piece,
  toPosition: Coordinates,
  turn: PieceColor,
  enPassantTarget: Coordinates | undefined,
  status: GameStatus
) {
  let includeFromFile = false;
  let includeFromRank = false;

  if (currentPiece.type === "king" || currentPiece.type === "pawn") {
    return { includeFromFile, includeFromRank };
  }

  for (const [, piece] of pieces) {
    if (
      piece.color === turn &&
      piece.type === currentPiece.type &&
      !sameCoordinates(piece.coordinates, currentPiece.coordinates)
    ) {
      const moves = getPieceMoves(
        pieces,
        piece,
        turn,
        enPassantTarget,
        status === "check"
      );

      if (moves.some((m) => sameCoordinates(m, toPosition))) {
        includeFromFile = true;
        includeFromRank = true;
        break;
      }
    }
  }

  return { includeFromFile, includeFromRank };
}
