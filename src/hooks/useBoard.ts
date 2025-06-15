import { useCallback, useMemo, useState } from "react";
import type {
  BoardState,
  Coordinates,
  Move,
  Piece,
  useBoardType,
} from "../types";
import { INIT_BOARD_STATE } from "../constants";
import sameCoordinates from "../utils/check-coordinates";
import calculateValidMoves from "../utils/calculate-valid-moves";
import getCastlingSquares from "../utils/get-castling-squares";
import pieceCanSee from "../utils/does-see";

export function useBoard(
  initBoard: BoardState = INIT_BOARD_STATE
): useBoardType {
  const [board, setBoard] = useState<BoardState>(initBoard);

  const validMoves: Coordinates[] = useMemo(() => {
    if (!board.selectedPiece) return [];

    const pieces = board.pieces;
    const piece = board.selectedPiece;
    const turn = board.turn;
    const enPassantTarget = board.enPassantTarget;

    const moves = calculateValidMoves(pieces, piece, turn, enPassantTarget);

    if (piece.type !== "king") return moves;
    if (piece.hasMoved) return moves;

    const castlingSquares = getCastlingSquares(turn);
    const opponentPieces = pieces.filter((p) => p.color !== turn);

    // TODO: Fix it's not removing the moves
    // Remove the move if can't castle
    for (const piece of opponentPieces) {
      for (const square of castlingSquares) {
        // if (piece.type === "knight") console.log(square, piece);
        if (pieceCanSee(piece, square)) {
          const moveIndex = moves.findIndex((move) =>
            sameCoordinates(move, square)
          );
          if (moveIndex >= 0) {
            console.log(38);
          }
        }
      }
    }

    return moves;
  }, [board.pieces, board.selectedPiece, board.turn, board.enPassantTarget]);

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

  // TODO: fix castling
  const movePiece = useCallback(
    (toPosition: Coordinates) => {
      if (!board.selectedPiece) return;

      const isValidMove = validMoves.some((move) =>
        sameCoordinates(move, toPosition)
      );
      if (!isValidMove) return;

      if (board.status === "check" && board.selectedPiece.type !== "king")
        return;

      // TODO: blocking check with other pieces

      // TODO: Discover check

      const piece = board.selectedPiece!;
      const fromPosition = piece.coordinates;

      // Prevent Moving The Same Square
      if (sameCoordinates(fromPosition, toPosition)) return;

      setBoard((prev) => {
        const newPieces = [...prev.pieces];

        let capturedIndex = newPieces.findIndex((p) =>
          sameCoordinates(p.coordinates, toPosition)
        );

        const move: Move = {
          piece: piece,
          from: fromPosition,
          to: toPosition,
          captured: capturedIndex >= 0 ? newPieces[capturedIndex] : undefined,
        };

        // Special Moves (En Passant, Castling and Promotion)

        // TODO: Test if he missed the first en passant
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
        } else if (prev.castling) {
          const newFile = toPosition.file;
          const oldFile = fromPosition.file;
          move.castle = newFile > oldFile ? "short" : "long";

          const rookFile = move.castle === "short" ? 8 : 1;
          const newRookFile = move.castle === "short" ? 6 : 4;
          const rookRank = piece.color === "light" ? 1 : 8;

          const rookIndex = newPieces.findIndex(
            (p) =>
              p.type === "rook" &&
              sameCoordinates(p.coordinates, { rank: rookRank, file: rookFile })
          );
          console.log(newPieces[rookIndex]);
          newPieces[rookIndex] = {
            ...newPieces[rookIndex],
            coordinates: { rank: rookRank, file: newRookFile },
            hasMoved: true,
          };
        } else {
          // Moving Actual Piece
          const pieceIndex = newPieces.findIndex((p) =>
            sameCoordinates(p.coordinates, fromPosition)
          );
          newPieces[pieceIndex] = {
            ...newPieces[pieceIndex],
            coordinates: toPosition,
            hasMoved: true,
          };
        }

        // Remove Captured Piece
        if (capturedIndex >= 0) newPieces.splice(capturedIndex, 1);

        return {
          ...prev,
          pieces: newPieces,
          turn: prev.turn === "light" ? "dark" : "light",
          history: [...prev.history, move],
          moves: [],
          selectedPiece: null,
          status: "playing",
          enPassantTarget,
        };
      });
    },
    [board.selectedPiece, validMoves, board.status]
  );

  return {
    board: { ...board, moves: validMoves }, // Need to re-reference moves array to apply highlight on it
    selectPiece,
    movePiece,
  };
}
