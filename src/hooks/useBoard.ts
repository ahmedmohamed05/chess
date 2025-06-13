import { useCallback, useMemo, useState } from "react";
import type { BoardState, Coordinates, Move, Piece } from "../types";
import { INIT_BOARD_STATE } from "../constants";
import sameCoordinates from "../utils/check-coordinates";
import calculateValidMoves from "../utils/calculate-valid-moves";

export function useBoard(initBoard: BoardState = INIT_BOARD_STATE) {
  const [board, setBoard] = useState(initBoard);

  const validMoves = useMemo(() => {
    if (board.selectedPiece) {
      return calculateValidMoves(board.pieces, board.selectedPiece, board.turn);
    }
    return [];
  }, [board.pieces, board.selectedPiece, board.turn]);

  const selectPiece = useCallback(
    (piece: Piece) => {
      // Prevent selecting opponent's pieces
      if (piece.color !== board.turn) return;
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

      const selectedPiece = board.selectedPiece!;
      const fromPosition = selectedPiece.coordinates;

      setBoard((prev) => {
        const newPieces = [...prev.pieces];
        const capturedIndex = newPieces.findIndex((p) =>
          sameCoordinates(p.coordinates, toPosition)
        );

        // Prevent the piece from itself
        if (sameCoordinates(fromPosition, toPosition)) return prev;

        const move: Move = {
          piece: selectedPiece,
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

        if (capturedIndex >= 0) {
          newPieces.splice(capturedIndex, 1);
        }

        // TODO: Handle special moves castling, en passant and promotion

        return {
          pieces: newPieces,
          turn: prev.turn === "light" ? "dark" : "light",
          history: [...prev.history, move],
          validMoves: [],
          selectedPiece: null,
          status: "playing",
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
