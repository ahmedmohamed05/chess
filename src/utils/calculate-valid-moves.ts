import type { Coordinates, Piece, PieceColor } from "../types";
import checkPieceAt from "./check-piece-at";
import isValidCoordinates from "./coordinates-range";
import getPiece from "./get-piece";

// All Moves Calculated From White Perspective
export default function calculateValidMoves(
  pieces: Piece[],
  piece: Piece,
  turn: PieceColor
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

      // TODO: En Passant
      // const squareToTheLeft: Coordinates = { rank, file: file - 1 };
      // if (isValidCoordinates(squareToTheLeft)) {
      //   const p = getPiece(pieces, squareToTheLeft);
      //   console.log(p);
      //   if (p && p.color !== piece.color && !p.hasMoved) {
      //     moves.push(squareToTheLeft);
      //   }
      // }
      // const squareToTheRight: Coordinates = { rank, file: file + 1 };

      // if (isValidCoordinates(squareToTheRight)) {
      //   const p = getPiece(pieces, squareToTheRight);
      //   if (p && p.color !== piece.color && !p.hasMoved) {
      //     moves.push(squareToTheRight);
      //   }
      // }

      return moves;
    }

    case "knight": {
      const moves: Coordinates[] = [];

      // Get All Possible Moves And Filter Them
      moves.push({ rank: rank + 2, file: file - 1 }); // Up - Left
      moves.push({ rank: rank + 2, file: file + 1 }); // Up - Right
      moves.push({ rank: rank + 1, file: file - 2 }); // Left - Up
      moves.push({ rank: rank + 1, file: file + 2 }); // Right - Up
      moves.push({ rank: rank - 1, file: file - 2 }); // Left - Down
      moves.push({ rank: rank - 1, file: file + 2 }); // Right - Down
      moves.push({ rank: rank - 2, file: file - 1 }); // Down - Left
      moves.push({ rank: rank - 2, file: file + 1 }); // Down - Right

      return moves.filter((move) => validMove(move)); // Filter Valid Moves And Return Them
    }

    // TODO: Refactor this
    case "rook": {
      // UP
      {
        const move: Coordinates = { rank: rank + 1, file };
        while (isValidCoordinates(move)) {
          const p = getPiece(pieces, move);
          if (p && p.color === piece.color) break;
          moves.push({ ...move }); // Copy the object
          move.rank += 1;
          if (p) break; // Once we meet a piece we stop, Can't move through a  piece
        }
      }
      // Down
      {
        const move: Coordinates = { rank: rank - 1, file };
        while (isValidCoordinates(move)) {
          const p = getPiece(pieces, move);
          if (p && p.color === piece.color) break;
          moves.push({ ...move }); // Copy the object
          move.rank -= 1;
          if (p) break; // Once we meet a piece we stop, Can't move through a  piece
        }
      }
      // Left
      {
        const move: Coordinates = { rank, file: file - 1 };
        while (isValidCoordinates(move)) {
          const p = getPiece(pieces, move);
          if (p && p.color === piece.color) break;
          moves.push({ ...move }); // Copy the object
          move.file -= 1;
          if (p) break; // Once we meet a piece we stop, Can't move through a  piece
        }
      }
      // Right
      {
        const move: Coordinates = { rank, file: file + 1 };
        while (isValidCoordinates(move)) {
          const p = getPiece(pieces, move);
          if (p && p.color === piece.color) break;
          moves.push({ ...move }); // Copy the object
          move.file += 1;
          if (p) break; // Once we meet a piece we stop, Can't move through a  piece
        }
      }
      return moves;
    }

    // TODO: Refactor this
    case "bishop": {
      // Up - Right
      {
        const move: Coordinates = { rank: rank + 1, file: file + 1 };
        while (isValidCoordinates(move)) {
          const p = getPiece(pieces, move);
          if (p && p.color === piece.color) break;
          moves.push({ ...move }); // Copy the object
          move.rank += 1;
          move.file += 1;
          if (p) break; // Once we meet a piece we stop, Can't move through a  piece
        }
      }
      // Down - Right
      {
        const move: Coordinates = { rank: rank - 1, file: file + 1 };
        while (isValidCoordinates(move)) {
          const p = getPiece(pieces, move);
          if (p && p.color === piece.color) break;
          moves.push({ ...move }); // Copy the object
          move.rank -= 1;
          move.file += 1;
          if (p) break; // Once we meet a piece we stop, Can't move through a  piece
        }
      }
      // Up - Left
      {
        const move: Coordinates = { rank: rank + 1, file: file - 1 };
        while (isValidCoordinates(move)) {
          const p = getPiece(pieces, move);
          if (p && p.color === piece.color) break;
          moves.push({ ...move }); // Copy the object
          move.rank += 1;
          move.file -= 1;
          if (p) break; // Once we meet a piece we stop, Can't move through a  piece
        }
      }
      // Down - Left
      {
        const move: Coordinates = { rank: rank - 1, file: file - 1 };
        while (isValidCoordinates(move)) {
          const p = getPiece(pieces, move);
          if (p && p.color === piece.color) break;
          moves.push({ ...move }); // Copy the object
          move.rank -= 1;
          move.file -= 1;
          if (p) break; // Once we meet a piece we stop, Can't move through a  piece
        }
      }

      console.log(moves);
      return moves;
    }

    // It's just a rook + bishop
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

      // If The King Moved
      if (piece.hasMoved) return moves;

      // Short Castling O-O
      // Looking For Pieces In The Way
      if (checkPieceAt(pieces, { rank, file: 6 })) return moves; // Light-Squares Bishop
      if (checkPieceAt(pieces, { rank, file: 7 })) return moves; // Knight
      const hRook = getPiece(pieces, { rank, file: 8 });
      if (hRook && !hRook.hasMoved) moves.push({ rank, file: file + 2 });

      // Long Castling O-O-O
      // Looking For Pieces In The Way
      if (checkPieceAt(pieces, { rank, file: 4 })) return moves; // Queen
      if (checkPieceAt(pieces, { rank, file: 3 })) return moves; // Dark-Squares Bishop
      if (checkPieceAt(pieces, { rank, file: 2 })) return moves; // Knight
      const aRook = getPiece(pieces, { rank, file: 1 });
      if (aRook && !aRook.hasMoved) moves.push({ rank, file: file - 2 });

      return moves;
    }
  }
  return [];
}
