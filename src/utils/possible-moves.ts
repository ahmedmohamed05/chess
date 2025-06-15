import type { Coordinates, PieceType } from "../types";

// NOTE: The moves are not filter, may not be all valid
export default function getAllPossibleMoves(
  what: Extract<PieceType, "knight" | "king">,
  fromPosition: Coordinates
): Coordinates[] {
  const { rank, file } = fromPosition;
  const moves: Coordinates[] = [];
  if (what === "knight") {
    moves.push({ rank: rank + 2, file: file - 1 }); // Up - Left
    moves.push({ rank: rank + 2, file: file + 1 }); // Up - Right
    moves.push({ rank: rank + 1, file: file - 2 }); // Left - Up
    moves.push({ rank: rank + 1, file: file + 2 }); // Right - Up
    moves.push({ rank: rank - 1, file: file - 2 }); // Left - Down
    moves.push({ rank: rank - 1, file: file + 2 }); // Right - Down
    moves.push({ rank: rank - 2, file: file - 1 }); // Down - Left
    moves.push({ rank: rank - 2, file: file + 1 }); // Down - Right
  } else {
    moves.push({ rank: rank + 1, file: file - 1 }); // Up - Left
    moves.push({ rank: rank + 1, file }); // Up
    moves.push({ rank: rank + 1, file: file + 1 }); // Up - Right
    moves.push({ rank, file: file - 1 }); // Left
    moves.push({ rank, file: file + 1 }); // Right
    moves.push({ rank: rank - 1, file: file - 1 }); // Down - Left
    moves.push({ rank: rank - 1, file }); // Down
    moves.push({ rank: rank - 1, file: file + 1 }); // Down - Right
  }

  return moves;
}
