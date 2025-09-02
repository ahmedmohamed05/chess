import { memo, type CSSProperties } from "react";
import type { Move } from "../types";
import getMoveName from "../utils/get-move-name";

export interface HistoryProps {
  movesHistory: Move[];
  focusedMove: number;
  goToMoveHandler: (index: number) => void;
}

function History({ movesHistory, focusedMove, goToMoveHandler }: HistoryProps) {
  const handlePreviousMove = () => goToMoveHandler(focusedMove - 1);
  const handleNextMove = () => goToMoveHandler(focusedMove + 1);

  return (
    <div className="game-history text-white flex flex-col bg-gray-700 py-4 px-5 border border-white rounded">
      <p className="title pb-5 font-bold">Moves History</p>
      <div className="moves-history h-full max-h-full overflow-y-auto">
        {movesHistory.length === 0 ? (
          <p>Play A Move</p>
        ) : (
          <ul>
            {movesHistory.map((move, i) => {
              const highlightMove =
                i === focusedMove && focusedMove !== movesHistory.length - 1;

              const styles: CSSProperties = {
                fontWeight: "bold",
              };

              return (
                <li
                  className="cursor-pointer"
                  style={highlightMove ? styles : {}}
                  key={i}
                  onClick={() => {
                    goToMoveHandler(i);
                  }}
                >
                  {i + 1}. {getMoveName(move)}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {/* TODO: disable the buttons when needed */}
      <div className="buttons pt-5 flex justify-between items-center gap-5 border-t-[1px]">
        <ChangeMoveButton direction="<" clickHandler={handlePreviousMove} />
        <ChangeMoveButton direction=">" clickHandler={handleNextMove} />
      </div>
    </div>
  );
}

interface ChangeMoveButtonProps {
  direction: "<" | ">";
  clickHandler: () => void;
}

function ChangeMoveButton({ direction, clickHandler }: ChangeMoveButtonProps) {
  return (
    <button
      className="previous-move flex-1/2 p-2 border border-white text-2xl font-bold"
      onClick={clickHandler}
    >
      {direction}
    </button>
  );
}

export default memo(History);
