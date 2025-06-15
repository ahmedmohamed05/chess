import { useCallback, useMemo, useState } from "react";
import type {
  BoardState,
  Coordinates,
  Move,
  Piece,
  PiecesMap,
  useBoardType,
} from "../types";
import { INIT_BOARD_STATE } from "../constants";
import sameCoordinates from "../utils/check-coordinates";
import calculateValidMoves from "../utils/calculate-valid-moves";
import { coordinateToKey } from "../utils/key-coordinate-swap";

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

    const opponentPieces: PiecesMap = new Map();
    for (const [key, piece] of pieces) {
      if (piece.color !== turn) opponentPieces.set(key, piece);
    }

    // TODO: Fix pieceCanSee and re-implement this
    // TODO: Fix it's not removing the moves
    // Remove the move if can't castle
    // const castlingSquares = getCastlingSquares(turn);
    // for (const piece of opponentPieces) {
    //   for (const square of castlingSquares) {
    //     if (pieceCanSee(piece, square)) {
    //       const moveIndex = moves.findIndex((move) =>
    //         sameCoordinates(move, square)
    //       );
    //       if (moveIndex >= 0) {
    //         console.log(38);
    //       }
    //     }
    //   }
    // }

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
        const newPieces = new Map(prev.pieces);
        let capturedPiece = newPieces.get(coordinateToKey(toPosition));

        const move: Move = {
          piece,
          from: fromPosition,
          to: toPosition,
          // captured: capturedIndex >= 0 ? newPieces[capturedIndex] : undefined,
          captured: capturedPiece,
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

          // capturedIndex = newPieces.findIndex((p) =>
          //   sameCoordinates(p.coordinates, capturedPawnCoordinates)
          // );
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
              { ...rook, hasMoved: true }
            );
          }
        }

        // Remove Captured Piece If Exist
        if (capturedPiece)
          newPieces.delete(coordinateToKey(capturedPiece.coordinates));

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
