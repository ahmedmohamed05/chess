import type { Piece } from "../../types";

// Get opponent color
export default function getOpponentColor(color: Piece["color"]) {
  return color === "light" ? "dark" : "light";
}
