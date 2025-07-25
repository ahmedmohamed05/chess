import type { Coordinates, Piece, PieceColor, PiecesMap } from "../types";
import calculateValidMoves from "./calculate-valid-moves";
import isValidCoordinates from "./coordinates-range";
import findPiece from "./find-piece";
import isCheckOn from "./is-check";
import { coordinateToKey } from "./key-coordinate-swap";

export default function getPieceMoves(
  pieces: PiecesMap,
  piece: Piece | null,
  turn: PieceColor,
  enPassantTarget: Coordinates | undefined,
  check: boolean
): Coordinates[] {
  if (!piece) return [];

  const possibleMoves = calculateValidMoves(
    pieces,
    piece,
    turn,
    check,
    enPassantTarget
  ).filter((move) => isValidCoordinates(move) && move);

  // King can't move into checks
  if (piece.type === "king") {
    console.log(possibleMoves);

    const demoPieces = new Map(pieces);
    const king = { ...piece };
    const escapingMoves: Coordinates[] = [];
    const originalKingKey = coordinateToKey(king.coordinates);

    possibleMoves.forEach((move) => {
      const demoMoveKey = coordinateToKey(move);
      const demoKingPiece = { ...king, coordinates: move };

      demoPieces.delete(originalKingKey);
      demoPieces.set(demoMoveKey, demoKingPiece);

      if (!isCheckOn(demoPieces, demoKingPiece)) {
        escapingMoves.push(move);
      }

      demoPieces.delete(demoMoveKey);
      demoPieces.set(originalKingKey, king);
    });
    return escapingMoves;
  }

  if (check) {
    // Copy everything to not effect the actual position
    const demoPieces = new Map(pieces);
    const blockingMoves: Coordinates[] = [];
    const king = findPiece(
      demoPieces,
      (p) => p.type === "king" && p.color === turn
    );

    if (!king) throw Error(`${turn} king is missing`);

    // simulate moving the piece to check if it can blocks the 'check'
    possibleMoves.forEach((move) => {
      const demoMoveKey = coordinateToKey(move);
      // copy the piece to re-put it to it's old position, simulating capturing
      const oldPiece = demoPieces.get(demoMoveKey);
      demoPieces.delete(coordinateToKey(piece.coordinates));
      demoPieces.set(demoMoveKey, { ...piece, coordinates: move });

      // If the move can blocks the check then push it
      if (!isCheckOn(demoPieces, king)) blockingMoves.push(move);

      // return the piece to it's old coordinates
      demoPieces.delete(demoMoveKey);
      demoPieces.set(coordinateToKey(piece.coordinates), piece);
      if (oldPiece) demoPieces.set(demoMoveKey, oldPiece);
    });

    return blockingMoves;
  }

  // Check for pinned pieces
  const demoPieces = new Map(pieces);
  const availableMoves: Coordinates[] = [];

  const king = findPiece(
    demoPieces,
    (p) => p.type === "king" && p.color === turn
  );

  if (!king) throw Error(`${turn} king is missing`);

  possibleMoves.forEach((move) => {
    const moveKey = coordinateToKey(move);
    const oldPieceVersion: Piece = { ...piece };
    const oldPiece = demoPieces.get(moveKey);
    demoPieces.delete(coordinateToKey(oldPieceVersion.coordinates));
    const newPiece: Piece = { ...piece, coordinates: move };
    demoPieces.set(moveKey, newPiece);

    // If the move can blocks the check then push it
    if (!isCheckOn(demoPieces, king)) availableMoves.push(move);

    // return the piece to it's old coordinates
    demoPieces.delete(moveKey);
    demoPieces.set(
      coordinateToKey(oldPieceVersion.coordinates),
      oldPieceVersion
    );
    if (oldPiece) demoPieces.set(moveKey, oldPiece);
  });
  return availableMoves;
}
