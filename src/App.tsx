import "./app.css";
import Board from "./components/Board";

export default function App() {
  return (
    <main className="relative h-dvh grid place-items-center bg-gray-800">
      <Board />
    </main>
  );
}
