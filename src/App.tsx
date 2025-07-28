import { useCallback } from "react";
import "./app.css";
import Board from "./components/Board";
import History from "./components/History";
import { useBoard } from "./hooks/useBoard";

export default function App() {
  const gameController = useBoard();

  const goToMoveHandler = useCallback((index: number) => {
    console.log(index);
  }, []); // Empty dependency array = stable reference;

  return (
    <div className="wrapper relative h-dvh flex justify-center items-center gap-5 bg-gray-800">
      <main className="game flex flex-col lg:flex-row gap-4">
        <Board controller={gameController} />
        <History
          goToMoveHandler={goToMoveHandler}
          movesHistory={gameController.boardState.history}
        />
      </main>
    </div>
  );
}
