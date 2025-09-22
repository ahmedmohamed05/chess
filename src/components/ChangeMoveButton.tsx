interface ChangeMoveButtonProps {
  direction: "<" | ">";
  clickHandler: () => void;
}

export function ChangeMoveButton({
  direction,
  clickHandler,
}: ChangeMoveButtonProps) {
  return (
    <button
      className="previous-move flex-1/2 p-2 border border-white text-2xl font-bold cursor-pointer"
      onClick={clickHandler}
    >
      {direction}
    </button>
  );
}
