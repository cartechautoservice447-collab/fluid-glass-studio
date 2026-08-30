import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { useRef, useState } from "react";

type Props = {
  children: ReactNode;
};

const MIN_HEIGHT = 55;
const INITIAL_HEIGHT = 82;

export function StudyHubSplitResize({ children }: Props) {
  const [height, setHeight] = useState(INITIAL_HEIGHT);
  const resizingRef = useRef(false);

  const updateHeight = (clientY: number) => {
    const viewportHeight = window.innerHeight || 1;
    const next = ((clientY - 10) / viewportHeight) * 100;
    setHeight(Math.min(100, Math.max(MIN_HEIGHT, next)));
  };

  const startResize = (event: ReactPointerEvent<HTMLDivElement>) => {
    resizingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateHeight(event.clientY);
  };

  const stopResize = (event: ReactPointerEvent<HTMLDivElement>) => {
    resizingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden">
      <div
        className="h-full overflow-hidden"
        style={{ height: `${height}%`, maxHeight: "100%" }}
        onPointerMove={(event) => {
          if (resizingRef.current) updateHeight(event.clientY);
        }}
      >
        {children}
      </div>

      <div
        role="separator"
        aria-label="Resize Study Hub height"
        aria-orientation="horizontal"
        aria-valuemin={MIN_HEIGHT}
        aria-valuemax={100}
        aria-valuenow={Math.round(height)}
        tabIndex={0}
        className="group absolute bottom-0 left-0 right-0 z-30 flex h-8 cursor-row-resize touch-none items-end justify-center bg-transparent px-4 pb-1 focus:outline-none"
        onPointerDown={startResize}
        onPointerUp={stopResize}
        onPointerCancel={stopResize}
        onKeyDown={(event) => {
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setHeight((value) => Math.min(100, value + 5));
          }
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setHeight((value) => Math.max(MIN_HEIGHT, value - 5));
          }
          if (event.key === "Home") {
            event.preventDefault();
            setHeight(MIN_HEIGHT);
          }
          if (event.key === "End") {
            event.preventDefault();
            setHeight(100);
          }
        }}
      >
        <span className="pointer-events-none mb-1 flex h-4 w-28 items-center justify-center rounded-full border border-white/20 bg-black/35 shadow-lg backdrop-blur-md transition-all group-hover:w-36 group-hover:border-white/35 group-hover:bg-black/50 group-focus:border-white/40 group-focus:bg-black/50">
          <span className="h-1 w-10 rounded-full bg-white/45 transition-all group-hover:w-14 group-hover:bg-white/75" />
        </span>
        <span className="pointer-events-none absolute bottom-0 left-1/2 h-px w-full max-w-56 -translate-x-1/2 bg-white/15 transition group-hover:bg-white/35" />
      </div>
    </div>
  );
}
