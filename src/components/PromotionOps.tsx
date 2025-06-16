import type { PieceColor, PromotionOptions } from "../types";
import PromotionSpan from "./PromotionSpan";

export interface PromotionOpsProps {
  color: PieceColor;
  promoteHandler: (promoteTo: PromotionOptions) => void;
}

export default function PromotionOps({
  color,
  promoteHandler,
}: PromotionOpsProps) {
  const opts: PromotionOptions[] = ["bishop", "knight", "queen", "rook"];
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
