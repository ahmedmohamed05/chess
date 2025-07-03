export type SquareColor = "dark" | "light";

export type PieceColor = SquareColor;

export type PieceType =
  | "king"
  | "queen"
  | "rook"
  | "bishop"
  | "knight"
  | "pawn";

export interface BoardPosition {
  rank: number;
  file: number;
}

export type ScreenCoordinates = { x: number; y: number };

export interface Piece {
  type: PieceType;
  color: PieceColor;
  coordinates: BoardPosition;
  hasMoved?: boolean; // For castling and pawn first move
}

export type PromotionOption = Exclude<PieceType, "king" | "pawn">;

export interface Move {
  from: BoardPosition;
  to: BoardPosition;
  piece: Piece;
  captured?: Piece;
  castle?: "short" | "long";
  promotion?: PromotionOption;
}

export type PositionKey = `${number},${number}`;
export type PiecesMap = Map<PositionKey, Piece>;
export type GameStatus =
  | "playing"
  | "check"
  | "checkmate"
  | "draw"
  | "stalemate";

export interface BoardState {
  pieces: PiecesMap;
  validMoves: BoardPosition[];
  turn: PieceColor;
  selectedPiece: Piece | null;
  moveHistory: Move[];
  status: GameStatus;
  enPassantTarget: BoardPosition | undefined;
  castlingAvailable: boolean | undefined;
  isPromotionPending: boolean;
  kingInCheckPosition: BoardPosition | undefined;
}

export interface GameController {
  boardState: BoardState;
  selectPiece: (piece: Piece | null) => void;
  movePiece: (targetPosition: BoardPosition) => void;
  promotePawn: (promoteTo: PromotionOption) => void;
}
