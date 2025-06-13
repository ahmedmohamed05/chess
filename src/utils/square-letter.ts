import type { Coordinates } from "../types";

export function getFileLetter(file: number): string {
  if (file < 0 || file > 8)
    throw Error("Files only between the numbers 1 and 8");

  return String.fromCharCode(file + 96);
}

export function getSquareName(coordinates: Coordinates): string {
  return coordinates.rank + getFileLetter(coordinates.file);
}
