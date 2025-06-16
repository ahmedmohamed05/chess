import type { MouseEvent } from "react";
import type { PieceColor, PromotionOptions } from "../types";
import getPieceIcon from "../utils/get-piece-icon";

export interface PromotionSpanProps {
  color: PieceColor;
  type: PromotionOptions;
  promoteHandler: (type: PromotionOptions) => void;
}

export default function PromotionSpan({
  color,
  type,
  promoteHandler,
}: PromotionSpanProps) {
  const clickHandler = (e: MouseEvent<HTMLSpanElement>) => {
    const span = (e.target as HTMLSpanElement).parentElement!;
    const type = span.dataset.type as PromotionOptions;
    promoteHandler(type);
  };

  return (
    <span data-type={type} onClick={clickHandler}>
      <img src={getPieceIcon(type, color)} alt="" />
    </span>
  );
}
