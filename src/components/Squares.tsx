import { FILES, RANKS } from "../constants";
import type { Coordinates, Move, PiecesMap, PromotionOptions } from "../types";
import sameCoordinates from "../utils/check-coordinates";
import getPieceIcon from "../utils/get-piece-icon";
import getColor from "../utils/get-square-color";
import { coordinateToKey } from "../utils/key-coordinate-swap";
import { getFileLetter } from "../utils/square-letter";
import Square from "./Square";

export interface SquaresProps {
  pieces: PiecesMap;
  highlight: Coordinates[];
  lastMove?: Move;
  promotion?: Coordinates;
  promoteHandler: (promoteTo: PromotionOptions) => void;
}

export default function Squares({
  pieces,
  highlight,
  lastMove,
  promotion,
  promoteHandler,
}: SquaresProps) {
  const squares = [];

  for (let i = RANKS.length - 1; i >= 0; i--) {
    for (let j = 0; j < FILES.length; j++) {
      const color = getColor(i + 1, j + 1);
      const rank = i + 1;
      const file = j + 1;

      let icon = undefined;
      let highlighted = false;

      const isIcon = pieces.get(coordinateToKey({ rank, file }));
      if (isIcon) icon = getPieceIcon(isIcon.type, isIcon.color);

      highlight.forEach((coordinates) => {
        if (sameCoordinates({ rank, file }, coordinates)) highlighted = true;
      });

      let showPromotionOptions = false;
      if (promotion)
        showPromotionOptions = sameCoordinates({ rank, file }, promotion);

      // Highlight from and to squares
      const fromBorderColor =
        lastMove && sameCoordinates({ rank, file }, lastMove.from) && "#c9c9c9";
      const toBorderColor =
        lastMove && sameCoordinates({ rank, file }, lastMove.to) && "#fff";
      const borderColor = fromBorderColor || toBorderColor;
      const border = borderColor
        ? { border: `solid   3px ${borderColor}` }
        : { border: "none" };

      squares.push(
        <div
          className="tile flex justify-center items-center"
          data-rank={rank}
          data-letter={getFileLetter(file)}
          key={i + "-" + j}
          style={border}
        >
          <Square
            icon={icon}
            color={color}
            rank={rank}
            file={file}
            showPromotionOptions={showPromotionOptions}
            promoteHandler={promoteHandler}
          />
          {highlighted && !icon && (
            <div className="absolute w-4 aspect-square rounded-full bg-gray-500/60"></div>
          )}
          {highlighted && icon && (
            <div className="absolute w-[var(--square-size)] -scale-90 aspect-square rounded-full border-4 border-gray-500/60"></div>
          )}
        </div>
      );
    }
  }

  return squares;
}
