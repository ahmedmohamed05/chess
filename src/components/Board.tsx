import { useCallback, useEffect, useRef, type MouseEvent } from "react";
import Squares from "./Squares";
import sameCoordinates from "../utils/check-coordinates";
import type { BoardState, Coordinates, Piece } from "../types";
import validPiece from "../utils/valid-piece";
import { coordinateToKey } from "../utils/key-coordinate-swap";

type DomMouseEvent = globalThis.MouseEvent;

export interface BoardProps {
  board: BoardState;
  movePiece: (to: Coordinates) => void;
  selectPiece: (piece: Piece | null) => void;
}

export default function Board({ board, movePiece, selectPiece }: BoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const activePieceRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const ignoreNextClick = useRef(false);

  const getTargetPosition = useCallback((x: number, y: number): Coordinates => {
    const boardRect = boardRef.current!.getBoundingClientRect();
    const relX = x - boardRect.left;
    const relY = y - boardRect.top;
    const file = Math.floor((relX / boardRect.width) * 8) + 1;
    const rank = 8 - Math.floor((relY / boardRect.height) * 8); // 1-8
    return { file, rank };
  }, []);

  const dragPieceHandler = useCallback((e: DomMouseEvent) => {
    if (!activePieceRef.current || !isDragging.current) return;

    const { clientX: x, clientY: y } = e;
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
  }, []);

  const dropPieceHandler = useCallback(
    (e: DomMouseEvent) => {
      if (!activePieceRef.current || !boardRef.current || !isDragging.current)
        return;
      const piece = activePieceRef.current;
      movePiece(getTargetPosition(e.clientX, e.clientY));
      // Reset
      piece.style.position = "static";
      activePieceRef.current = null;
      isDragging.current = false;
      ignoreNextClick.current = true; // No Piece Selected
    },
    [movePiece, getTargetPosition]
  );

  const grabPieceHandler = (e: MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;

    // Tile doesn't have a piece
    if (!validPiece(target)) return;

    const file = Number(target.dataset.file);
    const rank = Number(target.dataset.rank);
    // const pieceIndex = board.pieces.findIndex((p) =>
    //   sameCoordinates(p.coordinates, { file, rank })
    // );
    const piece = board.pieces.get(coordinateToKey({ rank, file }));

    if (!piece) return;

    selectPiece(piece);

    activePieceRef.current = target;
    isDragging.current = true;

    const { clientX: x, clientY: y } = e;
    target.style.position = "absolute";
    target.style.left = x - target.offsetWidth / 2 + "px";
    target.style.top = y - target.offsetHeight / 2 + "px";
  };

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
    } else {
      selectPiece(null); // Deselecting a piece when clicking empty square
    }
  };

  // Setup and cleanup event listeners
  useEffect(() => {
    const moveHandler = (e: DomMouseEvent) => dragPieceHandler(e);
    const dropHandler = (e: DomMouseEvent) => dropPieceHandler(e);

    // Add document-level listeners
    document.addEventListener("mousemove", moveHandler);
    document.addEventListener("mouseup", dropHandler);

    return () => {
      // Cleanup document-level listeners
      document.removeEventListener("mousemove", moveHandler);
      document.removeEventListener("mouseup", dropHandler);
    };
  }, [dragPieceHandler, dropPieceHandler]);

  return (
    <div
      className="board"
      ref={boardRef}
      onMouseDown={grabPieceHandler}
      onClick={handleBoardClick}
    >
      <div className="squares">
        <Squares highlight={board.moves} pieces={board.pieces} />
      </div>
    </div>
  );
}
