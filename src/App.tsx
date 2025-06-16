import "./app.css";
import Board from "./components/Board";
import { INIT_BOARD_STATE } from "./constants";
import { useBoard } from "./hooks/useBoard";

export default function App() {
  const { board, selectPiece, movePiece } = useBoard(INIT_BOARD_STATE);

  return (
    <main className="relative h-dvh flex justify-center items-center gap-5 bg-gray-800">
      <Board board={board} selectPiece={selectPiece} movePiece={movePiece} />
      {/* TODO: History
        <div>
        <h1 className="text-white">History</h1>
      </div> */}
    </main>
  );
}
