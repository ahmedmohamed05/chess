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
  type Coordinates,
  type Piece,
  type positionType,
  type PromotionOptions,
  type useBoardType,
} from "../types";
import validPiece from "../utils/valid-piece";
import { coordinateToKey } from "../utils/key-coordinate-swap";

interface MovingRef {
  position: positionType;
  piece: Piece;
  element: HTMLDivElement;
}

export default function Board({
  board,
  movePiece,
  selectPiece,
  promote,
}: useBoardType) {
  const boardRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const ignoreNextClick = useRef(false);
  const movingRef = useRef<MovingRef | null>(null);

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

  // Title: Board State Shared Handlers
  const dragHandler = useCallback(({ x, y }: positionType) => {
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
    ({ x, y }: positionType) => {
      if (!movingRef.current || !boardRef.current || !isDragging.current)
        return;

      const { element } = movingRef.current;
      const targetSquare = getTargetPosition(x, y);

      if (board.promotionPending) {
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
    [movePiece, getTargetPosition, board.promotionPending, movingRef]
  );
  // TODO Just send the target here
  const grabPiece = ({ x, y }: positionType, target: HTMLDivElement) => {
    if (!boardRef.current) return;

    const pieceCoords = getTargetPosition(x, y);
    const piece = board.pieces.get(coordinateToKey(pieceCoords));
    if (!piece) return;

    selectPiece(piece);
    isDragging.current = true;
    movingRef.current = {
      element: target,
      piece,
      position: { x, y },
    };

    target.classList.add("dragging");
    target.style.scale = "1.2";
    target.style.position = "absolute";
    target.style.left = x - target.offsetWidth / 2 + "px";
    target.style.top = y - target.offsetHeight / 2 + "px";
  };

  // Title: Mouse event handlers
  // TODO this and the logic inside 'touchGrabHandler' can be one function
  const mouseDownHandler = (e: MouseEvent<HTMLDivElement>) => {
    // Wait Until Select Promotion Option
    if (board.promotionPending) return;

    const element = e.target as HTMLDivElement;

    // Tile doesn't have a piece
    if (!validPiece(element)) return;

    const file = Number(element.dataset.file);
    const rank = Number(element.dataset.rank);

    const piece = board.pieces.get(coordinateToKey({ rank, file }));

    if (!piece) return;

    grabPiece({ x: e.clientX, y: e.clientY }, element);
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

  // Title: Touch event handlers
  const touchStartHandler = (e: TouchEvent<HTMLDivElement>) => {
    // To Prevent Browser Gestures For Refreshing
    e.preventDefault();

    // Wait Until Select Promotion Option
    if (board.promotionPending) return;

    const touch = e.touches[0];
    if (!touch) return;

    const element = e.target as HTMLDivElement;

    const file = Number(element.dataset.file);
    const rank = Number(element.dataset.rank);
    const piece = board.pieces.get(coordinateToKey({ rank, file }));

    if (piece) {
      movingRef.current = {
        position: { x: touch.clientX, y: touch.clientY },
        piece,
        element,
      };
      isDragging.current = true;
      grabPiece({ x: touch.clientX, y: touch.clientY }, element);
    } else {
      const tappedTile = getTargetPosition(touch.clientX, touch.clientY);

      if (board.moves.some((m) => sameCoordinates(m, tappedTile))) {
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
      const tappedPosition = getTargetPosition(touch.clientX, touch.clientY);

      // If we have a selected piece and tapped on a valid move
      if (
        board.selectedPiece &&
        board.moves.some((move) => sameCoordinates(move, tappedPosition))
      ) {
        movePiece(tappedPosition);
      }
      // If tapped on a piece of current turn
      else if (movingRef.current.piece.color === board.turn) {
        // Toggle selection if clicking the same piece
        if (
          board.selectedPiece &&
          sameCoordinates(
            board.selectedPiece.coordinates,
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

  const handlePromotion = (type: PromotionOptions) => {
    if (!board.promotionPending) return;
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

  return (
    <div
      className="board"
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
          highlight={board.moves}
          lastMove={lastMove}
          pieces={board.pieces}
        />
      </div>
    </div>
  );
}
