import { useCallback, useRef, type MouseEvent } from "react";
import { RANKS, FILES, INIT_BOARD_STATE } from "../constants";
import Squares from "./Squares";
import { useBoard } from "../hooks/useBoard";
import sameCoordinates from "../utils/check-coordinates";

function validPiece(el: HTMLElement): boolean {
  return el.classList.contains("square") && el.dataset.piece == "true";
}

export default function Board() {
  const { board, selectPiece, movePiece } = useBoard(INIT_BOARD_STATE);

  const boardRef = useRef<HTMLDivElement>(null);
  const activePieceRef = useRef<HTMLDivElement>(null);

  const movePieceHandler = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (!activePieceRef.current) return;

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

  const dropPieceHandler = (e: MouseEvent<HTMLDivElement>) => {
    if (!activePieceRef.current || !boardRef.current) return;

    const piece = activePieceRef.current;
    const boardRect = boardRef.current.getBoundingClientRect();
    const relX = e.clientX - boardRect.left;
    const relY = e.clientY - boardRect.top;
    const file = Math.floor((relX / boardRect.width) * 8) + 1;
    const rank = 8 - Math.floor((relY / boardRect.height) * 8); // 1-8

    movePiece({ rank, file });

    piece.style.position = "static";
    activePieceRef.current = null;
  };

  const grabPieceHandler = (e: MouseEvent<HTMLDivElement>) => {
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

    const { clientX: x, clientY: y } = e;
    activePieceRef.current = target;
    target.style.position = "absolute";
    target.style.left = x - target.offsetWidth / 2 + "px";
    target.style.top = y - target.offsetHeight / 2 + "px";
  };

  return (
    <div
      className="board"
      ref={boardRef}
      onMouseDown={(e) => grabPieceHandler(e)}
      onMouseMove={(e) => movePieceHandler(e)}
      onMouseUp={(e) => dropPieceHandler(e)}
    >
      <div className="squares">
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
