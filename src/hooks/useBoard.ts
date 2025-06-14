import { useCallback, useMemo, useState } from "react";
import type { BoardState, Coordinates, Move, Piece } from "../types";
import { INIT_BOARD_STATE } from "../constants";
import sameCoordinates from "../utils/check-coordinates";
import calculateValidMoves from "../utils/calculate-valid-moves";

export function useBoard(initBoard: BoardState = INIT_BOARD_STATE) {
  const [board, setBoard] = useState(initBoard);

  const validMoves = useMemo(() => {
    if (board.selectedPiece) {
      return calculateValidMoves(
        board.pieces,
        board.selectedPiece,
        board.turn,
        board.enPassantTarget
      );
    }
    return [];
  }, [board.pieces, board.selectedPiece, board.turn, board.enPassantTarget]);

  const selectPiece = useCallback(
    (piece: Piece | null) => {
      // Prevent selecting opponent's pieces
      if (piece && piece.color !== board.turn) return;
      setBoard((prev) => {
        return {
          ...prev,
          selectedPiece: piece,
          validMoves,
        };
      });
    },
    [board.turn, validMoves]
  );

  const movePiece = useCallback(
    (toPosition: Coordinates) => {
      if (!board.selectedPiece) return;

      const isValidMove = validMoves.some((move) =>
        sameCoordinates(move, toPosition)
      );
      if (!isValidMove) return;

      const piece = board.selectedPiece!;
      const fromPosition = piece.coordinates;

      setBoard((prev) => {
        const newPieces = [...prev.pieces];
        let capturedIndex = newPieces.findIndex((p) =>
          sameCoordinates(p.coordinates, toPosition)
        );

        // Prevent Moving The Same Square
        if (sameCoordinates(fromPosition, toPosition)) return prev;

        const move: Move = {
          piece: piece,
          from: fromPosition,
          to: toPosition,
          captured: capturedIndex >= 0 ? newPieces[capturedIndex] : undefined,
        };

        const pieceIndex = newPieces.findIndex((p) =>
          sameCoordinates(p.coordinates, fromPosition)
        );

        newPieces[pieceIndex] = {
          ...newPieces[pieceIndex],
          coordinates: toPosition,
          hasMoved: true,
        };

        // Castling
        const isCastling = Math.abs(fromPosition.file - toPosition.file) === 2; // Two squares
        if (piece.type === "king" && isCastling) {
          move.castle = toPosition.file > fromPosition.file ? "short" : "long";

          const rookFile = move.castle === "short" ? 8 : 1;
          const newRookFile = move.castle === "short" ? 6 : 4;
          const rookRank = piece.color === "light" ? 1 : 8;

          const rookIndex = newPieces.findIndex(
            (p) =>
              p.type === "rook" &&
              sameCoordinates(p.coordinates, { rank: rookRank, file: rookFile })
          );
          newPieces[rookIndex] = {
            ...newPieces[rookIndex],
            coordinates: { rank: rookRank, file: newRookFile },
            hasMoved: true,
          };
        }

        // Setting En Passant Target
        const enPassantTarget: Coordinates | undefined =
          piece.type === "pawn" &&
          Math.abs(fromPosition.rank - toPosition.rank) === 2
            ? {
                rank: (fromPosition.rank + toPosition.rank) / 2,
                file: fromPosition.file,
              }
            : undefined;

        // En Passant
        if (
          piece.type === "pawn" &&
          prev.enPassantTarget &&
          sameCoordinates(prev.enPassantTarget, toPosition)
        ) {
          const pawnIndex = newPieces.findIndex((p) =>
            sameCoordinates(p.coordinates, fromPosition)
          );
          newPieces[pawnIndex] = {
            ...newPieces[pawnIndex],
            coordinates: toPosition,
            hasMoved: true,
          };

          const capturedPawnCoordinates =
            prev.history[prev.history.length - 1].to;

          capturedIndex = newPieces.findIndex((p) =>
            sameCoordinates(p.coordinates, capturedPawnCoordinates)
          );
        }

        // Remove Captured Piece
        if (capturedIndex >= 0) newPieces.splice(capturedIndex, 1);

        return {
          pieces: newPieces,
          turn: prev.turn === "light" ? "dark" : "light",
          history: [...prev.history, move],
          validMoves: [],
          selectedPiece: null,
          status: "playing",
          enPassantTarget,
        };
      });
    },
    [board.selectedPiece, validMoves]
  );

  return {
    board: { ...board, validMoves },
    selectPiece,
    movePiece,
  };
}
