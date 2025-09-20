import type { Move, MovesPair } from "../types";

export default function convertMovesToPairs(movesHistory: Move[]): MovesPair[] {
  // First move edge case
  if (movesHistory.length === 1) {
    return [
      {
        first: { ...movesHistory[0], index: 0 },
        second: undefined,
      },
    ];
  }

  const result: MovesPair[] = [];

  for (let i = 0; i < movesHistory.length; i++) {
    const move = movesHistory[i];
    if (move.piece.color === "dark") continue;

    // Light player's move
    result.push({ first: { ...move, index: i }, second: undefined });

    // Peak to the next move which is the dark player move and add it if exists
    if (i + 1 < movesHistory.length) {
      result.pop();
      result.push({
        first: { ...move, index: i },
        second: { ...movesHistory[i + 1], index: i + 1 },
      });
    }
  }

  return result;
}
