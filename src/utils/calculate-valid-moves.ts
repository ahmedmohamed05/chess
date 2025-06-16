import type { Coordinates, Piece, PieceColor, PiecesMap } from "../types";
import isValidCoordinates from "./coordinates-range";
import pieceCanSee from "./does-see";
import getCastlingSquares from "./get-castling-squares";
import { coordinateToKey } from "./key-coordinate-swap";
import getAllPossibleMoves from "./possible-moves";

// All Moves Calculated From White Perspective
export default function calculateValidMoves(
  pieces: PiecesMap,
  piece: Piece,
  turn: PieceColor,
  enPassantTarget?: Coordinates,
  isCheck?: boolean
): Coordinates[] {
  if (turn !== piece.color) return [];

  let moves: Coordinates[] = [];
  const { rank, file } = piece.coordinates;

  const validMove = (to: Coordinates): boolean => {
    if (!isValidCoordinates(to)) return false;

    const p = pieces.get(coordinateToKey(to));
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

      // No need to validate coordinates
      if (!pieces.has(coordinateToKey(frontSquare))) moves.push(frontSquare);

      // TODO: refactor this to a single function for normal capturing
      // Check for capturing left
      {
        const frontLeft: Coordinates = {
          file: file - 1,
          rank: isLight ? rank + 1 : rank - 1,
        };
        const ret = pieces.get(coordinateToKey(frontLeft));
        if (ret && ret.color !== piece.color) moves.push(frontLeft);
      }

      // Check for capturing right
      {
        const frontRight: Coordinates = {
          file: file + 1,
          rank: isLight ? rank + 1 : rank - 1,
        };
        const ret = pieces.get(coordinateToKey(frontRight));
        if (ret && ret.color !== piece.color) moves.push(frontRight);
      }

      // First Move, Two squares ahead
      if (!piece.hasMoved) {
        const twoSquaresAhead: Coordinates = {
          rank: isLight ? rank + 2 : rank - 2,
          file,
        };

        if (isValidCoordinates(twoSquaresAhead)) {
          if (!pieces.has(coordinateToKey(frontSquare)))
            if (!pieces.has(coordinateToKey(twoSquaresAhead)))
              moves.push(twoSquaresAhead);
        }
      }

      // En Passant
      const enPassant = (isLight && rank === 5) || (!isLight && rank === 4);
      if (enPassant && enPassantTarget) moves.push(enPassantTarget);

      break;
    }

    case "knight": {
      // Get All Possible Moves And Filter Them
      moves = getAllPossibleMoves("knight", piece.coordinates).filter((move) =>
        validMove(move)
      );
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
          const p = pieces.get(coordinateToKey(move));
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
          const p = pieces.get(coordinateToKey(move));
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
          const p = pieces.get(coordinateToKey(move));
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
          const p = pieces.get(coordinateToKey(move));
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

    // It's just a rook + bishop we can use recursion
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
      moves = getAllPossibleMoves("king", piece.coordinates).filter((move) =>
        validMove(move)
      );

      moves = moves.filter((move) => validMove(move)); // Filter The Moves

      // If The King Moved
      if (piece.hasMoved) break;

      if (isCheck) break;

      const opponentPieces: PiecesMap = new Map();
      for (const [key, piece] of pieces) {
        if (piece.color !== turn) opponentPieces.set(key, piece);
      }

      // Short Castling O-O
      // Looking For Pieces In The Way
      const shortCastlingSquares = getCastlingSquares(turn).short;
      let canCastleShort = true;
      for (const shortCastlingSquare of shortCastlingSquares) {
        for (const [, piece] of opponentPieces) {
          if (pieceCanSee(opponentPieces, piece, shortCastlingSquare)) {
            canCastleShort = false;
            break;
          }
        }
      }
      if (canCastleShort) {
        const hRook = pieces.get(coordinateToKey({ rank, file: 8 }));
        const lightBishop = pieces.has(coordinateToKey({ rank, file: 6 }));
        const rightKnight = pieces.has(coordinateToKey({ rank, file: 7 }));
        if (!lightBishop && !rightKnight && hRook && !hRook.hasMoved)
          moves.push({ rank, file: file + 2 });
      }

      // Long Castling O-O-O
      // Looking For Pieces In The Way
      const longCastlingSquares = getCastlingSquares(turn).long;
      let canCastleLong = true;
      for (const longCastlingSquare of longCastlingSquares) {
        for (const [, piece] of opponentPieces) {
          if (pieceCanSee(opponentPieces, piece, longCastlingSquare)) {
            canCastleLong = false;
            break;
          }
        }
      }
      if (canCastleLong) {
        const aRook = pieces.get(coordinateToKey({ rank, file: 1 }));
        const queen = pieces.has(coordinateToKey({ rank, file: 4 }));
        const darkBishop = pieces.has(coordinateToKey({ rank, file: 3 }));
        const leftKnight = pieces.has(coordinateToKey({ rank, file: 2 }));
        if (!queen && !darkBishop && !leftKnight && aRook && !aRook.hasMoved)
          moves.push({ rank, file: file - 2 });
      }
    }
  }

  return moves;
}
