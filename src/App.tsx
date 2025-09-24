import "./app.css";
import Board from "./components/Board";
import GameResult from "./components/GameResult";
import History from "./components/History";
import { useBoard } from "./hooks/useBoard";

export default function App() {
  const gameController = useBoard();

  return (
    <div className="wrapper relative h-dvh flex justify-center items-center gap-5 bg-gray-800">
      <div className="absolute z-[101]">
        {gameController.boardState.history.length > 0 && (
          <GameResult
            gameStatus={gameController.boardState.status}
            lastMove={
              gameController.boardState.history[
                gameController.boardState.history.length - 1
              ]
            }
            restartHandler={gameController.restart}
            forceHide={false}
          />
        )}
      </div>
      <main className="game flex max-md:flex-col gap-4">
        <Board controller={gameController} />
        <History
          goToMoveHandler={gameController.goToMove}
          movesHistory={gameController.boardState.history}
          focusedMove={gameController.boardState.moveFocused}
        />
      </main>
    </div>
  );
}
