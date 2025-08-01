import type { Coordinates, Piece, PiecesMap } from "../types";
import sameCoordinates from "./check-coordinates";
import isValidCoordinates from "./coordinates-range";
import { coordinateToKey } from "./key-coordinate-swap";
import getAllPossibleMoves from "./possible-moves";

export default function pieceCanSee(
  pieces: PiecesMap,
  piece: Piece,
  targetSquare: Coordinates
): boolean {
  const { rank, file } = piece.coordinates;

  switch (piece.type) {
    case "rook": {
      const checkRanks = (direction: "up" | "down") => {
        for (let amount = 1; amount < 8; amount++) {
          const coords = {
            rank: direction == "up" ? rank + amount : rank - amount,
            file,
          };
          if (!isValidCoordinates(coords)) return false;
          const sameCoords = sameCoordinates(coords, targetSquare);
          const pieceOnSquare = pieces.get(coordinateToKey(coords));

          if (pieceOnSquare) {
            if (sameCoords) {
              return piece.color !== pieceOnSquare.color;
            }
            return false;
          }
        }

        return false;
      };

      const checkFiles = (direction: "left" | "right") => {
        for (let amount = 1; amount < 8; amount++) {
          const coords = {
            rank,
            file: direction == "right" ? file + amount : file - amount,
          };
          if (!isValidCoordinates(coords)) return false;
          const sameCoords = sameCoordinates(coords, targetSquare);
          const pieceOnSquare = pieces.get(coordinateToKey(coords));
          if (pieceOnSquare) {
            if (sameCoords) {
              return piece.color !== pieceOnSquare.color;
            }
            return false;
          }
        }
        return false;
      };

      return (
        checkRanks("up") ||
        checkRanks("down") ||
        checkFiles("left") ||
        checkFiles("right")
      );
    }

    case "bishop": {
      const mainDiagonal = (direction: "up" | "down"): boolean => {
        for (let offset = 1; offset < 8; offset++) {
          const coords: Coordinates = {
            rank: direction === "up" ? rank + offset : rank - offset,
            file: direction === "up" ? file - offset : file + offset,
          };
          if (!isValidCoordinates(coords)) return false;
          // Piece on the target square with same color => false
          // Piece on the target square with other color => true
          // No Piece on the target square => true
          const sameCoords = sameCoordinates(coords, targetSquare);
          const pieceOnSquare = pieces.get(coordinateToKey(coords));
          if (sameCoords) {
            if (pieceOnSquare) {
              const diffColor = pieceOnSquare.color !== piece.color;
              return diffColor;
            }
          }
          if (pieceOnSquare) return false;
        }
        return false;
      };

      const antiDiagonal = (direction: "up" | "down") => {
        for (let offset = 1; offset < 8; offset++) {
          const coords: Coordinates = {
            rank: direction === "up" ? rank + offset : rank - offset,
            file: direction === "up" ? file + offset : file - offset,
          };
          if (!isValidCoordinates(coords)) return false;
          // Piece on the target square with same color => false
          // Piece on the target square with other color => true
          // No Piece on the target square => true
          const sameCoords = sameCoordinates(coords, targetSquare);
          const pieceOnSquare = pieces.get(coordinateToKey(coords));
          if (sameCoords) {
            if (pieceOnSquare) {
              const diffColor = pieceOnSquare.color !== piece.color;
              return diffColor;
            }
          }
          if (pieceOnSquare) return false;
        }
        return false;
      };

      const main = mainDiagonal("up") || mainDiagonal("down");
      const anti = antiDiagonal("up") || antiDiagonal("down");
      return main || anti;
    }
    // It's just a bishop + rook, we can use recursion
    case "queen": {
      const bishop = pieceCanSee(
        pieces,
        { ...piece, type: "bishop" },
        targetSquare
      );
      const rook = pieceCanSee(
        pieces,
        { ...piece, type: "rook" },
        targetSquare
      );
      return bishop || rook;
    }

    case "knight": {
      // Get All Possible Moves
      const allCords = getAllPossibleMoves("knight", piece.coordinates).filter(
        (move) => isValidCoordinates(move)
      );
      for (const coords of allCords) {
        // Piece on the target square with same color => false
        // Piece on the target square with other color => true
        // No Piece on the target square => true
        const pieceOnSquare = pieces.get(coordinateToKey(coords));
        if (
          pieceOnSquare &&
          sameCoordinates(pieceOnSquare.coordinates, targetSquare) &&
          pieceOnSquare.color === piece.color
        )
          return false;
        if (sameCoordinates(coords, targetSquare)) return true;
      }

      return false;
    }

    case "king": {
      // Get All Possible Moves
      const allCoords = getAllPossibleMoves("king", piece.coordinates).filter(
        (move) => isValidCoordinates(move)
      );
      for (const coords of allCoords) {
        if (sameCoordinates(coords, targetSquare)) return true;
      }

      return false;
    }

    case "pawn": {
      // light pawns see's forwards move, dark see backwards
      const newRank = rank + (piece.color === "light" ? 1 : -1);

      const leftCapturing: Coordinates = { rank: newRank, file: file - 1 };
      if (
        isValidCoordinates(leftCapturing) &&
        sameCoordinates(leftCapturing, targetSquare)
      )
        return true;

      const rightCapturing: Coordinates = { rank: newRank, file: file + 1 };
      if (
        isValidCoordinates(rightCapturing) &&
        sameCoordinates(rightCapturing, targetSquare)
      )
        return true;

      return false;
    }
  }
  throw Error("Invalid Piece Type");
}
