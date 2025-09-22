export default function checkThreefoldRepetition(fen: string): boolean {
  const count = fenMap.get(fen) ?? 0;
  return count >= 3;
}
