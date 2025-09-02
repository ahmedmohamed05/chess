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

// TODO: show the original history

export function useBoard(
  initBoard: BoardState = INIT_BOARD_STATE
): GameController {
  const [board, setBoard] = useState<BoardState>(initBoard);
  const [focusedMoveIndex, setFocusedMoveIndex] = useState<null | number>(null);

  // const [fenRecords, setFenRecords] = useState<
  //   { fen: string; times: number }[]
  // >([]);

  const isAtLatestMove = useMemo(
    () =>
      focusedMoveIndex === null ||
      focusedMoveIndex === board.history.length - 1,

    [focusedMoveIndex, board.history]
  );

  const selectPiece = useCallback(
    (piece: Piece | null) => {
      if (piece && piece.color !== board.turn) return;

      if (!isAtLatestMove) return;

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
    [board.turn, isAtLatestMove]
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

        // Update "focusedMoveIndex" to display the new board
        setFocusedMoveIndex(prev.moveFocused + 1);

        return {
          ...prev,
          pieces: newPieces,
          turn: getOpponentColor(prev.turn),
          history: [...prev.history, move],
          moveFocused: prev.moveFocused + 1,
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

  const goToMove = useCallback(
    (index: number) => {
      if (index < -1) return;
      if (index >= board.history.length) return;

      setFocusedMoveIndex(index);
    },
    [board.history]
  );

  const getBoardAtFocusedMove = useCallback(
    (index: number) => {
      // Reset every thing
      const newBoard: BoardState = {
        ...INIT_BOARD_STATE,
        history: [],
        pieces: new Map(INIT_BOARD_STATE.pieces),
      };

      const history = board.history;
      for (let i = 0; i <= index; i++) {
        const move = history[i];
        if (!move) break;

        const moveFromKey = coordinateToKey(move.from);
        const moveToKey = coordinateToKey(move.to);

        if (move.captured) {
          newBoard.pieces.delete(coordinateToKey(move.captured.coordinates));
        }

        if (move.castle === "long" || move.castle === "short") {
          const rookRank = move.piece.color === "light" ? 1 : 8;
          const rookFile = move.castle === "short" ? 8 : 1;
          const rookCoords: Coordinates = { rank: rookRank, file: rookFile };
          const newRookFile = move.castle === "short" ? 6 : 4;
          const rook = newBoard.pieces.get(coordinateToKey(rookCoords));
          if (rook?.type === "rook") {
            newBoard.pieces.delete(coordinateToKey(rookCoords));
            newBoard.pieces.set(
              coordinateToKey({ rank: rookRank, file: newRookFile }),
              {
                ...rook,
                coordinates: { rank: rookRank, file: newRookFile },
                hasMoved: true,
              }
            );
          }
        }

        newBoard.pieces.delete(moveFromKey);
        newBoard.pieces.set(moveToKey, {
          ...move.piece,
          coordinates: move.to,
          hasMoved: true,
        });

        if (move.promotion) {
          newBoard.pieces.set(moveToKey, {
            ...move.piece,
            type: move.promotion,
            coordinates: move.to,
          });
        }

        newBoard.turn = i % 2 === 0 ? "dark" : "light";
        newBoard.history = [...newBoard.history, move];
      }

      newBoard.history = board.history;
      newBoard.moveFocused = index;

      return newBoard;
    },
    [board.history]
  );

  useEffect(() => {
    setBoard((prev) => {
      const { status, kingInCheckPosition } = evaluateGameStatus(prev);
      return { ...prev, status, kingInCheckPosition };
    });
  }, [board.pieces, board.enPassantTarget, board.status, board.turn]);

  //TODO: three time reparation and 50 move draw
  // useEffect(() => {
  //   if (!board.history.length) return;

  //   const fen = getFEN(
  //     board.pieces,
  //     board.turn,
  //     board.enPassantTarget,
  //     board.history.length
  //   );
  //   setFenRecords((prev) => {
  //     for (const { fen: record } of prev) {
  //       if (record === fen) {
  //         console.log("found match");
  //       }
  //     }

  //     return [...prev, { fen, times: 1 }];
  //   });
  // }, [board.pieces, board.turn, board.enPassantTarget, board.history]);

  // useEffect(() => {
  // if (fenRecords.length === 0) return;
  // }, [fenRecords]);

  const displayBoard = isAtLatestMove
    ? board
    : getBoardAtFocusedMove(focusedMoveIndex!);

  return {
    boardState: {
      ...displayBoard,
      validMoves: getPieceMoves(
        board.pieces,
        board.selectedPiece,
        board.turn,
        board.enPassantTarget,
        board.status === "check"
      ),
    },
    selectPiece: (option) => {
      if (!isAtLatestMove) return;
      selectPiece(option);
    },

    promotePawn,
    goToMove,
    // getBoardAtFocusedMove,
    movePiece: (to) => {
      if (!isAtLatestMove) return;
      // if user is looking at past move and tries to move -> branch

      if (
        focusedMoveIndex !== null &&
        focusedMoveIndex < board.history.length - 1
      ) {
        setBoard((prev) => ({
          ...prev,
          history: prev.history.slice(0, focusedMoveIndex + 1),
        }));
        setFocusedMoveIndex(null); // reset back to live play
      }
      movePiece(to);
    },
  };
}
