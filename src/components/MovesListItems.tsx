import type { CSSProperties, ReactNode } from "react";
import type { MovesPair } from "../types";
import getMoveName from "../utils/get-move-name";

export interface MovesListItemsProps {
  movesPairs: MovesPair[];
  historyLength: number;
  focusedMove: number;
  goToMoveHandler: (index: number) => void;
}

export default function MovesListItems({
  movesPairs,
  historyLength,
  focusedMove,
  goToMoveHandler,
}: MovesListItemsProps) {
  const result: ReactNode[] = [];

  for (const { first, second } of movesPairs) {
    const lightMoveStylesCondition =
      first.index === focusedMove && focusedMove !== historyLength - 1;

    const secondMoveStylesCondition =
      second?.index === focusedMove && focusedMove !== historyLength - 1;

    const styles: CSSProperties = {
      fontWeight: "bold",
    };

    result.push(
      <li
        key={crypto.randomUUID()}
        className="game-history__item flex items-center gap-0.5 py-0.5 px-1 rounded"
        style={{ marginBlockEnd: 10 }}
      >
        <div className="move-number">{first.index + 1}.</div>
        <div className="moves-pair w-full flex justify-between items-center max-md:gap-4">
          <div
            className="light-move cursor-pointer"
            style={lightMoveStylesCondition ? styles : {}}
            onClick={() => {
              goToMoveHandler(first.index);
            }}
          >
            {getMoveName(first)}
          </div>
          {second && (
            <div
              className="dark-move cursor-pointer"
              style={secondMoveStylesCondition ? styles : {}}
              onClick={() => {
                goToMoveHandler(second.index);
              }}
            >
              {getMoveName(second)}
            </div>
          )}
        </div>
      </li>
    );
  }

  return result;
}
