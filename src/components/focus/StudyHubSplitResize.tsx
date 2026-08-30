import { GripHorizontal } from "lucide-react";
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
    <div className="relative min-h-0 flex-1 overflow-visible">
      <div
        className="relative h-full overflow-hidden"
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
        className="group absolute bottom-[-6px] left-0 right-0 z-30 flex h-7 cursor-row-resize items-center justify-center rounded-xl border border-white/15 bg-black/35 backdrop-blur-xl shadow-lg transition hover:border-white/30 hover:bg-black/55 focus:border-white/40 focus:outline-none"
        onPointerDown={startResize}
        onPointerMove={(event) => {
          if (resizingRef.current) updateHeight(event.clientY);
        }}
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
        title="Drag to resize Study Hub vertically"
      >
        <GripHorizontal className="size-4 text-foreground/60 transition group-hover:text-foreground" />
      </div>
    </div>
  );
}
