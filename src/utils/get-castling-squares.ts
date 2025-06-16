import type { Coordinates, PieceColor } from "../types";

export default function getCastlingSquares(color: PieceColor) {
  const rank = color === "light" ? 1 : 8;
  const result: {
    long: Coordinates[];
    short: Coordinates[];
  } = {
    short: [],
    long: [],
  };
  // Short castling check O-O
  result.short.push({ rank, file: 6 });
  result.short.push({ rank, file: 7 });

  // Log castling check O-O-O
  result.long.push({ rank, file: 4 });
  result.long.push({ rank, file: 3 });
  return result;
}
