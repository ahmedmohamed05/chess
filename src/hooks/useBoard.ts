import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  BoardState,
  Coordinates,
  GameController,
  Move,
  Piece,
  PromotionOption,
} from "../types";
import { INIT_BOARD_STATE } from "../constants";
import sameCoordinates from "../utils/check-coordinates";
import calculateValidMoves from "../utils/calculate-valid-moves";
import { coordinateToKey } from "../utils/key-coordinate-swap";
import findPiece from "../utils/find-piece";
import isCheckOn from "../utils/is-check";

export function useBoard(
  initBoard: BoardState = INIT_BOARD_STATE
): GameController {
  const [board, setBoard] = useState<BoardState>(initBoard);

  const validMoves: Coordinates[] = useMemo(() => {
    if (!board.selectedPiece) return [];

    const pieces = board.pieces;
    const piece = board.selectedPiece;
    const turn = board.turn;
    const enPassantTarget = board.enPassantTarget;

    const possibleMoves = calculateValidMoves(
      pieces,
      piece,
      turn,
      enPassantTarget
    );

    // King can't move into checks
    if (piece.type === "king") {
      const demoPieces = new Map(board.pieces);
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

    if (board.status === "check") {
      // Copy everything to not effect the actual position
      const demoPieces = new Map(board.pieces);
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
    const demoPieces = new Map(board.pieces);
    const availableMoves: Coordinates[] = [];

    const king = findPiece(
      demoPieces,
      (p) => p.type === "king" && p.color === turn
    );

    if (!king) throw Error(`${turn} king is missing`);

    possibleMoves.forEach((move) => {
      const oldPiece: Piece = { ...piece };
      demoPieces.delete(coordinateToKey(oldPiece.coordinates));
      const newPiece: Piece = { ...piece, coordinates: move };
      demoPieces.set(coordinateToKey(move), newPiece);

      // If the move can blocks the check then push it
      if (!isCheckOn(demoPieces, king)) availableMoves.push(move);

      // return the piece to it's old coordinates
      demoPieces.delete(coordinateToKey(move));
      demoPieces.set(coordinateToKey(oldPiece.coordinates), oldPiece);
    });
    return availableMoves;
  }, [
    board.pieces,
    board.selectedPiece,
    board.turn,
    board.enPassantTarget,
    board.status,
  ]);

  const selectPiece = useCallback(
    (piece: Piece | null) => {
      // Prevent selecting opponent's pieces
      if (piece && piece.color !== board.turn) return;

      setBoard((prev) => {
        return {
          ...prev,
          selectedPiece: piece,
          moves: validMoves,
        };
      });
    },
    [board.turn, validMoves]
  );

  const movePiece = useCallback(
    (toPosition: Coordinates) => {
      if (!board.selectedPiece) return;
      if (board.selectedPiece.color !== board.turn) return;

      const isValidMove = validMoves.some((move) =>
        sameCoordinates(move, toPosition)
      );
      if (!isValidMove) return;

      const piece = board.selectedPiece!;
      const fromPosition = piece.coordinates;

      // Prevent Moving The Same Square
      if (sameCoordinates(fromPosition, toPosition)) return;

      setBoard((prev) => {
        const newPieces = new Map(prev.pieces);
        let capturedPiece = newPieces.get(coordinateToKey(toPosition));

        const move: Move = {
          piece,
          from: fromPosition,
          to: toPosition,
          captured: capturedPiece,
        };

        // Special Moves (En Passant, Castling and Promotion)

        // Setting En Passant Target
        const enPassantTarget =
          piece.type === "pawn" &&
          Math.abs(fromPosition.rank - toPosition.rank) === 2
            ? ({
                rank: (fromPosition.rank + toPosition.rank) / 2,
                file: fromPosition.file,
              } as Coordinates)
            : undefined;

        const isEnPassant =
          piece.type === "pawn" &&
          prev.enPassantTarget &&
          sameCoordinates(prev.enPassantTarget, toPosition);

        if (isEnPassant) {
          // It's not undefined because it's can move
          const pawn = newPieces.get(coordinateToKey(fromPosition))!;

          // Deleting the old one and setting new one with new coordinates
          newPieces.delete(coordinateToKey(pawn.coordinates));
          newPieces.set(coordinateToKey(toPosition), {
            ...pawn,
            coordinates: toPosition,
          });

          const capturedPawnCoordinates =
            prev.history[prev.history.length - 1].to; // En-Passant Must Apply On The Last Pawn Move

          capturedPiece = newPieces.get(
            coordinateToKey(capturedPawnCoordinates)
          );
        }

        const isCastling =
          piece.type === "king" &&
          Math.abs(fromPosition.file - toPosition.file) === 2; // Two squares King Move Means Castling
        if (isCastling) {
          move.castle = toPosition.file > fromPosition.file ? "short" : "long";
          const rookRank = piece.color === "light" ? 1 : 8;
          const rookFile = move.castle === "short" ? 8 : 1;
          const rookCoords: Coordinates = { rank: rookRank, file: rookFile };
          const newRookFile = move.castle === "short" ? 6 : 4;

          const rook = newPieces.get(coordinateToKey(rookCoords));
          if (rook && rook.type == "rook") {
            newPieces.delete(coordinateToKey(rookCoords));
            newPieces.set(
              coordinateToKey({ rank: rookRank, file: newRookFile }),
              {
                ...rook,
                coordinates: { rank: rookRank, file: newRookFile },
                hasMoved: true,
              }
            );
          }
        }

        // Remove Captured Piece If Exist
        if (capturedPiece)
          newPieces.delete(coordinateToKey(capturedPiece.coordinates));

        const isPromotion =
          piece.type === "pawn" &&
          (toPosition.rank === 1 || toPosition.rank === 8);

        // Moving Actual Piece
        newPieces.delete(coordinateToKey(fromPosition));
        newPieces.set(coordinateToKey(toPosition), {
          ...piece,
          coordinates: toPosition,
          hasMoved: true,
        });

        return {
          ...prev,
          pieces: newPieces,
          turn: prev.turn === "light" ? "dark" : "light",
          history: [...prev.history, move],
          moves: [],
          selectedPiece: null,
          enPassantTarget,
          promotionPending: isPromotion,
        };
      });
    },
    [board.selectedPiece, validMoves, board.turn]
  );

  const promotePawn = useCallback(
    (promoteTo: PromotionOption) => {
      if (!board.promotionPending) return;
      if (board.history.length === 0) return;

      const lastMove = board.history.pop()!; // we check the array is not empty
      const pawn = lastMove.piece;
      if (pawn.type !== "pawn") return;

      setBoard((prev) => {
        const newPieces = new Map(prev.pieces);

        // Overwrite The Pawn From The Board
        newPieces.set(coordinateToKey(lastMove.to), {
          ...pawn,
          coordinates: lastMove.to,
          type: promoteTo,
        });

        const move: Move = {
          ...lastMove,
          promotion: promoteTo,
        };

        return {
          ...prev,
          pieces: newPieces,
          moves: [],
          history: [...prev.history, move],
          selectedPiece: null,
          status: "playing",
          promotionPending: false,
        };
      });
    },
    [board.promotionPending, board.history]
  );

  // Kings Checks
  useEffect(() => {
    setBoard((prev) => {
      const myKing = findPiece(
        prev.pieces,
        (p) => p.color === prev.turn && p.type === "king"
      );

      if (!myKing) throw Error(`${prev.turn} kings is missing`);

      const checkOn = isCheckOn(prev.pieces, myKing)
        ? myKing.coordinates
        : undefined;

      // TODO check for checkmates
      // if (checkOn) {

      // }

      // TODO check for stalemate
      // TODO check for draws, (three times repetition, just kings, bishop and a king)

      return {
        ...prev,
        status: checkOn ? "check" : "playing",
        kingInCheckPosition: checkOn,
      };
    });
  }, [board.turn]);

  return {
    boardState: { ...board, validMoves }, // Need to re-reference moves array to apply highlight on it
    selectPiece,
    movePiece,
    promotePawn,
  };
}
