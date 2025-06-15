import type { Coordinates, PieceColor } from "../types";

export default function getCastlingSquares(color: PieceColor): Coordinates[] {
  const rank = color === "light" ? 1 : 8;
  const squares: Coordinates[] = [];
  // Short castling check O-O
  squares.push({ rank, file: 6 });
  squares.push({ rank, file: 7 });
  // Log castling check O-O-O
  squares.push({ rank, file: 4 });
  squares.push({ rank, file: 3 });
  return squares;
}
