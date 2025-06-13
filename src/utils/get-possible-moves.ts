import type { Coordinates, Piece } from "../types";

export default function getPossibleMoves(piece: Piece): Coordinates[] {
  const { rank, file } = piece.coordinates;
  const moves: Coordinates[] = [];
  switch (piece.type) {
    case "king":
      moves.push({ rank: rank + 1, file: file - 1 }); // Up - Left
      moves.push({ rank: rank + 1, file }); // Up
      moves.push({ rank: rank + 1, file: file + 1 }); // Up - Right
      moves.push({ rank, file: file - 1 }); // Left
      moves.push({ rank, file: file + 1 }); // Right
      moves.push({ rank: rank - 1, file: file - 1 }); // Down - Left
      moves.push({ rank: rank - 1, file }); // Down
      moves.push({ rank: rank - 1, file: file + 1 }); // Down - Right
      break;
    case "queen":
      break;
    case "rook": {
      //
      for (let i = rank + 1; i <= 8; i++) {
        moves.push({ rank: rank + i, file });
      }
      break;
    }
    case "bishop":
      break;
    case "knight":
      moves.push({ rank: rank + 2, file: file - 1 }); // Up - Left
      moves.push({ rank: rank + 2, file: file - 1 }); // Up - Right
      moves.push({ rank: rank + 1, file: file - 2 }); // Left - Up
      moves.push({ rank: rank + 1, file: file + 2 }); // Right - Up
      moves.push({ rank: rank - 1, file: file - 2 }); // Left - Down
      moves.push({ rank: rank - 1, file: file + 2 }); // Right - Down
      moves.push({ rank: rank - 2, file: file - 1 }); // Down - Left
      moves.push({ rank: rank - 2, file: file + 1 }); // Down - Right
      break;
  }

  return moves;
}
