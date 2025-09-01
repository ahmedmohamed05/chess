import type { Move } from "../types";
import sameCoordinates from "./check-coordinates";
import samePiece from "./same-piece";

export function sameMove(m1: Move, m2: Move): boolean {
  return (
    sameCoordinates(m1.from, m2.from) &&
    sameCoordinates(m1.to, m2.to) &&
    samePiece(m1.piece, m2.piece) &&
    m1.isCheck === m2.isCheck &&
    m1.includeFromFile === m2.includeFromFile &&
    m1.includeFromRank === m2.includeFromRank &&
    m1.castle === m2.castle &&
    m1.promotion === m2.promotion &&
    // check captured piece (both undefined or equal)
    (m1.captured === undefined && m2.captured === undefined
      ? true
      : m1.captured !== undefined &&
        m2.captured !== undefined &&
        samePiece(m1.captured, m2.captured))
  );
}
