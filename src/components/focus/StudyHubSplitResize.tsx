import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { useRef, useState } from "react";

type Props = {
  children: ReactNode;
};

export function StudyHubSplitResize({ children }: Props) {
  const [height, setHeight] = useState(100);
  const resizingRef = useRef(false);

  const updateHeight = (clientY: number) => {
    const viewportHeight = window.innerHeight || 1;
    const next = ((clientY - 10) / viewportHeight) * 100;
    setHeight(Math.min(100, Math.max(55, next)));
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
        tabIndex={0}
        className="group absolute bottom-0 left-0 right-0 z-20 h-3 cursor-row-resize bg-transparent focus:outline-none"
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
            setHeight((value) => Math.max(55, value - 5));
          }
        }}
      >
        <span className="absolute inset-x-0 bottom-0 mx-auto h-px max-w-40 bg-white/15 transition group-hover:bg-white/40 group-focus:bg-white/40" />
        <span className="absolute bottom-0 left-1/2 h-1.5 w-16 -translate-x-1/2 rounded-full bg-white/10 transition group-hover:bg-white/25" />
      </div>
    </div>
  );
}
