import type { PieceColor, PieceType } from "../types";

// ex: pawn-l.svg, king-d.svg
export default function getPieceIcon(type: PieceType, color: PieceColor) {
  return `/images/${type}-${color[0]}.svg`;
}
