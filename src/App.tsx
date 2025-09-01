import "./app.css";
import Board from "./components/Board";
import History from "./components/History";
import { useBoard } from "./hooks/useBoard";

export default function App() {
  const gameController = useBoard();

  return (
    <div className="wrapper relative h-dvh flex justify-center items-center gap-5 bg-gray-800">
      <main className="game flex flex-col lg:flex-row gap-4">
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
