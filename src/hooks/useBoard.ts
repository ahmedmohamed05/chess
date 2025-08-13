// useBoard.ts
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
import { coordinateToKey } from "../utils/key-coordinate-swap";
import getPieceMoves from "../utils/get-piece-moves";
import isCheckOn from "../utils/is-check";
import findPiece from "../utils/find-piece";
import getDisambiguation from "./helpers/get-disambiguation";
import handleEnPassant from "./helpers/handle-enpassant";
import handleCastling from "./helpers/handle-castling";
import getOpponentColor from "./helpers/get-opponent-color";
import evaluateGameStatus from "./helpers/evaluate-game-status";
import getFEN from "./helpers/fen";

export function useBoard(
  initBoard: BoardState = INIT_BOARD_STATE
): GameController {
  const [board, setBoard] = useState<BoardState>(initBoard);
  const [fenRecords, setFenRecords] = useState<
    { fen: string; times: number }[]
  >([]);

  const selectPiece = useCallback(
    (piece: Piece | null) => {
      if (piece && piece.color !== board.turn) return;

      setBoard((prev) => ({
        ...prev,
        selectedPiece: piece,
        moves: getPieceMoves(
          prev.pieces,
          piece,
          prev.turn,
          prev.enPassantTarget,
          prev.status === "check"
        ),
      }));
    },
    [board.turn]
  );

  const movePiece = useCallback(
    (toPosition: Coordinates) => {
      if (!board.selectedPiece) return;
      const currentPiece = board.selectedPiece;
      if (currentPiece.color !== board.turn) return;

      const { pieces, turn, enPassantTarget, status } = board;
      const pieceMoves = getPieceMoves(
        pieces,
        currentPiece,
        turn,
        enPassantTarget,
        status === "check"
      );

      if (
        !pieceMoves.some((move) => sameCoordinates(move, toPosition)) ||
        sameCoordinates(currentPiece.coordinates, toPosition)
      ) {
        return;
      }

      setBoard((prev) => {
        const newPieces = new Map(prev.pieces);
        let capturedPiece = newPieces.get(coordinateToKey(toPosition));

        const fromPosition = currentPiece.coordinates;
        const { includeFromFile, includeFromRank } = getDisambiguation(
          pieces,
          currentPiece,
          toPosition,
          turn,
          enPassantTarget,
          status
        );

        // En Passant
        capturedPiece =
          capturedPiece ||
          handleEnPassant(
            newPieces,
            currentPiece,
            fromPosition,
            toPosition,
            prev
          );

        // Castling
        const castle = handleCastling(
          newPieces,
          currentPiece,
          fromPosition,
          toPosition
        );

        // Remove captured piece
        if (capturedPiece) {
          newPieces.delete(coordinateToKey(capturedPiece.coordinates));
        }

        // Promotion
        const isPromotion =
          currentPiece.type === "pawn" &&
          (toPosition.rank === 1 || toPosition.rank === 8);

        // Move piece
        newPieces.delete(coordinateToKey(fromPosition));
        newPieces.set(coordinateToKey(toPosition), {
          ...currentPiece,
          coordinates: toPosition,
          hasMoved: true,
        });

        // Check if move causes check
        const opponentKing = findPiece(
          newPieces,
          (p) => p.color === getOpponentColor(turn) && p.type === "king"
        );
        if (!opponentKing)
          throw Error(`${getOpponentColor(turn)} king is missing`);

        const move: Move = {
          piece: currentPiece,
          from: fromPosition,
          to: toPosition,
          captured: capturedPiece,
          isCheck: isCheckOn(newPieces, opponentKing),
          includeFromFile,
          includeFromRank,
          castle,
        };

        return {
          ...prev,
          pieces: newPieces,
          turn: getOpponentColor(prev.turn),
          history: [...prev.history, move],
          moves: [],
          selectedPiece: null,
          enPassantTarget:
            currentPiece.type === "pawn" &&
            Math.abs(fromPosition.rank - toPosition.rank) === 2
              ? {
                  rank: (fromPosition.rank + toPosition.rank) / 2,
                  file: fromPosition.file,
                }
              : undefined,
          promotionPending: isPromotion,
        };
      });
    },
    [board]
  );

  const promotePawn = useCallback(
    (promoteTo: PromotionOption) => {
      if (!board.promotionPending || board.history.length === 0) return;

      const lastMove = board.history.pop()!;
      if (lastMove.piece.type !== "pawn") return;

      setBoard((prev) => {
        const newPieces = new Map(prev.pieces);
        newPieces.set(coordinateToKey(lastMove.to), {
          ...lastMove.piece,
          coordinates: lastMove.to,
          type: promoteTo,
        });

        const opponentKing = findPiece(
          newPieces,
          (p) => p.color === getOpponentColor(prev.turn) && p.type === "king"
        );

        const isCheckAfterPromotion = opponentKing
          ? isCheckOn(newPieces, opponentKing)
          : false;

        const move: Move = {
          ...lastMove,
          promotion: promoteTo,
          isCheck: isCheckAfterPromotion,
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

  // Evaluate game status on changes
  useEffect(() => {
    setBoard((prev) => {
      const { status, kingInCheckPosition } = evaluateGameStatus(prev);
      return { ...prev, status, kingInCheckPosition };
    });
  }, [board.pieces, board.enPassantTarget, board.status, board.turn]);

  useEffect(() => {
    if (!board.history.length) return;

    const fen = getFEN(
      board.pieces,
      board.turn,
      board.enPassantTarget,
      board.history.length
    );
    console.log(fen);
    setFenRecords((prev) => {
      for (const { fen: record } of prev) {
        if (record === fen) {
          console.log("found match");
        }
      }

      return [...prev, { fen, times: 1 }];
    });
  }, [board.pieces, board.turn, board.enPassantTarget, board.history]);

  // useEffect(() => {
  // if (fenRecords.length === 0) return;
  // }, [fenRecords]);

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
    },
    selectPiece,
    movePiece,
    promotePawn,
  };
}
