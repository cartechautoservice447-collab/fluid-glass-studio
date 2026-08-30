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
    // The pane bottom stays fixed. Moving the top edge upward increases the
    // shared height of both the lecture and note-editor panes.
    const next = ((viewportHeight - clientY) / viewportHeight) * 100;
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
        className="absolute inset-x-0 bottom-0 overflow-hidden"
        style={{ height: `${height}%`, maxHeight: "100%" }}
        onPointerMove={(event) => {
          if (resizingRef.current) updateHeight(event.clientY);
        }}
      >
        {children}
      </div>

      <div
        role="separator"
        aria-label="Resize Study Hub vertically from the top edge"
        aria-orientation="horizontal"
        aria-valuemin={MIN_HEIGHT}
        aria-valuemax={100}
        aria-valuenow={Math.round(height)}
        tabIndex={0}
        className="group absolute left-0 right-0 z-30 flex h-8 -translate-y-1/2 cursor-row-resize touch-none items-center justify-center bg-transparent px-4"
        style={{ bottom: `calc(${height}% - 1px)` }}
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
        <span className="pointer-events-none flex h-5 w-32 items-center justify-center rounded-full border border-white/25 bg-black/40 shadow-lg backdrop-blur-md transition-all group-hover:w-40 group-hover:border-white/45 group-hover:bg-black/55 group-focus:border-white/50 group-focus:bg-black/55">
          <span className="h-1 w-12 rounded-full bg-white/55 transition-all group-hover:w-16 group-hover:bg-white/80" />
        </span>
        <span className="pointer-events-none absolute left-1/2 top-1/2 h-px w-full max-w-sm -translate-x-1/2 -translate-y-1/2 bg-white/20 transition group-hover:bg-white/40" />
      </div>
    </div>
  );
}
