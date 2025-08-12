import type { BoardState, Coordinates, Piece, PiecesMap } from "../../types";
import sameCoordinates from "../../utils/check-coordinates";
import { coordinateToKey } from "../../utils/key-coordinate-swap";

// Handle en passant logic
export default function handleEnPassant(
  pieces: PiecesMap,
  currentPiece: Piece,
  fromPosition: Coordinates,
  toPosition: Coordinates,
  prevBoard: BoardState
) {
  let capturedPiece: Piece | undefined;

  const isEnPassant =
    currentPiece.type === "pawn" &&
    prevBoard.enPassantTarget &&
    sameCoordinates(prevBoard.enPassantTarget, toPosition);

  if (isEnPassant) {
    const pawn = pieces.get(coordinateToKey(fromPosition))!;
    pieces.delete(coordinateToKey(pawn.coordinates));
    pieces.set(coordinateToKey(toPosition), {
      ...pawn,
      coordinates: toPosition,
    });

    const capturedPawnCoords =
      prevBoard.history[prevBoard.history.length - 1].to;
    capturedPiece = pieces.get(coordinateToKey(capturedPawnCoords));
  }

  return capturedPiece;
}
