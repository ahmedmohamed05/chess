import { type MouseEvent, type TouchEvent } from "react";
import type { PieceColor, PromotionOption } from "../types";
import getPieceIcon from "../utils/get-piece-icon";

export interface PromotionSpanProps {
  color: PieceColor;
  type: PromotionOption;
  promoteHandler: (type: PromotionOption) => void;
}

export default function PromotionSpan({
  color,
  type,
  promoteHandler,
}: PromotionSpanProps) {
  const clickHandler = (e: MouseEvent<HTMLSpanElement>) => {
    const span = (e.target as HTMLSpanElement).parentElement!;
    const type = span.dataset.type as PromotionOption;
    promoteHandler(type);
  };

  const touchHandler = (e: TouchEvent<HTMLSpanElement>) => {
    const span = (e.target as HTMLSpanElement).parentElement!;
    const type = span.dataset.type as PromotionOption;
    promoteHandler(type);
  };

  return (
    <span data-type={type} onClick={clickHandler} onTouchStart={touchHandler}>
      <img src={getPieceIcon(type, color)} alt="" />
    </span>
  );
}
