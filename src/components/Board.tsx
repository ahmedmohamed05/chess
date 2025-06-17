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

// type DomMouseEvent = globalThis.MouseEvent;
// type DomTouchEvent = globalThis.TouchEvent;

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
  // const activePieceRef = useRef<HTMLDivElement>(null);
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
    element.style.scale = "1.5";
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
      // selectPiece(null);

      // Reset
      element.style.position = "static";
      element.style.scale = "1";
      isDragging.current = false;
      ignoreNextClick.current = true;
      // touchRef.current = {
      //   position: null,
      //   piece: null,
      // };
      movingRef.current = null;
    },
    [movePiece, getTargetPosition, board.promotionPending]
  );
  // TODO Just send the target here
  const grabPiece = ({ x, y }: positionType, target: HTMLDivElement) => {
    if (!boardRef.current) return;

    const pieceCoords = getTargetPosition(x, y);
    const piece = board.pieces.get(coordinateToKey(pieceCoords));
    if (!piece) return;

    selectPiece(piece);
    isDragging.current = true;
    // activePieceRef.current = target;
    // touchRef.current = {
    //   position: { x, y },
    //   piece,
    // };
    movingRef.current = {
      element: target,
      piece,
      position: { x, y },
    };

    target.style.scale = "1.5";
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
    // Wait Until Select Promotion Option
    if (board.promotionPending) return;

    const touch = e.touches[0];
    if (!touch) return;

    const element = e.target as HTMLDivElement;

    // Tile doesn't have a piece
    if (!validPiece(element)) return;

    const file = Number(element.dataset.file);
    const rank = Number(element.dataset.rank);

    const piece = board.pieces.get(coordinateToKey({ rank, file }));

    if (!piece) return;

    grabPiece({ x: touch.clientX, y: touch.clientY }, element);
  };
  const touchMoveHandler = useCallback(
    (e: TouchEvent<HTMLDivElement>) => {
      if (e.cancelable) e.preventDefault();
      if (e.touches.length > 0) return;

      const { clientX: x, clientY: y } = e.touches[0];
      dragHandler({ x, y });
    },
    [dragHandler]
  );

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (!boardRef.current || !movingRef.current) return;

    const touch = e.changedTouches[0];
    if (!touch) return;

    // Double Check
    if (movingRef.current.piece.color !== board.turn) return;

    movePiece(board.selectedPiece!.coordinates);

    // if (!touchRef.current.position) return;

    // Check if it was a tap (minimal movement)
    // const dx = Math.abs(touch.clientX - touchRef.current.position.x);
    // const dy = Math.abs(touch.clientY - touchRef.current.position.y);

    // It's a tap when movement was minimal and time is short
    // if (dx < 5 && dy < 5) {
    //   const tappedPosition: Coordinates = getTargetPosition(
    //     touch.clientX,
    //     touch.clientY
    //   );

    //   // If we have piece and tapped on a valid move
    //   const tapedOnMove =
    //     board.selectedPiece &&
    //     board.moves.some((move) => sameCoordinates(move, tappedPosition));

    //   // Tapped on one of the current turn pieces
    //   const touchPiece = touchRef.current.piece;
    //   const tappedOnPiece = touchPiece && touchPiece.color === board.turn;

    //   if (tapedOnMove) {
    //     movePiece(tappedPosition);
    //     return;
    //   } else if (tappedOnPiece) {
    //     // Toggle The Selection Of The Piece
    //     const samePiece =
    //       board.selectedPiece &&
    //       sameCoordinates(
    //         touchPiece.coordinates,
    //         board.selectedPiece.coordinates
    //       );
    //     selectPiece(samePiece ? touchPiece : null);
    //   } else {
    //     selectPiece(null); // Deselecting a piece when tapping empty square
    //   }
    // } else if (isDragging.current) {
    // dropHandler(touchRef.current.position);
    // }

    // touchRef.current = {
    //   position: null,
    //   piece: null,
    // };
  };

  // const touchEndHandler = useCallback(
  //   (e: DomTouchEvent) => {
  //     if (e.cancelable) e.preventDefault();
  //     const touch = e.changedTouches[e.changedTouches.length - 1];
  //     if (!touch) return;

  //     const tappedPosition = {
  //       x: e.changedTouches[0].clientX,
  //       y: e.changedTouches[0].clientY,
  //     };
  //     const tappedCoords = getTargetPosition(
  //       tappedPosition.x,
  //       tappedPosition.y
  //     );

  //     const pieceMove =
  //       board.selectedPiece &&
  //       board.moves.some((m) => sameCoordinates(tappedCoords, m));

  //     if (pieceMove) {
  //       console.log(224);
  //       dropHandler(tappedPosition);
  //     }

  //     //   // if (
  //     //   //   sameCoordinates(
  //     //   //     touchRef.current.piece!.coordinates,
  //     //   //     board.selectedPiece.coordinates
  //     //   //   )
  //     //   // ) {
  //     //   //   selectPiece(null);
  //     //   // } else if (
  //     //   //   board.selectedPiece &&
  //     //   //   board.moves.some((move) => sameCoordinates(move, tappedCoords))
  //     //   // ) {
  //     //   //   dropHandler(tappedPosition);
  //     //   // } else {
  //     //   //   selectPiece(null);
  //     //   //   // touchRef.current = { position: null, piece: null, time: 0 };
  //     //   //   touchRef.current = { position: null, piece: null };
  //     //   // }
  //   },
  //   [board.moves, board.selectedPiece, getTargetPosition, dropHandler]
  // );

  // const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
  //   if (!touchRef.current.piece) return;

  //   const touch = e.touches[0];
  //   if (!touch) return;

  //   const dx = Math.abs(touch.clientX - touchRef.current.position!.x);
  //   const dy = Math.abs(touch.clientY - touchRef.current.position!.y);

  //   // Start dragging if the touch exceeds more than 10 px
  //   if ((dx > 10 || dy > 10) && !isDragging.current) {
  //     const piece = touchRef.current.piece;
  //     if (!piece) return;

  //     if (activePieceRef.current && piece.color === board.turn) {
  //       selectPiece(piece);
  //       isDragging.current = true;

  //       activePieceRef.current.style.position = "absolute";
  //       activePieceRef.current.style.left =
  //         touch.clientX - activePieceRef.current.offsetWidth / 2 + "px";
  //       activePieceRef.current.style.top =
  //         touch.clientY - activePieceRef.current.offsetHeight / 2 + "px";
  //       activePieceRef.current.style.scale = "1.5";
  //     }
  //   }
  //   // Continue dragging if already started
  //   if (isDragging.current) {
  //     // if (e.cancelable) e.preventDefault();
  //     dragHandler({ x: touch.clientX, y: touch.clientY });
  //   }
  // };

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

  // // Setup and cleanup event listeners
  // useEffect(() => {
  //   const mouseMoveHandler = (e: DomMouseEvent) => dragPieceHandler(e);
  //   const mouseUpHandler = (e: DomMouseEvent) => dropPieceHandler(e);
  //   const touchStartHandler = (e: DomTouchEvent) => touchDragHandler(e);
  //   const touchEndHandler = (e: DomTouchEvent) => touchDropHandler(e);

  //   // Add document-level listeners
  //   document.addEventListener("mousemove", mouseMoveHandler);
  //   document.addEventListener("mouseup", mouseUpHandler);
  //   document.addEventListener("touchmove", touchStartHandler, {
  //     passive: false,
  //   });
  //   document.addEventListener("touchend", touchEndHandler);

  //   return () => {
  //     // Cleanup document-level listeners
  //     document.removeEventListener("mousemove", mouseMoveHandler);
  //     document.removeEventListener("mouseup", mouseUpHandler);
  //     document.removeEventListener("touchmove", touchStartHandler);
  //     document.removeEventListener("touchend", touchEndHandler);
  //   };
  // }, [dragPieceHandler, dropPieceHandler, touchDragHandler, touchDropHandler]);

  return (
    <div
      className="board"
      ref={boardRef}
      onMouseDown={mouseDownHandler}
      onMouseMove={mouseMoveHandler}
      onMouseUp={mouseUpHandler}
      onTouchStart={touchStartHandler}
      onTouchMove={touchMoveHandler}
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
