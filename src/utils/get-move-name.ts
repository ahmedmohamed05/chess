import type { Move } from "../types";
import { coordinateToKey } from "./key-coordinate-swap";
import { getFileLetter } from "./square-letter";

export default function getMoveName(move: Move) {
  const { from, to, piece } = move;
  const fileLetter = getFileLetter(to.file);
  let moveText = coordinateToKey(to) as string;

  const { type } = piece;
  switch (type) {
    case "pawn": {
      const normalPawnMove = fileLetter + to.rank;
      // eg. dxe5
      if (move.captured) {
        moveText = getFileLetter(from.file) + "x" + normalPawnMove;
      }
      // eg. a8=Q
      else if (move.promotion) {
        return normalPawnMove + "=" + move.promotion[0].toUpperCase();
      }
      // eg. e4
      else moveText = normalPawnMove;

      break;
    }

    case "king": {
      const normalKingMove = "k" + fileLetter + to.rank;
      moveText = normalKingMove;

      // eg. kxd3
      if (move.captured) {
        moveText = "kx" + fileLetter + to.rank;
      }
      // eg. O-O Or O-O-O
      else if (move.castle) {
        moveText = "O-O";
        if (move.castle === "long") moveText += "-O";
        break;
      }
      break;
    }
    case "queen":
    case "rook":
    case "bishop":
    case "knight": {
      moveText = type[0].toUpperCase();
      // if (move.includeFromCoordinates)
      //   moveText += getFileLetter(from.file) + from.rank;
      if (move.includeFromFile) moveText += getFileLetter(from.file);
      if (move.includeFromRank) moveText += from.rank;
      moveText += fileLetter + to.rank;
    }
  }
  if (move.isCheck) moveText += "+";

  return moveText;
}
