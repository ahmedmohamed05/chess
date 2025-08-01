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

export type ScreenCoordinates = { x: number; y: number };

export interface Piece {
  type: PieceType;
  color: PieceColor;
  coordinates: Coordinates;
  hasMoved?: boolean; // For castling and pawn first move
}

export type PromotionOption = Exclude<PieceType, "king" | "pawn">;

export interface Move {
  from: Coordinates;
  to: Coordinates;
  piece: Piece;
  isCheck: boolean;
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
  validMoves: Coordinates[];
  turn: PieceColor;
  selectedPiece: Piece | null;
  history: Move[];
  status: GameStatus;
  enPassantTarget: Coordinates | undefined;
  castlingAvailable: boolean | undefined;
  promotionPending: boolean;
  kingInCheckPosition: Coordinates | undefined;
}

export interface GameController {
  boardState: BoardState;
  selectPiece: (piece: Piece | null) => void;
  movePiece: (targetPosition: Coordinates) => void;
  promotePawn: (promoteTo: PromotionOption) => void;
}

export interface MovingRef {
  position: ScreenCoordinates;
  piece: Piece;
  element: HTMLDivElement;
}
