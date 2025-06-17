// Board.tsx
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type TouchEvent,
} from "react";
import Squares from "./Squares";
import sameCoordinates from "../utils/check-coordinates";
import {
  // type BoardState,
  type Coordinates,
  type Piece,
  type PromotionOptions,
  type useBoardType,
} from "../types";
import validPiece from "../utils/valid-piece";
import { coordinateToKey } from "../utils/key-coordinate-swap";

type DomMouseEvent = globalThis.MouseEvent;
type DomTouchEvent = globalThis.TouchEvent;
type positionType = { x: number; y: number };

export default function Board({
  board,
  movePiece,
  selectPiece,
  promote,
}: useBoardType) {
  const boardRef = useRef<HTMLDivElement>(null);
  const activePieceRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const ignoreNextClick = useRef(false);
  const touchStartPosition = useRef<positionType | null>(null);

  const [promotingSquare, setPromotingSquare] = useState<
    Coordinates | undefined
  >(undefined);

  const getTargetPosition = useCallback((x: number, y: number): Coordinates => {
    const boardRect = boardRef.current!.getBoundingClientRect();
    const relX = x - boardRect.left;
    const relY = y - boardRect.top;
    const file = Math.floor((relX / boardRect.width) * 8) + 1;
    const rank = 8 - Math.floor((relY / boardRect.height) * 8); // 1-8
    return { file, rank };
  }, []);

  // Shared drag handler for both mouse and touch
  const dragHandler = useCallback(({ x, y }: positionType) => {
    if (!activePieceRef.current || !isDragging.current) return;

    const piece = activePieceRef.current;
    const pieceWidth = piece.offsetWidth;
    const pieceHeight = piece.offsetHeight;

    const boardRect = boardRef.current?.getBoundingClientRect();
    if (!boardRect) return;

    const minX = boardRect.left;
    const minY = boardRect.top;
    const maxX = boardRect.right - pieceWidth;
    const maxY = boardRect.bottom - pieceHeight;

    const left = Math.min(Math.max(x - pieceWidth / 2, minX), maxX);
    const top = Math.min(Math.max(y - pieceHeight / 2, minY), maxY);

    piece.style.left = left + "px";
    piece.style.top = top + "px";
    piece.style.scale = "1.5";
  }, []);

  // Shared drop handler for both mouse and touch
  const dropHandler = useCallback(
    ({ x, y }: positionType) => {
      if (!activePieceRef.current || !boardRef.current || !isDragging.current)
        return;

      const piece = activePieceRef.current;
      const targetSquare = getTargetPosition(x, y);

      if (board.promotionPending) {
        setPromotingSquare(targetSquare);
      }
      movePiece(targetSquare);

      // Reset
      piece.style.position = "static";
      piece.style.scale = "1";
      activePieceRef.current = null;
      isDragging.current = false;
      ignoreNextClick.current = true;
      touchStartPosition.current = null;
    },
    [movePiece, getTargetPosition, board.promotionPending]
  );

  // Mouse event handlers
  const dragPieceHandler = useCallback(
    (e: DomMouseEvent) => {
      dragHandler({ x: e.clientX, y: e.clientY });
    },
    [dragHandler]
  );
  const dropPieceHandler = useCallback(
    (e: DomMouseEvent) => {
      dropHandler({ x: e.clientX, y: e.clientY });
    },
    [dropHandler]
  );

  // Touch event handlers
  const touchDragHandler = useCallback(
    (e: DomTouchEvent) => {
      if (e.cancelable) e.preventDefault();
      if (e.touches.length > 0) {
        dragHandler({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      }
    },
    [dragHandler]
  );
  const touchDropHandler = useCallback(
    (e: DomTouchEvent) => {
      if (e.cancelable) e.preventDefault();
      if (e.changedTouches.length > 0) {
        dropHandler({
          x: e.changedTouches[0].clientX,
          y: e.changedTouches[0].clientY,
        });
      }
    },
    [dropHandler]
  );

  // Shared grab handler for both mouse and touch
  const grabPiece = (
    { x, y }: positionType,
    target: HTMLDivElement,
    piece: Piece
  ) => {
    selectPiece(piece);
    activePieceRef.current = target;
    isDragging.current = true;

    target.style.position = "absolute";
    target.style.left = x - target.offsetWidth / 2 + "px";
    target.style.top = y - target.offsetHeight / 2 + "px";
    target.style.scale = "1.5";
  };

  // Mouse grab handler
  const grabPieceHandler = (e: MouseEvent<HTMLDivElement>) => {
    if (board.promotionPending) return;
    const target = e.target as HTMLDivElement;

    // Tile doesn't have a piece
    if (!validPiece(target)) return;

    const file = Number(target.dataset.file);
    const rank = Number(target.dataset.rank);

    const piece = board.pieces.get(coordinateToKey({ rank, file }));

    if (!piece) return;

    grabPiece({ x: e.clientX, y: e.clientY }, target, piece);
  };

  // Touch grab handler
  const touchGrabHandler = (e: TouchEvent<HTMLDivElement>) => {
    if (board.promotionPending) return;
    const target = e.target as HTMLDivElement;

    if (!validPiece(target)) return;

    const file = Number(target.dataset.file);
    const rank = Number(target.dataset.rank);

    const piece = board.pieces.get(coordinateToKey({ rank, file }));

    if (!piece) return;

    // Store touch start position for tap detection
    touchStartPosition.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };

    grabPiece(
      { x: e.touches[0].clientX, y: e.touches[0].clientY },
      target,
      piece
    );
  };

  // Handle board click/tap
  const handleBoardClick = (e: MouseEvent<HTMLDivElement>) => {
    if (ignoreNextClick.current) {
      ignoreNextClick.current = false;
      return;
    }

    if (!boardRef.current) return;

    const clickedPosition: Coordinates = getTargetPosition(
      e.clientX,
      e.clientY
    );

    // A Piece Selected And Clicked On Another Square
    if (
      board.selectedPiece &&
      board.moves.some((move) => sameCoordinates(move, clickedPosition))
    ) {
      movePiece(clickedPosition);
      return;
    }

    selectPiece(null); // Deselecting a piece when clicking empty square
  };

  // Handle touch end (for taps)
  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (!boardRef.current || !touchStartPosition.current) return;

    // Check if it was a tap (minimal movement)
    if (e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      const dx = Math.abs(touch.clientX - touchStartPosition.current.x);
      const dy = Math.abs(touch.clientY - touchStartPosition.current.y);

      // Consider it a tap if movement was less than 5px
      if (dx < 5 && dy < 5) {
        const tappedPosition: Coordinates = getTargetPosition(
          touch.clientX,
          touch.clientY
        );

        // If we have a selected piece and tapped on a valid move
        if (
          board.selectedPiece &&
          board.moves.some((move) => sameCoordinates(move, tappedPosition))
        ) {
          movePiece(tappedPosition);
          return;
        }

        selectPiece(null); // Deselecting a piece when tapping empty square
      }
    }

    touchStartPosition.current = null;
  };

  const handlePromotion = (type: PromotionOptions) => {
    setPromotingSquare(undefined);
    promote(type);
  };

  // Show Promoting Options When PromotingPending or moves history changes
  useEffect(() => {
    if (board.promotionPending) {
      const lastMoveIndex = board.history.length - 1;
      const lastMove = board.history[lastMoveIndex];
      setPromotingSquare(lastMove.to);
    }
  }, [board.promotionPending, board.history]);

  // Last Move Square
  const lastMove = useMemo(() => {
    const length = board.history.length;
    if (length === 0) return undefined;
    return board.history[length - 1];
  }, [board.history]);

  // Setup and cleanup event listeners
  useEffect(() => {
    const mouseMoveHandler = (e: DomMouseEvent) => dragPieceHandler(e);
    const mouseUpHandler = (e: DomMouseEvent) => dropPieceHandler(e);
    const touchMoveHandler = (e: DomTouchEvent) => touchDragHandler(e);
    const touchEndHandler = (e: DomTouchEvent) => touchDropHandler(e);

    // Add document-level listeners
    document.addEventListener("mousemove", mouseMoveHandler);
    document.addEventListener("mouseup", mouseUpHandler);
    document.addEventListener("touchmove", touchMoveHandler, {
      passive: false,
    });
    document.addEventListener("touchend", touchEndHandler);

    return () => {
      // Cleanup document-level listeners
      document.removeEventListener("mousemove", mouseMoveHandler);
      document.removeEventListener("mouseup", mouseUpHandler);
      document.removeEventListener("touchmove", touchMoveHandler);
      document.removeEventListener("touchend", touchEndHandler);
    };
  }, [dragPieceHandler, dropPieceHandler, touchDragHandler, touchDropHandler]);

  return (
    <div
      className="board"
      ref={boardRef}
      onMouseDown={grabPieceHandler}
      onTouchStart={touchGrabHandler}
      onTouchEnd={handleTouchEnd}
      onClick={handleBoardClick}
    >
      <div className="squares">
        <Squares
          promotion={promotingSquare}
          promoteHandler={handlePromotion}
          highlight={board.moves}
          lastMove={lastMove}
          pieces={board.pieces}
        />
      </div>
    </div>
  );
}
