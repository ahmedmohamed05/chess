import type { Coordinates, PieceColor, PiecesMap } from "../../types";
import findPiece from "../../utils/find-piece";
import getPieceMoves from "../../utils/get-piece-moves";
import isCheckOn from "../../utils/is-check";
import { coordinateToKey } from "../../utils/key-coordinate-swap";
import { getFileLetter } from "../../utils/square-letter";
import handleCastling from "./handle-castling";

export default function getFEN(
  pieces: PiecesMap,
  turn: PieceColor,
  enPassantTarget: Coordinates | undefined
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

  if (enPassantTarget)
    fen += " " + getFileLetter(enPassantTarget.file) + enPassantTarget.rank;

  //TODO: Refactor this to one function
  // Castling Rights for dark King
  {
    const darkKing = findPiece(
      pieces,
      (p) => p.type === "king" && p.color === "dark"
    );
    if (!darkKing) throw Error("Dark king is missed");

    const kingMoves = getPieceMoves(
      pieces,
      darkKing,
      turn,
      enPassantTarget,
      isCheckOn(pieces, darkKing)
    );

    for (const kingMove of kingMoves) {
      const ret = handleCastling(
        pieces,
        darkKing,
        darkKing.coordinates,
        kingMove
      );
      if (ret === undefined) continue;
      if (ret === "short") fen += " " + "k";
      if (ret === "long") fen += " " + "q";
    }
  }

  // Castling Rights for light King
  {
    const whiteKing = findPiece(
      pieces,
      (p) => p.type === "king" && p.color === "light"
    );
    if (!whiteKing) throw Error("Light king is missed");

    const kingMoves = getPieceMoves(
      pieces,
      whiteKing,
      turn,
      enPassantTarget,
      isCheckOn(pieces, whiteKing)
    );

    for (const kingMove of kingMoves) {
      const ret = handleCastling(
        pieces,
        whiteKing,
        whiteKing.coordinates,
        kingMove
      );
      if (ret === undefined) continue;
      if (ret === "short") fen += " " + "K";
      if (ret === "long") fen += " " + "Q";
    }
  }

  // fen += " " + Math.floor(movesPlayed / 2).toString(); // Calculate full moves

  return fen;
}
