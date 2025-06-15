import type { Coordinates, Piece, PiecesMap } from "../types";
import sameCoordinates from "./check-coordinates";
import isValidCoordinates from "./coordinates-range";
import getAllPossibleMoves from "./possible-moves";

export default function pieceCanSee(
  pieces: PiecesMap,
  piece: Piece,
  square: Coordinates
): boolean {
  const { rank, file } = square;
  const lastRank = 8 - rank;
  const lastFile = 8 - file;

  switch (piece.type) {
    // TODO: Refactor to a single function
    case "rook": {
      // Check only 7 more because we are on a square 1 + 7 == 8 which is last square
      // Check Up Ranks
      for (let i = 1; i <= lastRank; i++) {
        const coo = { ...square, rank: rank + i };
        if (!isValidCoordinates(coo)) return false; // No More Valid Squares
        if (sameCoordinates(piece.coordinates, coo)) return true;
      }

      // Check Down Ranks
      for (let i = 1; i <= lastRank; i++) {
        const coo = { ...square, rank: rank - i };
        if (!isValidCoordinates(coo)) return false; // No More Valid Squares
        if (sameCoordinates(piece.coordinates, coo)) return true;
      }

      // Check Right Files
      for (let i = 0; i <= lastFile; i++) {
        const coo = { ...square, file: file + i };
        if (!isValidCoordinates(coo)) return false; // No More Valid Squares
        if (sameCoordinates(piece.coordinates, coo)) return true;
      }

      // Check Left Files
      for (let i = 0; i <= lastFile; i++) {
        const coo = { ...square, file: file - i };
        if (!isValidCoordinates(coo)) return false; // No More Valid Squares
        if (sameCoordinates(piece.coordinates, coo)) return true;
      }
      return false;
    }

    case "bishop": {
      const mainDiagonal = (isUp: boolean) => {
        for (let i = 1; i <= 8 - rank; i++) {
          const move: Coordinates = {
            rank: rank + (isUp ? i : -i),
            file: file - (isUp ? i : -i),
          };
          if (!isValidCoordinates(move)) return false;
          if (sameCoordinates(move, piece.coordinates)) return true;
        }

        return false;
      };
      const antiDiagonal = (isUp: boolean) => {
        for (let i = 1; i <= lastRank && i <= lastFile; i++) {
          const move: Coordinates = {
            rank: rank + (isUp ? 1 : -1),
            file: file + (isUp ? 1 : -1),
          };
          if (!isValidCoordinates(move)) return false;
          if (sameCoordinates(move, piece.coordinates)) return true;
        }

        return false;
      };

      const main = mainDiagonal(true) || mainDiagonal(false);
      const anti = antiDiagonal(true) || antiDiagonal(false);
      return main || anti;
    }
    // It's just a bishop + rook, we can use recursion
    case "queen": {
      const bishop = pieceCanSee({ ...piece, type: "bishop" }, square);
      const rook = pieceCanSee({ ...piece, type: "rook" }, square);
      return bishop || rook;
    }
    case "pawn": {
      // light pawns see's forwards move, dark see backwards
      const newRank = rank + (piece.color === "light" ? 1 : -1);

      const upLeft: Coordinates = { rank: newRank, file: file - 1 };
      if (
        isValidCoordinates(upLeft) &&
        sameCoordinates(upLeft, piece.coordinates)
      )
        return true;

      const upRight: Coordinates = { rank: newRank, file: file + 1 };
      if (
        isValidCoordinates(upRight) &&
        sameCoordinates(upRight, piece.coordinates)
      )
        return true;

      return false;
    }
    case "knight": {
      // Get All Possible Moves
      const allMoves = getAllPossibleMoves("knight", piece.coordinates).filter(
        (move) => isValidCoordinates(move)
      );
      for (const move of allMoves) {
        if (sameCoordinates(piece.coordinates, move)) return true;
      }

      return false;
    }
    case "king": {
      // Get All Possible Moves
      const allMoves = getAllPossibleMoves("king", piece.coordinates).filter(
        (move) => isValidCoordinates(move)
      );
      for (const move of allMoves) {
        if (sameCoordinates(piece.coordinates, move)) return true;
      }

      return false;
    }
  }
  throw Error("Invalid Piece Type");
}
