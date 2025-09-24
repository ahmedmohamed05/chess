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
import validPiece from "../utils/valid-piece";
import { coordinateToKey } from "../utils/key-coordinate-swap";
import type {
  Coordinates,
  GameController,
  MovingRef,
  PromotionOption,
  ScreenCoordinates,
} from "../types";

export interface BoardProps {
  controller: GameController;
}

export default function Board({ controller }: BoardProps) {
  const { boardState, movePiece, promotePawn, selectPiece } = controller;

  const boardRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const ignoreNextClick = useRef(false);
  const movingRef = useRef<MovingRef | null>(null);

  const [promotingSquare, setPromotingSquare] = useState<
    Coordinates | undefined
  >(undefined);

  const getTargetPosition = useCallback(
    ({ x, y }: ScreenCoordinates): Coordinates => {
      const boardRect = boardRef.current!.getBoundingClientRect();
      const relX = x - boardRect.left;
      const relY = y - boardRect.top;
      const file = Math.floor((relX / boardRect.width) * 8) + 1;
      const rank = 8 - Math.floor((relY / boardRect.height) * 8); // 1-8
      return { file, rank };
    },
    []
  );

  // Board State Shared Handlers
  const dragHandler = useCallback(({ x, y }: ScreenCoordinates) => {
    if (!movingRef.current || !isDragging.current) return;

    // const piece = activePieceRef.current;
    const element = movingRef.current.element;
    const pieceWidth = element.offsetWidth;
    const pieceHeight = element.offsetHeight;

    const boardRect = boardRef.current?.getBoundingClientRect();
    if (!boardRect) return;

    const minX = boardRect.left;
    const minY = boardRect.top;
    const maxX = boardRect.right - pieceWidth;
    const maxY = boardRect.bottom - pieceHeight;

    const left = Math.min(Math.max(x - pieceWidth / 2, minX), maxX);
    const top = Math.min(Math.max(y - pieceHeight / 2, minY), maxY);

    element.style.left = left + "px";
    element.style.top = top + "px";
    element.style.scale = "1.2";
  }, []);
  const dropHandler = useCallback(
    ({ x, y }: ScreenCoordinates) => {
      if (!movingRef.current || !boardRef.current || !isDragging.current)
        return;

      const { element } = movingRef.current;
      const targetSquare = getTargetPosition({ x, y });

      if (boardState.promotionPending) {
        setPromotingSquare(targetSquare);
      }
      movePiece(targetSquare);

      // Reset
      element.classList.remove("dragging");
      element.style.position = "static";
      element.style.scale = "1";
      isDragging.current = false;
      ignoreNextClick.current = true; // To prevent the conflict between 'onClick' and 'onMouseDown'
      movingRef.current = null;
    },
    [boardState.promotionPending, getTargetPosition, movePiece]
  );
  const grabPieceFromElement = (
    screenCoords: ScreenCoordinates,
    target: HTMLDivElement
  ) => {
    if (!boardRef.current) return;

    const pieceCoords = getTargetPosition(screenCoords);
    const piece = boardState.pieces.get(coordinateToKey(pieceCoords));
    if (!piece) return;

    const { x, y } = screenCoords;
    selectPiece(piece);
    isDragging.current = true;
    movingRef.current = {
      element: target,
      piece,
      position: screenCoords,
    };

    target.classList.add("dragging");
    target.style.scale = "1.2";
    target.style.position = "absolute";
    target.style.left = x - target.offsetWidth / 2 + "px";
    target.style.top = y - target.offsetHeight / 2 + "px";
  };

  // Mouse event handlers
  const mouseDownHandler = (e: MouseEvent<HTMLDivElement>) => {
    // Wait Until Select Promotion Option
    if (boardState.promotionPending) return;

    const element = e.target as HTMLDivElement;

    // Tile doesn't have a piece
    if (!validPiece(element)) return;

    const file = Number(element.dataset.file);
    const rank = Number(element.dataset.rank);

    const piece = boardState.pieces.get(coordinateToKey({ rank, file }));

    if (!piece) return;

    grabPieceFromElement({ x: e.clientX, y: e.clientY }, element);
  };
  const mouseMoveHandler = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      dragHandler({ x: e.clientX, y: e.clientY });
    },
    [dragHandler]
  );
  const mouseUpHandler = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      dropHandler({ x: e.clientX, y: e.clientY });
    },
    [dropHandler]
  );
  const handleBoardClick = (e: MouseEvent<HTMLDivElement>) => {
    if (ignoreNextClick.current) {
      ignoreNextClick.current = false;
      return;
    }

    if (!boardRef.current) return;

    const clickedPosition: Coordinates = getTargetPosition({
      x: e.clientX,
      y: e.clientY,
    });

    // A Piece Selected And Clicked On Another Square
    if (
      boardState.selectedPiece &&
      boardState.validMoves.some((m) => sameCoordinates(m, clickedPosition))
    ) {
      movePiece(clickedPosition);
      return;
    }

    selectPiece(null); // Deselecting a piece when clicking empty square
  };

  // Touch event handlers
  const touchStartHandler = (e: TouchEvent<HTMLDivElement>) => {
    // To Prevent Browser Gestures For Refreshing
    e.preventDefault();

    // Wait Until Select Promotion Option
    if (boardState.promotionPending) return;

    const touch = e.touches[0];
    if (!touch) return;

    const element = e.target as HTMLDivElement;

    const file = Number(element.dataset.file);
    const rank = Number(element.dataset.rank);
    const piece = boardState.pieces.get(coordinateToKey({ rank, file }));

    if (piece) {
      movingRef.current = {
        position: { x: touch.clientX, y: touch.clientY },
        piece,
        element,
      };
      isDragging.current = true;
      grabPieceFromElement({ x: touch.clientX, y: touch.clientY }, element);
    } else {
      const tappedTile = getTargetPosition({
        x: touch.clientX,
        y: touch.clientY,
      });

      if (boardState.validMoves.some((m) => sameCoordinates(m, tappedTile))) {
        movePiece(tappedTile);
      } else {
        movingRef.current = null;
        selectPiece(null);
      }
    }
  };
  const touchMoveHandler = useCallback(
    (e: TouchEvent<HTMLDivElement>) => {
      // To Avoid Scrolling
      e.preventDefault();
      if (e.cancelable) e.preventDefault();

      if (!movingRef.current) return;

      const touch = e.touches[0];
      if (!touch) return;

      // Continue dragging if already started
      if (isDragging.current) {
        dragHandler({ x: touch.clientX, y: touch.clientY });
      }
    },
    [dragHandler]
  );

  const touchEndHandler = (e: TouchEvent<HTMLDivElement>) => {
    if (e.cancelable) e.preventDefault();
    const touch = e.changedTouches[0];
    if (!touch || !movingRef.current) return;

    if (isDragging.current) {
      // Complete the drop
      dropHandler({ x: touch.clientX, y: touch.clientY });
    } else {
      // Handle tap
      const tappedPosition = getTargetPosition({
        x: touch.clientX,
        y: touch.clientY,
      });

      // If we have a selected piece and tapped on a valid move
      if (
        boardState.selectedPiece &&
        boardState.validMoves.some((m) => sameCoordinates(m, tappedPosition))
      ) {
        movePiece(tappedPosition);
      }
      // If tapped on a piece of current turn
      else if (movingRef.current.piece.color === boardState.turn) {
        // Toggle selection if clicking the same piece
        if (
          boardState.selectedPiece &&
          sameCoordinates(
            boardState.selectedPiece.coordinates,
            movingRef.current.piece.coordinates
          )
        ) {
          selectPiece(null);
        } else {
          selectPiece(movingRef.current.piece);
        }
      } else {
        // Deselect when tapping empty square
        selectPiece(null);
      }
    }

    // Reset state
    isDragging.current = false;
    movingRef.current = null;
  };

  const handlePromotion = (type: PromotionOption) => {
    if (!boardState.promotionPending) return;
    setPromotingSquare(undefined);
    promotePawn(type);
  };

  // Show Promoting Options When PromotingPending or moves history changes
  useEffect(() => {
    if (boardState.promotionPending) {
      const lastMoveIndex = boardState.history.length - 1;
      const lastMove = boardState.history[lastMoveIndex];
      setPromotingSquare(lastMove.to);
    }
  }, [boardState.promotionPending, boardState.history]);

  // Last Move Square
  const lastMove = useMemo(() => {
    const length = boardState.history.length;
    if (length === 0) return undefined;
    return boardState.history[length - 1];
  }, [boardState.history]);

  const status = boardState.status;

  return (
    <div
      className={`board ${
        !(status === "playing" || status === "check") && "disable"
      }`}
      ref={boardRef}
      onMouseDown={mouseDownHandler}
      onMouseMove={mouseMoveHandler}
      onMouseUp={mouseUpHandler}
      onTouchStart={touchStartHandler}
      onTouchMove={touchMoveHandler}
      onTouchEnd={touchEndHandler}
      onClick={handleBoardClick}
    >
      <div className="squares">
        <Squares
          promotion={promotingSquare}
          promoteHandler={handlePromotion}
          highlight={boardState.validMoves}
          lastMove={lastMove}
          pieces={boardState.pieces}
          check={boardState.kingInCheckPosition}
        />
      </div>
    </div>
  );
}
