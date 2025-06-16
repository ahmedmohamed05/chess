import { useEffect } from "react";
import "./app.css";
import Board from "./components/Board";
import { useBoard } from "./hooks/useBoard";

export default function App() {
  const { board, selectPiece, movePiece, promote } = useBoard();
  // useEffect(() => console.log(board.history), [board.history]);
  useEffect(() => console.log(board.selectedPiece), [board.selectedPiece]);

  return (
    <main className="relative h-dvh flex justify-center items-center gap-5 bg-gray-800">
      <Board
        board={board}
        selectPiece={selectPiece}
        movePiece={movePiece}
        promote={promote}
      />
      {/* TODO: History
        <div>
        <h1 className="text-white">History</h1>
      </div> */}
    </main>
  );
}
