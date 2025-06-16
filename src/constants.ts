import type { BoardState, PiecesMap } from "./types";
import { coordinateToKey } from "./utils/key-coordinate-swap";
import { getFileLetter } from "./utils/square-letter";

export const RANKS = [1, 2, 3, 4, 5, 6, 7, 8];
export const FILES = RANKS;
export const FILES_NAMES = RANKS.map((row) => getFileLetter(row));

export const INIT_POSITION: PiecesMap = new Map();
for (const file of FILES) {
  // Adding the light pawns
  INIT_POSITION.set(coordinateToKey({ rank: 2, file }), {
    color: "light",
    coordinates: { rank: 2, file },
    type: "pawn",
  });

  // Adding the dark Pawns
  INIT_POSITION.set(coordinateToKey({ rank: 7, file }), {
    color: "dark",
    coordinates: { rank: 7, file },
    type: "pawn",
  });

  // Adding the both sides Rooks, First and last files
  if (file == 1 || file == 8) {
    INIT_POSITION.set(coordinateToKey({ rank: 1, file }), {
      color: "light",
      coordinates: { rank: 1, file },
      type: "rook",
    });
    INIT_POSITION.set(coordinateToKey({ rank: 8, file }), {
      color: "dark",
      coordinates: { rank: 8, file },
      type: "rook",
    });
  }

  // Adding the both sides Knights, 2'nd and 7'th files
  if (file == 2 || file == 7) {
    INIT_POSITION.set(coordinateToKey({ rank: 1, file }), {
      color: "light",
      coordinates: { rank: 1, file },
      type: "knight",
    });

    INIT_POSITION.set(coordinateToKey({ rank: 8, file }), {
      color: "dark",
      coordinates: { rank: 8, file },
      type: "knight",
    });
  }

  // Adding the both sides Bishops, 3'nd and 6'th files
  if (file == 3 || file == 6) {
    INIT_POSITION.set(coordinateToKey({ rank: 1, file }), {
      color: "light",
      coordinates: { rank: 1, file },
      type: "bishop",
    });

    INIT_POSITION.set(coordinateToKey({ rank: 8, file }), {
      color: "dark",
      coordinates: { rank: 8, file },
      type: "bishop",
    });
  }

  // Adding the both sides Queens,
  if (file == 4) {
    INIT_POSITION.set(coordinateToKey({ rank: 1, file }), {
      color: "light",
      coordinates: { rank: 1, file },
      type: "queen",
    });

    INIT_POSITION.set(coordinateToKey({ rank: 8, file }), {
      color: "dark",
      coordinates: { rank: 8, file },
      type: "queen",
    });
  }

  // Adding the both sides Kings,
  if (file == 5) {
    INIT_POSITION.set(coordinateToKey({ rank: 1, file }), {
      color: "light",
      coordinates: { rank: 1, file },
      type: "king",
    });

    INIT_POSITION.set(coordinateToKey({ rank: 8, file }), {
      color: "dark",
      coordinates: { rank: 8, file },
      type: "king",
    });
  }
}

export const INIT_BOARD_STATE: BoardState = {
  pieces: INIT_POSITION,
  selectedPiece: null,
  status: "playing",
  turn: "light",
  moves: [],
  history: [],
  castling: false,
  enPassantTarget: undefined,
};

export const LIGHT_CASTLING_SQUARES = [
  { rank: 1, file: 6 },
  { rank: 1, file: 7 },
  { rank: 1, file: 3 },
  { rank: 1, file: 4 },
];

export const DARK_CASTLING_SQUARES = [
  { rank: 8, file: 6 },
  { rank: 8, file: 7 },
  { rank: 8, file: 3 },
  { rank: 8, file: 4 },
];
