import { ChangeMoveButton } from "./ChangeMoveButton";
import { memo, useMemo, type CSSProperties, type ReactNode } from "react";
import type { Move, MovesPair } from "../types";
import getMoveName from "../utils/get-move-name";

export interface HistoryProps {
  movesHistory: Move[];
  focusedMove: number;
  goToMoveHandler: (index: number) => void;
}

function History({ movesHistory, focusedMove, goToMoveHandler }: HistoryProps) {
  const handlePreviousMove = () => goToMoveHandler(focusedMove - 1);
  const handleNextMove = () => goToMoveHandler(focusedMove + 1);

  // TODO: extract this functions into separated files

  // Combine the move to a two-moves pair
  const movesPairs: MovesPair[] = useMemo(() => {
    // First move edge case
    if (movesHistory.length === 1) {
      return [
        {
          first: { ...movesHistory[0], index: 0 },
          second: undefined,
        },
      ];
    }

    const result: MovesPair[] = [];

    for (let i = 0; i < movesHistory.length; i++) {
      const move = movesHistory[i];
      if (move.piece.color === "dark") continue;

      // Light player's move
      result.push({ first: { ...move, index: i }, second: undefined });

      // Peak to the next move which is the dark player move and add it if exists
      if (i + 1 < movesHistory.length) {
        result.pop();
        result.push({
          first: { ...move, index: i },
          second: { ...movesHistory[i + 1], index: i + 1 },
        });
      }
    }

    return result;
  }, [movesHistory]);

  // Convert Moves Pairs to React elements
  const movesListItems: ReactNode[] = useMemo(() => {
    const result: ReactNode[] = [];

    for (const { first, second } of movesPairs) {
      const lightMoveStylesCondition =
        first.index === focusedMove && focusedMove !== movesHistory.length - 1;

      const secondMoveStylesCondition =
        second?.index === focusedMove &&
        focusedMove !== movesHistory.length - 1;

      const styles: CSSProperties = {
        fontWeight: "bold",
      };

      result.push(
        <li
          key={crypto.randomUUID()}
          className="flex justify-between items-center"
          style={{ marginBlockEnd: 10 }}
        >
          <div
            className="light-move cursor-pointer"
            style={lightMoveStylesCondition ? styles : {}}
            onClick={() => {
              goToMoveHandler(first.index);
            }}
          >
            {first.index + 1}. {getMoveName(first)}
          </div>

          {second && (
            <div
              className="dark-move cursor-pointer"
              style={secondMoveStylesCondition ? styles : {}}
              onClick={() => {
                goToMoveHandler(second.index);
              }}
            >
              {second.index + 1}. {getMoveName(second)}
            </div>
          )}
        </li>
      );
    }

    return result;
  }, [movesPairs, goToMoveHandler, focusedMove, movesHistory]);

  return (
    <div className="game-history text-white flex flex-col bg-gray-700 py-4 px-5 border border-white rounded">
      <p className="title pb-5 font-bold">Moves History</p>
      <div className="moves-history h-full max-h-full overflow-y-auto">
        {movesHistory.length === 0 ? (
          <p>Play A Move</p>
        ) : (
          <ol>{movesListItems}</ol>
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

export default memo(History);
