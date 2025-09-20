import { ChangeMoveButton } from "./ChangeMoveButton";
import { memo, useMemo } from "react";
import type { Move } from "../types";
import convertMovesToPairs from "../utils/convert-moves-to-pairs";
import MovesListItems from "./MovesListItems";

export interface HistoryProps {
  movesHistory: Move[];
  focusedMove: number;
  goToMoveHandler: (index: number) => void;
}

function History({ movesHistory, focusedMove, goToMoveHandler }: HistoryProps) {
  // Combine the move to a two-moves pair
  const movesPairs = useMemo(
    () => convertMovesToPairs(movesHistory),
    [movesHistory]
  );

  return (
    <div className="game-history text-white flex flex-col bg-gray-700 py-4 px-5 border border-white rounded">
      <p className="title pb-5 font-bold">Moves History</p>
      <div className="moves-history h-full max-h-full overflow-y-auto">
        {movesHistory.length === 0 ? (
          <p>Play A Move</p>
        ) : (
          <ol className="max-md:flex gap-1.5">
            <MovesListItems
              focusedMove={focusedMove}
              goToMoveHandler={goToMoveHandler}
              historyLength={movesHistory.length}
              movesPairs={movesPairs}
            />
          </ol>
        )}
      </div>
      {/* TODO: disable the buttons when needed */}
      <div className="buttons pt-5 flex justify-between items-center gap-5 border-t-[1px]">
        <ChangeMoveButton
          direction="<"
          clickHandler={() => goToMoveHandler(focusedMove - 1)}
        />
        <ChangeMoveButton
          direction=">"
          clickHandler={() => goToMoveHandler(focusedMove + 1)}
        />
      </div>
    </div>
  );
}

export default memo(History);
