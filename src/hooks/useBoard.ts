import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type BoardState,
  type Coordinates,
  type FenMap,
  type GameController,
  type Move,
  type Piece,
  type PiecesMap,
  type PromotionOption,
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
  const [focusedMoveIndex, setFocusedMoveIndex] = useState<null | number>(null);
  const [fenMap, setFenMap] = useState<FenMap>(new Map());

  // Store boolean value if we are at the last move, To allow selecting and moving pieces
  const isAtLatestMove = useMemo(
    () =>
      focusedMoveIndex === null ||
      focusedMoveIndex === board.history.length - 1,
    [focusedMoveIndex, board.history]
  );

  // Used as the length of the fenMap to prevent recording the same position twice because of the strict mode in React
  const fenRecordsCounter = useRef(0);

  // Helper functions
  const updateFenRecord = useCallback(
    (newFen: string) => {
      if (fenRecordsCounter.current > board.history.length) return;

      setFenMap((prev) => {
        const newMap = new Map(prev);
        const currentCount = newMap.get(newFen) ?? 0;
        newMap.set(newFen, currentCount + 1);
        return newMap;
      });
      fenRecordsCounter.current += 1;
    },
    [board.history.length]
  );

  const checkThreefoldRepetition = useCallback(
    (fen: string) => {
      const count = fenMap.get(fen) ?? 0;
      return count >= 3;
    },
    [fenMap]
  );

  const isValidMove = useCallback(
    (piece: Piece, toPosition: Coordinates, moves: Coordinates[]): boolean => {
      return (
        moves.some((move) => sameCoordinates(move, toPosition)) &&
        !sameCoordinates(piece.coordinates, toPosition)
      );
    },
    []
  );

  const createMove = useCallback(
    (
      piece: Piece,
      fromPosition: Coordinates,
      toPosition: Coordinates,
      capturedPiece: Piece | undefined,
      castle: "long" | "short" | undefined,
      newPieces: PiecesMap,
      turn: "light" | "dark"
    ): Move => {
      const { includeFromFile, includeFromRank } = getDisambiguation(
        board.pieces,
        piece,
        toPosition,
        turn,
        board.enPassantTarget,
        board.status
      );

      const opponentKing = findPiece(
        newPieces,
        (p) => p.color === getOpponentColor(turn) && p.type === "king"
      );

      if (!opponentKing) {
        throw Error(`${getOpponentColor(turn)} king is missing`);
      }

      return {
        piece,
        from: fromPosition,
        to: toPosition,
        captured: capturedPiece,
        isCheck: isCheckOn(newPieces, opponentKing),
        includeFromFile,
        includeFromRank,
        castle,
      };
    },
    [board.pieces, board.enPassantTarget, board.status]
  );

  const calculateEnPassantTarget = useCallback(
    (piece: Piece, fromPosition: Coordinates, toPosition: Coordinates) => {
      if (
        piece.type === "pawn" &&
        Math.abs(fromPosition.rank - toPosition.rank) === 2
      ) {
        return {
          rank: (fromPosition.rank + toPosition.rank) / 2,
          file: fromPosition.file,
        };
      }
      return undefined;
    },
    []
  );

  const executeMove = useCallback(
    (currentPiece: Piece, toPosition: Coordinates) => {
      const pieces = board.pieces;
      const turn = board.turn;
      const enPassantTarget = board.enPassantTarget;
      const status = board.status;

      const pieceMoves = getPieceMoves(
        pieces,
        currentPiece,
        turn,
        enPassantTarget,
        status === "check"
      );

      if (!isValidMove(currentPiece, toPosition, pieceMoves)) return;

      setBoard((prev) => {
        const newPieces = new Map(prev.pieces);
        const fromPosition = currentPiece.coordinates;
        let capturedPiece = newPieces.get(coordinateToKey(toPosition));

        // Handle special moves
        capturedPiece =
          capturedPiece ||
          handleEnPassant(
            newPieces,
            currentPiece,
            fromPosition,
            toPosition,
            prev
          );

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

        // Move piece
        newPieces.delete(coordinateToKey(fromPosition));
        newPieces.set(coordinateToKey(toPosition), {
          ...currentPiece,
          coordinates: toPosition,
          hasMoved: true,
        });

        const move = createMove(
          currentPiece,
          fromPosition,
          toPosition,
          capturedPiece,
          castle,
          newPieces,
          turn
        );

        const isPromotion =
          currentPiece.type === "pawn" &&
          (toPosition.rank === 1 || toPosition.rank === 8);

        const newEnPassantTarget = calculateEnPassantTarget(
          currentPiece,
          fromPosition,
          toPosition
        );

        setFocusedMoveIndex(prev.moveFocused + 1);

        // To evaluate game status and changes, Prevent re-rendering
        const tempBoard: BoardState = {
          ...prev,
          pieces: newPieces,
          turn: getOpponentColor(prev.turn),
          history: [...prev.history, move],
          moveFocused: prev.moveFocused + 1,
          selectedPiece: null,
          enPassantTarget: newEnPassantTarget,
          promotionPending: isPromotion,
        };

        const { status: newStatus, kingInCheckPosition } =
          evaluateGameStatus(tempBoard);

        const newBoard: BoardState = {
          ...tempBoard,
          status: newStatus,
          kingInCheckPosition,
        };

        // Handle FEN tracking and threefold repetition

        // Send a copy of the pieces to not effect the position
        const fen = getFEN(
          new Map(newPieces),
          newBoard.turn,
          newBoard.enPassantTarget
        );
        updateFenRecord(fen);

        return newBoard;
      });
    },
    [
      board.pieces,
      board.turn,
      board.status,
      board.enPassantTarget,
      isValidMove,
      createMove,
      calculateEnPassantTarget,
      updateFenRecord,
    ]
  );

  const reconstructBoardAtMove = useCallback(
    (targetIndex: number): BoardState => {
      const newBoard: BoardState = {
        ...INIT_BOARD_STATE,
        history: [],
        pieces: new Map(INIT_BOARD_STATE.pieces),
      };

      const history = board.history;

      for (let i = 0; i <= targetIndex; i++) {
        const move = history[i];
        if (!move) break;

        const moveFromKey = coordinateToKey(move.from);
        const moveToKey = coordinateToKey(move.to);

        // Handle captured piece
        if (move.captured) {
          newBoard.pieces.delete(coordinateToKey(move.captured.coordinates));
        }

        // Handle castling
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

        // Move piece
        newBoard.pieces.delete(moveFromKey);
        newBoard.pieces.set(moveToKey, {
          ...move.piece,
          coordinates: move.to,
          hasMoved: true,
        });

        // Handle promotion
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

      // Evaluate status for the reconstructed board
      const finalBoard = {
        ...newBoard,
        history: board.history,
        moveFocused: targetIndex,
        calculateFen: false,
      };

      const { status, kingInCheckPosition } = evaluateGameStatus(finalBoard);

      return {
        ...finalBoard,
        status,
        kingInCheckPosition,
      };
    },
    [board.history]
  );

  const handleBranching = useCallback(() => {
    if (
      focusedMoveIndex !== null &&
      focusedMoveIndex < board.history.length - 1
    ) {
      setBoard((prev) => ({
        ...prev,
        history: prev.history.slice(0, focusedMoveIndex + 1),
      }));
      setFocusedMoveIndex(null);
    }
  }, [focusedMoveIndex, board.history.length]);

  // Main API functions
  const selectPiece = useCallback(
    (piece: Piece | null) => {
      if (piece && piece.color !== board.turn) return;
      if (!isAtLatestMove) return;
      if (board.status !== "playing" && board.status !== "check") return;

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
    [board.turn, isAtLatestMove, board.status]
  );

  const movePiece = useCallback(
    (toPosition: Coordinates) => {
      if (!board.selectedPiece || board.selectedPiece.color !== board.turn) {
        return;
      }

      executeMove(board.selectedPiece, toPosition);
    },
    [board.selectedPiece, board.turn, executeMove]
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

        // Evaluate status after promotion
        const tempBoard: BoardState = {
          ...prev,
          pieces: newPieces,
          validMoves: [],
          history: [...prev.history, move],
          selectedPiece: null,
          promotionPending: false,
        };

        const { status, kingInCheckPosition } = evaluateGameStatus(tempBoard);

        const newBoard: BoardState = {
          ...tempBoard,
          status,
          kingInCheckPosition,
        };

        // Handle FEN tracking for promotion

        // Send a copy of the pieces to not effect the position
        const fen = getFEN(
          new Map(newPieces),
          newBoard.turn,
          newBoard.enPassantTarget
        );
        updateFenRecord(fen);

        return newBoard;
      });
    },
    [board.promotionPending, board.history, updateFenRecord]
  );

  const goToMove = useCallback(
    (index: number) => {
      if (index < -1 || index >= board.history.length) return;
      setFocusedMoveIndex(index);
    },
    [board.history.length]
  );

  // Detecting threefold repetition draw
  useEffect(() => {
    setBoard((prev) => {
      if (prev.status !== "playing") return prev;

      const newBoard: BoardState = { ...prev };

      // Send a copy of the pieces to not effect the position
      const fen = getFEN(new Map(prev.pieces), prev.turn, prev.enPassantTarget);

      if (checkThreefoldRepetition(fen))
        newBoard.status = "threefold repetition";

      return newBoard;
    });
  }, [fenMap, checkThreefoldRepetition]);

  // Computed values
  const displayBoard = isAtLatestMove
    ? board
    : reconstructBoardAtMove(focusedMoveIndex!);

  const validMoves = getPieceMoves(
    board.pieces,
    board.selectedPiece,
    board.turn,
    board.enPassantTarget,
    board.status === "check"
  );

  return {
    boardState: {
      ...displayBoard,
      validMoves,
    },
    selectPiece: (option) => {
      if (!isAtLatestMove) return;
      selectPiece(option);
    },
    promotePawn,
    goToMove,
    movePiece: (to) => {
      if (!isAtLatestMove) return;
      handleBranching();
      movePiece(to);
    },
  };
}
