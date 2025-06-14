export type SquareColor = "dark" | "light";

export type PieceColor = SquareColor;

export type PieceType =
  | "king"
  | "queen"
  | "rook"
  | "bishop"
  | "knight"
  | "pawn";

export interface Coordinates {
  rank: number;
  file: number;
}

export interface Piece {
  type: PieceType;
  color: PieceColor;
  coordinates: Coordinates;
  hasMoved?: boolean; // castling or Pawn first move
}

export interface Move {
  from: Coordinates;
  to: Coordinates;
  piece: Piece;
  captured?: Piece;
  castle?: "short" | "long";
  promotion?: Exclude<PieceType, "king" | "pawn">;
}

export interface BoardState {
  pieces: Piece[];
  turn: PieceColor;
  selectedPiece: Piece | null;
  validMoves: Coordinates[];
  history: Move[];
  status: "playing" | "check" | "checkmate" | "draw" | "stalemate";
  enPassantTarget?: Coordinates;
}
