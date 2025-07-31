import { memo } from "react";
import type { Move } from "../types";
import { coordinateToKey } from "../utils/key-coordinate-swap";
import { getFileLetter } from "../utils/square-letter";

export interface HistoryProps {
  movesHistory: Move[];
  goToMoveHandler: (index: number) => void;
}

function History({ movesHistory, goToMoveHandler }: HistoryProps) {
  return (
    <div className="game-history text-white flex flex-col bg-gray-700 py-4 px-5 border border-white rounded">
      <p className="title pb-5 font-bold">Moves History</p>
      <div className="moves-history h-full">
        {movesHistory.length === 0 ? (
          <p>Play A Move</p>
        ) : (
          <ul>
            {movesHistory.map((move, i) => {
              return (
                <li className="cursor-pointer" key={i}>
                  {i + 1}. {getMoveName(move)}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {/* TODO: disable the buttons when needed */}
      <div className="buttons pt-5 flex justify-between items-center gap-5 border-t-[1px]">
        <ChangeMoveButton direction="<" clickHandler={goToMoveHandler} />
        <ChangeMoveButton direction=">" clickHandler={goToMoveHandler} />
      </div>
    </div>
  );
}

interface ChangeMoveButtonProps {
  direction: "<" | ">";
  clickHandler: (index: number) => void;
}

function ChangeMoveButton({ direction, clickHandler }: ChangeMoveButtonProps) {
  return (
    <button
      className="previous-move flex-1/2 p-2 border border-white text-2xl font-bold"
      onClick={() => clickHandler}
    >
      {direction}
    </button>
  );
}

function getMoveName(move: Move) {
  const { from, to, piece } = move;
  const fileLetter = getFileLetter(to.file);
  let moveText = coordinateToKey(to) as string;
  switch (piece.type) {
    case "pawn": {
      const normalPawnMove = fileLetter + to.rank;
      // eg. dxe5
      if (move.captured) {
        moveText = getFileLetter(from.file) + "x" + normalPawnMove;
      }
      // eg. a8=Q
      else if (move.promotion) {
        return normalPawnMove + "=" + move.promotion[0].toUpperCase();
      }
      // eg. e4
      else moveText = normalPawnMove;

      break;
    }

    case "king": {
      const normalKingMove = "k" + fileLetter + to.rank;
      moveText = normalKingMove;

      // eg. kxd3
      if (move.captured) {
        moveText = "kx" + fileLetter + to.rank;
      }
      // eg. O-O Or O-O-O
      else if (move.castle) {
        moveText = "O-O";
        if (move.castle === "long") moveText += "-O";
        break;
      }
      break;
    }
    case "queen":
    case "rook":
    case "bishop":
    case "knight":
  }
  if (move.isCheck) moveText += "+";
  return moveText;
}

export default memo(History);
