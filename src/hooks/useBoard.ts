import { useCallback, useEffect, useState } from "react";
import type {
  BoardState,
  Coordinates,
  GameController,
  GameStatus,
  Move,
  Piece,
  PromotionOption,
} from "../types";
import { INIT_BOARD_STATE } from "../constants";
import sameCoordinates from "../utils/check-coordinates";
import { coordinateToKey } from "../utils/key-coordinate-swap";
import getPieceMoves from "../utils/get-piece-moves";
import isCheckOn from "../utils/is-check";
import findPiece from "../utils/find-piece";

export function useBoard(
  initBoard: BoardState = INIT_BOARD_STATE
): GameController {
  const [board, setBoard] = useState<BoardState>(initBoard);

  const selectPiece = useCallback(
    (piece: Piece | null) => {
      // Prevent selecting opponent's pieces
      if (piece && piece.color !== board.turn) return;

      setBoard((prev) => {
        return {
          ...prev,
          selectedPiece: piece,
          moves: getPieceMoves(
            prev.pieces,
            piece,
            prev.turn,
            prev.enPassantTarget,
            prev.status === "check"
          ),
        };
      });
    },
    [board.turn]
  );

  const movePiece = useCallback(
    (toPosition: Coordinates) => {
      if (!board.selectedPiece) return;
      if (board.selectedPiece.color !== board.turn) return;

      const pieceMoves = getPieceMoves(
        board.pieces,
        board.selectedPiece,
        board.turn,
        board.enPassantTarget,
        board.status === "check"
      );

      // Double Check For Valid Moves
      const isValidMove = pieceMoves.some((move) =>
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
          isCheck: false,
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

        const opponentColor = prev.turn === "light" ? "dark" : "light";
        const opponentKing = findPiece(
          newPieces,
          (p) => p.color === opponentColor && p.type === "king"
        );
        if (!opponentKing) throw Error(`${opponentColor} King is missing`);
        const isCheckAfterMove = isCheckOn(newPieces, opponentKing);

        move.isCheck = isCheckAfterMove;

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
    [
      board.selectedPiece,
      board.turn,
      board.enPassantTarget,
      board.pieces,
      board.status,
    ]
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

        // 🔑 Check opponent's king AFTER promotion
        const opponentColor = prev.turn === "light" ? "dark" : "light";
        const opponentKing = findPiece(
          newPieces,
          (p) => p.color === opponentColor && p.type === "king"
        );
        const isCheckAfterPromotion = opponentKing
          ? isCheckOn(newPieces, opponentKing)
          : undefined;

        const move: Move = {
          ...lastMove,
          promotion: promoteTo,
          isCheck: isCheckAfterPromotion !== undefined,
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

  // Game Status Checks
  useEffect(() => {
    const pieces = board.pieces;
    const enPassantTarget = board.enPassantTarget;
    const status = board.status;
    const turn = board.turn;

    const myKing = findPiece(
      pieces,
      (p) => p.color === turn && p.type === "king"
    );
    if (!myKing) throw Error(`${turn} kings is missing`);

    const isCheck = isCheckOn(board.pieces, myKing)
      ? myKing.coordinates
      : undefined;

    let newStatus: GameStatus = "playing";
    let hasAnyMoves = false;
    for (const [, piece] of pieces) {
      if (piece.color === myKing.color) {
        const pieceMoves = getPieceMoves(
          pieces,
          piece,
          turn,
          enPassantTarget,
          status === "check"
        );
        if (pieceMoves.length !== 0) {
          hasAnyMoves = true;
          break;
        }
      }
    }
    if (!hasAnyMoves) {
      if (isCheck) newStatus = "checkmate";
      else newStatus = "stalemate";
    }
    // TODO check for draws, (three times repetition, just kings, bishop and a king)
    // Draw Only Kings left
    else if (pieces.size === 2) {
      const opponentKing = findPiece(
        pieces,
        (p) => p.color !== turn && p.type === "king"
      );
      if (!opponentKing)
        throw Error(`${turn == "light" ? "Light" : "Dark"} kings is missing`);
      newStatus = "draw";
    }

    setBoard((prev) => {
      return {
        ...prev,
        status: newStatus,
        kingInCheckPosition: isCheck,
      };
    });
  }, [board.pieces, board.enPassantTarget, board.status, board.turn]);

  return {
    boardState: {
      ...board,
      validMoves: getPieceMoves(
        board.pieces,
        board.selectedPiece,
        board.turn,
        board.enPassantTarget,
        board.status === "check"
      ),
    }, // Need to re-reference moves array to apply highlight on it
    selectPiece,
    movePiece,
    promotePawn,
  };
}
