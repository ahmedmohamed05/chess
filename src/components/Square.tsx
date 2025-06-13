export interface SquareProps {
  color: string;
  icon?: string;
  rank: number;
  file: number;
}

export default function Square({ color, icon, rank, file }: SquareProps) {
  return (
    <div
      data-color={color}
      data-piece={icon !== undefined}
      data-rank={rank}
      data-file={file}
      className="square bg-no-repeat bg-center hover:cursor-grab active:cursor-grabbing"
      style={
        icon
          ? {
              backgroundImage: `url("${icon}")`,
              backgroundSize: "var(--piece-size)",
              width: "var(--piece-size)",
              height: "var(--piece-size)",
            }
          : {}
      }
    ></div>
  );
}
