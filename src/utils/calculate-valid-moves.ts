import type { Coordinates, Piece, PieceColor } from "../types";
import checkPieceAt from "./check-piece-at";
import isValidCoordinates from "./coordinates-range";
import getPiece from "./get-piece";

// All Moves Calculated From White Perspective
export default function calculateValidMoves(
  pieces: Piece[],
  piece: Piece,
  turn: PieceColor,
  enPassantTarget?: Coordinates
  // lastMove?: Move
): Coordinates[] {
  let moves: Coordinates[] = [];
  if (turn !== piece.color) return [];

  const { rank, file } = piece.coordinates;

  const validMove = (to: Coordinates): boolean => {
    if (!isValidCoordinates(to)) return false;

    const p = getPiece(pieces, to);
    if (p && p.color === piece.color) return false;

    return true;
  };

  switch (piece.type) {
    case "pawn": {
      const isLight = piece.color === "light";

      // No piece ahead
      const frontSquare: Coordinates = {
        rank: isLight ? rank + 1 : rank - 1,
        file,
      };
      if (isValidCoordinates(frontSquare)) {
        if (!checkPieceAt(pieces, frontSquare)) moves.push(frontSquare);
      }

      // TODO: refactor this to a single function for normal capturing
      // Check for capturing left
      const frontLeft: Coordinates = {
        file: file - 1,
        rank: isLight ? rank + 1 : rank - 1,
      };
      if (isValidCoordinates(frontLeft)) {
        const ret = getPiece(pieces, frontLeft);
        if (ret && ret.color !== piece.color) moves.push(frontLeft);
      }

      // Check for capturing right
      const frontRight: Coordinates = {
        file: file + 1,
        rank: isLight ? rank + 1 : rank - 1,
      };
      if (isValidCoordinates(frontRight)) {
        const ret = getPiece(pieces, frontRight);
        if (ret && ret.color !== piece.color) moves.push(frontRight);
      }

      // First Move, Two squares ahead
      if (!piece.hasMoved) {
        const twoSquaresAhead: Coordinates = {
          rank: isLight ? rank + 2 : rank - 2,
          file,
        };
        if (isValidCoordinates(twoSquaresAhead)) {
          if (!checkPieceAt(pieces, frontSquare))
            if (!checkPieceAt(pieces, twoSquaresAhead))
              moves.push(twoSquaresAhead);
        }
      }

      // En Passant
      const enPassant = isLight ? rank === 5 : rank === 3;
      if (enPassant && enPassantTarget) moves.push(enPassantTarget);

      break;
    }

    case "knight": {
      // Get All Possible Moves And Filter Them
      moves.push({ rank: rank + 2, file: file - 1 }); // Up - Left
      moves.push({ rank: rank + 2, file: file + 1 }); // Up - Right
      moves.push({ rank: rank + 1, file: file - 2 }); // Left - Up
      moves.push({ rank: rank + 1, file: file + 2 }); // Right - Up
      moves.push({ rank: rank - 1, file: file - 2 }); // Left - Down
      moves.push({ rank: rank - 1, file: file + 2 }); // Right - Down
      moves.push({ rank: rank - 2, file: file - 1 }); // Down - Left
      moves.push({ rank: rank - 2, file: file + 1 }); // Down - Right

      moves = moves.filter((move) => validMove(move)); // Filter Valid Moves And Return Them
      break;
    }

    case "rook": {
      // Up And Down
      const getFileMovements = (direction: "up" | "down") => {
        const fileMoves = [];
        const move: Coordinates = {
          rank: direction == "up" ? rank + 1 : rank - 1,
          file,
        };
        while (isValidCoordinates(move)) {
          const p = getPiece(pieces, move);
          if (p && p.color === piece.color) break;
          fileMoves.push({ ...move }); // Copy the object
          move.rank += direction == "up" ? 1 : -1; // -1 similar to subtracting 1
          if (p) break; // Once we meet a piece we stop, Can't move through a  piece
        }
        return fileMoves;
      };

      const getRankMovements = (direction: "left" | "right") => {
        const rankMoves = [];
        const move: Coordinates = {
          rank,
          file: direction == "left" ? file - 1 : file + 1,
        };
        while (isValidCoordinates(move)) {
          const p = getPiece(pieces, move);
          if (p && p.color === piece.color) break;
          rankMoves.push({ ...move }); // Copy the object
          move.file -= direction == "left" ? 1 : -1; //
          if (p) break; // Once we meet a piece we stop, Can't move through a  piece
        }
        return rankMoves;
      };

      moves = [
        ...getFileMovements("up"),
        ...getFileMovements("down"),
        ...getRankMovements("left"),
        ...getRankMovements("right"),
      ];

      break;
    }

    case "bishop": {
      const mainDiagonalMoves = (direction: "up" | "down") => {
        const mainMoves: Coordinates[] = [];
        const move: Coordinates = {
          rank: rank + (direction === "up" ? 1 : -1),
          file: file + (direction === "up" ? -1 : 1),
        };
        while (isValidCoordinates(move)) {
          const p = getPiece(pieces, move);
          if (p && p.color === piece.color) break;
          mainMoves.push({ ...move }); // Copy the object
          move.rank += direction === "up" ? 1 : -1;
          move.file += direction === "up" ? -1 : 1;
          if (p) break; // Once we meet a piece we stop, Can't move through a  piece
        }
        return mainMoves;
      };

      const antiDiagonalMoves = (direction: "up" | "down") => {
        const antiMoves: Coordinates[] = [];
        const move: Coordinates = {
          rank: rank + (direction == "up" ? 1 : -1),
          file: file + (direction == "up" ? 1 : -1),
        };
        while (isValidCoordinates(move)) {
          const p = getPiece(pieces, move);
          if (p && p.color === piece.color) break;
          antiMoves.push({ ...move }); // Copy the object
          move.rank += direction == "up" ? 1 : -1;
          move.file += direction == "up" ? 1 : -1;
          if (p) break; // Once we meet a piece we stop, Can't move through a  piece
        }
        return antiMoves;
      };

      moves = [
        ...mainDiagonalMoves("up"),
        ...mainDiagonalMoves("down"),
        ...antiDiagonalMoves("up"),
        ...antiDiagonalMoves("down"),
      ];

      break;
    }

    // It's just a rook + bishop use can use recursion
    case "queen": {
      const rookMovements = calculateValidMoves(
        pieces,
        { ...piece, type: "rook" },
        turn
      );
      const bishopMovements = calculateValidMoves(
        pieces,
        { ...piece, type: "bishop" },
        turn
      );
      return [...rookMovements, ...bishopMovements];
    }

    case "king": {
      // Add All Possible Moves
      moves.push({ rank: rank + 1, file: file - 1 }); // Up - Left
      moves.push({ rank: rank + 1, file }); // Up
      moves.push({ rank: rank + 1, file: file + 1 }); // Up - Right
      moves.push({ rank, file: file - 1 }); // Left
      moves.push({ rank, file: file + 1 }); // Right
      moves.push({ rank: rank - 1, file: file - 1 }); // Down - Left
      moves.push({ rank: rank - 1, file }); // Down
      moves.push({ rank: rank - 1, file: file + 1 }); // Down - Right

      moves = moves.filter((move) => validMove(move)); // Filter The Moves

      // TODO: Check If There Is No Checks In The Way

      // If The King Moved
      if (piece.hasMoved) break;

      // Short Castling O-O
      // Looking For Pieces In The Way
      const hRook = getPiece(pieces, { rank, file: 8 });
      const lightBishop = checkPieceAt(pieces, { rank, file: 6 });
      const rightKnight = checkPieceAt(pieces, { rank, file: 7 });
      if (!lightBishop && !rightKnight && hRook && !hRook.hasMoved)
        moves.push({ rank, file: file + 2 });

      // Long Castling O-O-O
      const aRook = getPiece(pieces, { rank, file: 1 });
      const queen = checkPieceAt(pieces, { rank, file: 4 });
      const darkBishop = checkPieceAt(pieces, { rank, file: 3 });
      const leftKnight = checkPieceAt(pieces, { rank, file: 2 });
      if (!queen && !darkBishop && !leftKnight && aRook && !aRook.hasMoved)
        moves.push({ rank, file: file - 2 });
    }
  }

  return moves;
}
