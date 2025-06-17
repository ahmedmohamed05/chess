import type { PromotionOptions, SquareColor } from "../types";
import PromotionOps from "./PromotionOps";

export interface SquareProps {
  color: SquareColor;
  icon?: string;
  rank: number;
  file: number;
  showPromotionOptions: boolean;
  promoteHandler: (promoteTo: PromotionOptions) => void;
}

export default function Square({
  color,
  icon,
  rank,
  file,
  showPromotionOptions,
  promoteHandler,
}: SquareProps) {
  return (
    <div
      data-color={color}
      data-piece={icon !== undefined}
      data-rank={rank}
      data-file={file}
      className="piece square relative bg-no-repeat bg-center hover:cursor-grab active:cursor-grabbing"
      style={
        icon
          ? {
              backgroundImage: `url("${icon}")`,
              backgroundSize: "var(--piece-size)",
              width: "var(--piece-size)",
              height: "var(--piece-size)",
            }
          : {}
      }
    >
      {showPromotionOptions && (
        <div className="promoting-square absolute bg-slate-500 p-1.5 left-1/2 top-1/2 -translate-1/2 z-50">
          <PromotionOps
            color={rank === 8 ? "light" : "dark"}
            promoteHandler={promoteHandler}
          />
        </div>
      )}
    </div>
  );
}
