export default function getColor(rank: number, file: number) {
  return (rank + file) % 2 == 0 ? "dark" : "light";
}
