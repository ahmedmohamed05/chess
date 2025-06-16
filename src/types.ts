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

export type PromotionOptions = Exclude<PieceType, "king" | "pawn">;

export interface Move {
  from: Coordinates;
  to: Coordinates;
  piece: Piece;
  captured?: Piece;
  castle?: "short" | "long";
  promotion?: PromotionOptions;
}

export type CoordinateKey = `${number},${number}`;
export type PiecesMap = Map<CoordinateKey, Piece>;

export interface BoardState {
  pieces: PiecesMap;
  moves: Coordinates[];
  turn: PieceColor;
  selectedPiece: Piece | null;
  history: Move[];
  status: "playing" | "check" | "checkmate" | "draw" | "stalemate";
  enPassantTarget: Coordinates | undefined;
  castling: boolean | undefined;
  promotionPending: boolean;
}

export interface useBoardType {
  board: BoardState;
  selectPiece: (piece: Piece | null) => void;
  movePiece: (toPosition: Coordinates) => void;
  promote: (promoteTo: PromotionOptions) => void;
}
