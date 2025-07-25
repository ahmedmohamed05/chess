import "./app.css";
import Board from "./components/Board";
import { useBoard } from "./hooks/useBoard";

export default function App() {
  const gameController = useBoard();
  return (
    <main className="relative h-dvh flex justify-center items-center gap-5 bg-gray-800">
      <Board controller={gameController} />

      {/* TODO History
        <div>
        <h1 className="text-white">History</h1>
      </div> */}
    </main>
  );
}
