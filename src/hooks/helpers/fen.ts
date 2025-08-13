import type { Coordinates, PieceColor, PiecesMap } from "../../types";
import { coordinateToKey } from "../../utils/key-coordinate-swap";
import { getFileLetter } from "../../utils/square-letter";

export default function getFEN(
  pieces: PiecesMap,
  turn: PieceColor,
  enPassantTarget: Coordinates | undefined,
  movesPlayed: number
): string {
  let fen = "";

  for (let rank = 8; rank >= 1; rank--) {
    let emptySquares = 0;
    for (let file = 1; file <= 8; file++) {
      const key = coordinateToKey({ rank, file });
      const pieceOnSquare = pieces.get(key);
      // Increase the number of empty squares and continue if there is no piece on the square
      if (!pieceOnSquare) {
        emptySquares++;
        continue;
      }
      // Add and reset the number of empty squares if there is
      if (emptySquares !== 0) {
        fen += emptySquares.toString();
        emptySquares = 0;
      }

      const isLight = pieceOnSquare.color === "light";

      // Using letter 'n' or 'N' for the Knight piece
      if (pieceOnSquare.type === "knight") {
        fen += isLight ? "N" : "n";
        continue;
      }
      const firstLetter = pieceOnSquare.type[0];
      fen += isLight ? firstLetter.toUpperCase() : firstLetter;
    }

    if (emptySquares !== 0) fen += emptySquares.toString();
    if (rank !== 1) fen += "/";
  }

  // Add the turns letter
  fen += " " + (turn === "light" ? "w" : "b");

  //TODO Castling rights
  // getCastlingSquares(turn);

  if (enPassantTarget)
    fen += " " + getFileLetter(enPassantTarget.file) + enPassantTarget.rank;

  // fen += " " + Math.floor(movesPlayed / 2).toString(); // Calculate full moves

  return fen;
}
