import type { BoardState, Coordinates, GameStatus } from "../../types";
import findPiece from "../../utils/find-piece";
import getPieceMoves from "../../utils/get-piece-moves";
import isCheckOn from "../../utils/is-check";

// Evaluate game status after move
export default function evaluateGameStatus(board: BoardState): {
  status: GameStatus;
  kingInCheckPosition?: Coordinates;
} {
  const { pieces, turn, enPassantTarget, status: prevStatus } = board;

  const myKing = findPiece(
    pieces,
    (p) => p.color === turn && p.type === "king"
  );
  if (!myKing) throw Error(`${turn} king is missing`);

  const isCheck = isCheckOn(pieces, myKing) ? myKing.coordinates : undefined;

  let newStatus: GameStatus = "playing";
  let hasAnyMoves = false;

  for (const [, piece] of pieces) {
    if (piece.color === myKing.color) {
      const moves = getPieceMoves(
        pieces,
        piece,
        turn,
        enPassantTarget,
        prevStatus === "check"
      );
      if (moves.length > 0) {
        hasAnyMoves = true;
        break;
      }
    }
  }

  if (!hasAnyMoves) {
    newStatus = isCheck ? "checkmate" : "stalemate";
  } else if (pieces.size === 2) {
    newStatus = "draw";
  } else if (isCheck) {
    newStatus = "check";
  }

  return { status: newStatus, kingInCheckPosition: isCheck };
}
