import type { Coordinates, Piece, PiecesMap } from "../../types";
import { coordinateToKey } from "../../utils/key-coordinate-swap";

// Handle castling logic
export default function handleCastling(
  pieces: PiecesMap,
  currentPiece: Piece,
  fromPosition: Coordinates,
  toPosition: Coordinates
): "short" | "long" | undefined {
  const isCastling =
    currentPiece.type === "king" &&
    Math.abs(fromPosition.file - toPosition.file) === 2;

  if (!isCastling) return undefined;

  const castleType = toPosition.file > fromPosition.file ? "short" : "long";
  const rookRank = currentPiece.color === "light" ? 1 : 8;
  const rookFile = castleType === "short" ? 8 : 1;
  const rookCoords: Coordinates = { rank: rookRank, file: rookFile };
  const newRookFile = castleType === "short" ? 6 : 4;

  const rook = pieces.get(coordinateToKey(rookCoords));
  if (rook?.type === "rook") {
    pieces.delete(coordinateToKey(rookCoords));
    pieces.set(coordinateToKey({ rank: rookRank, file: newRookFile }), {
      ...rook,
      coordinates: { rank: rookRank, file: newRookFile },
      hasMoved: true,
    });
  }

  return castleType;
}
