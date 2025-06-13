export default function validPiece(square: HTMLDivElement) {
  return square.classList.contains("square") && square.dataset.piece == "true";
}
