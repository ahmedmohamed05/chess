import getOpponentColor from "../hooks/helpers/get-opponent-color";
import type { GameStatus, Move } from "../types";

export interface GameResultProps {
  gameStatus: GameStatus;
  forceHide: boolean;
  lastMove: Move;
  restartHandler: () => void;
}

export default function GameResult({
  gameStatus,
  forceHide,
  lastMove,
  restartHandler,
}: GameResultProps) {
  if (forceHide) return;
  if (gameStatus === "playing" || gameStatus === "check") return;

  const winnerColor = lastMove.piece.color;
  let resultText = gameStatus;
  let descriptionText = "";

  switch (gameStatus) {
    case "checkmate":
      descriptionText = `Game Ended, ${winnerColor} player Won!!`;
      break;
    case "draw":
      descriptionText = "Game Ended In Draw";
      break;
    case "stalemate":
      descriptionText = `Stalemated ${getOpponentColor(
        winnerColor
      )} Has No Available Moves`;
      break;
    case "threefold repetition":
      resultText = "draw";
      descriptionText = `By Threefold Repetition`;
  }

  return (
    <div
      className="game-result-card text-white p-5 rounded text-center z-[101]"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.7)", zIndex: 101 }}
    >
      <div className="text">
        <h1 className="text-4xl font-bold">{resultText}</h1>
        <h2 className="text-3xl">{descriptionText}</h2>
      </div>
      <div
        className="btns flex items-center gap-2 justify-center text-2xl"
        style={{ marginBlockStart: "1rem" }}
      >
        <button
          className="px-2.5 py-1 rounded cursor-pointer bg-red-500"
          onClick={restartHandler}
        >
          Restart
        </button>
      </div>
    </div>
  );
}
