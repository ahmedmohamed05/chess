import type { PieceColor, PromotionOption } from "../types";
import PromotionSpan from "./PromotionSpan";

export interface PromotionOpsProps {
  color: PieceColor;
  promoteHandler: (promoteTo: PromotionOption) => void;
}

export default function PromotionOps({
  color,
  promoteHandler,
}: PromotionOpsProps) {
  const opts: PromotionOption[] = ["queen", "rook", "bishop", "knight"];
  const out = [];
  for (const op of opts) {
    out.push(
      <PromotionSpan
        key={op}
        color={color}
        promoteHandler={promoteHandler}
        type={op}
      />
    );
  }
  return out;
}
