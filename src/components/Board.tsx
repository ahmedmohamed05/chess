import {
  useCallback,
  useEffect,
  useRef,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { RANKS, FILES, INIT_BOARD_STATE } from "../constants";
import Squares from "./Squares";
import { useBoard } from "../hooks/useBoard";
import sameCoordinates from "../utils/check-coordinates";
import type { Coordinates } from "../types";

function validPiece(el: HTMLElement): boolean {
  return el.classList.contains("square") && el.dataset.piece == "true";
}

type DomMouseEvent = globalThis.MouseEvent;

export default function Board() {
  const { board, selectPiece, movePiece } = useBoard(INIT_BOARD_STATE);

  const boardRef = useRef<HTMLDivElement>(null);
  const activePieceRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const ignoreNextClick = useRef(false);

  const movePieceHandler = useCallback((e: DomMouseEvent) => {
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
      const boardRect = boardRef.current.getBoundingClientRect();
      const relX = e.clientX - boardRect.left;
      const relY = e.clientY - boardRect.top;
      const file = Math.floor((relX / boardRect.width) * 8) + 1;
      const rank = 8 - Math.floor((relY / boardRect.height) * 8); // 1-8

      movePiece({ rank, file });

      piece.style.position = "static";
      activePieceRef.current = null;
      isDragging.current = false;
      ignoreNextClick.current = true; // No Piece Selected
    },
    [movePiece]
  );

  const grabPieceHandler = (e: ReactMouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;

    // Tile doesn't have a piece
    if (!validPiece(target)) return;

    const file = Number(target.dataset.file);
    const rank = Number(target.dataset.rank);
    const pieceIndex = board.pieces.findIndex((p) =>
      sameCoordinates(p.coordinates, { file, rank })
    );

    if (pieceIndex < 0) return;

    selectPiece(board.pieces[pieceIndex]);

    activePieceRef.current = target;
    isDragging.current = true;

    const { clientX: x, clientY: y } = e;
    target.style.position = "absolute";
    target.style.left = x - target.offsetWidth / 2 + "px";
    target.style.top = y - target.offsetHeight / 2 + "px";
  };

  const handleBoardClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (ignoreNextClick.current) {
      ignoreNextClick.current = false;
      return;
    }
    if (!boardRef.current) return;

    const boardRect = boardRef.current.getBoundingClientRect();
    const relX = e.clientX - boardRect.left;
    const relY = e.clientY - boardRect.top;
    const file = Math.floor((relX / boardRect.width) * 8) + 1;
    const rank = 8 - Math.floor((relY / boardRect.height) * 8); // 1-8
    const clickedPosition: Coordinates = { rank, file };

    // A Piece Selected And Clicked On Another Square
    if (
      board.selectedPiece &&
      board.validMoves.some((move) => sameCoordinates(move, clickedPosition))
    ) {
      movePiece(clickedPosition);
      return;
    } else {
      selectPiece(null); // Deselecting a piece when clicking empty square
    }
  };

  // Setup and cleanup event listeners
  useEffect(() => {
    const moveHandler = (e: DomMouseEvent) => movePieceHandler(e);
    const dropHandler = (e: DomMouseEvent) => dropPieceHandler(e);

    // Add document-level listeners
    document.addEventListener("mousemove", moveHandler);
    document.addEventListener("mouseup", dropHandler);

    return () => {
      // Cleanup document-level listeners
      document.removeEventListener("mousemove", moveHandler);
      document.removeEventListener("mouseup", dropHandler);
    };
  }, [movePieceHandler, dropPieceHandler]);

  return (
    <div
      className="board"
      ref={boardRef}
      onMouseDown={grabPieceHandler}
      onClick={handleBoardClick}
    >
      <div className="squares cursor-pointer">
        <Squares
          highlight={board.validMoves}
          ranks={RANKS}
          files={FILES}
          position={board.pieces}
        />
      </div>
    </div>
  );
}
