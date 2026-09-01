import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";

export type Segment =
  | { type: "text"; content: string; start: number; end: number }
  | { type: "output"; content: string; start: number; end: number };

type Readability = "default" | "good" | "best" | "great";

type Props = {
  value: string;
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  onChangeSegment: (index: number, value: string) => void;
  onActiveTextarea: (element: HTMLTextAreaElement | null) => void;
  readability?: Readability;
};

const OUTPUT_RE = /```(?:output|terminal-output)\n([\s\S]*?)```/gi;

const READABILITY: Record<Readability, { textSize: string; lineHeight: string; paragraphGap: string }> = {
  default: { textSize: "text-sm", lineHeight: "leading-relaxed", paragraphGap: "" },
  good: { textSize: "text-[0.96rem]", lineHeight: "leading-7", paragraphGap: "" },
  best: { textSize: "text-base", lineHeight: "leading-8", paragraphGap: "" },
  great: { textSize: "text-[1.05rem]", lineHeight: "leading-8", paragraphGap: "tracking-[0.005em]" },
};

export function parseNoteSegments(value: string): Segment[] {
  const segments: Segment[] = [];
  let cursor = 0;

  for (const match of value.matchAll(OUTPUT_RE)) {
    const start = match.index ?? cursor;
    const end = start + match[0].length;

    if (start > cursor) {
      segments.push({ type: "text", content: value.slice(cursor, start), start: cursor, end: start });
    }

    segments.push({ type: "output", content: (match[1] ?? "").replace(/\n$/, ""), start, end });
    cursor = end;
  }

  if (cursor < value.length || !segments.length) {
    segments.push({ type: "text", content: value.slice(cursor), start: cursor, end: value.length });
  }

  return segments;
}

export function replaceNoteSegment(value: string, segment: Segment, nextContent: string): string {
  const raw = segment.type === "output" ? `\n\`\`\`output\n${nextContent}\n\`\`\`` : nextContent;
  const originalPrefix = segment.type === "output" ? "\n" : "";
  const start = segment.start;
  const end = segment.end;

  if (segment.type === "output" && value.slice(start, start + 1) === "\n") {
    return `${value.slice(0, start)}${raw}${value.slice(end)}`.replace(/^\n/, "");
  }

  return `${value.slice(0, start)}${raw.replace(originalPrefix, "")}${value.slice(end)}`;
}

export function NoteDocumentEditor({ value, activeIndex, onActiveIndexChange, onChangeSegment, onActiveTextarea, readability = "default" }: Props) {
  const segments = useMemo(() => parseNoteSegments(value), [value]);
  const refs = useRef<Array<HTMLTextAreaElement | null>>([]);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const scrollAnchorRef = useRef<{ top: number; left: number; relativeTop: number } | null>(null);
  const rhythm = READABILITY[readability];

  const resizeTextarea = useCallback((element: HTMLTextAreaElement | null) => {
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.max(element.scrollHeight, 128)}px`;
  }, []);

  const preserveScrollForChange = useCallback((callback: () => void) => {
    const container = rootRef.current?.parentElement;
    const active = refs.current[activeIndex];

    if (container && active) {
      const containerRect = container.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();
      scrollAnchorRef.current = {
        top: container.scrollTop,
        left: container.scrollLeft,
        relativeTop: activeRect.top - containerRect.top,
      };
    }

    callback();
  }, [activeIndex]);

  useLayoutEffect(() => {
    const container = rootRef.current?.parentElement;
    const anchor = scrollAnchorRef.current;
    if (!container || !anchor) return;

    const active = refs.current[activeIndex];
    if (active) {
      const containerRect = container.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();
      const delta = (activeRect.top - containerRect.top) - anchor.relativeTop;
      container.scrollTop += delta;
    } else {
      container.scrollTop = anchor.top;
      container.scrollLeft = anchor.left;
    }

    scrollAnchorRef.current = null;
  }, [value, activeIndex]);

  useEffect(() => {
    const scrollContainer = rootRef.current?.parentElement;
    if (!scrollContainer) return;
    const previous = scrollContainer.style.overflowAnchor;
    scrollContainer.style.overflowAnchor = "none";
    return () => { scrollContainer.style.overflowAnchor = previous; };
  }, []);

  useEffect(() => {
    onActiveTextarea(refs.current[activeIndex] ?? null);
  }, [activeIndex, onActiveTextarea]);

  useEffect(() => {
    refs.current.forEach(resizeTextarea);
  }, [readability, segments.length, resizeTextarea]);

  return (
    <div ref={rootRef} className={`min-h-[16rem] flex-1 bg-transparent text-[#c9d1d9] ${rhythm.textSize} ${rhythm.lineHeight} ${rhythm.paragraphGap}`} style={{ fontFamily: "'Fira Code', 'JetBrains Mono', 'Consolas', monospace" }}>
      {segments.map((segment, index) => {
        if (segment.type === "output") {
          return (
            <section key={`output-${index}`} className="my-3 overflow-hidden rounded-xl border border-[#30363d] bg-[#010409] shadow-[0_8px_24px_rgba(0,0,0,0.22)]" aria-label="Terminal output">
              <div className="border-b border-[#21262d] bg-[#0d1117] px-3 py-2 text-[0.62rem] font-medium uppercase tracking-[0.14em] text-[#8b949e]">Output</div>
              <textarea value={segment.content} onFocus={(event) => { onActiveIndexChange(index); onActiveTextarea(event.currentTarget); }} onClick={(event) => { onActiveIndexChange(index); onActiveTextarea(event.currentTarget); }} onChange={(event) => preserveScrollForChange(() => { resizeTextarea(event.currentTarget); onChangeSegment(index, event.target.value); })} ref={(element) => { refs.current[index] = element; resizeTextarea(element); }} aria-label="Code output" spellCheck={false} className={`block min-h-[4rem] w-full resize-none overflow-hidden bg-transparent px-4 py-3 font-mono text-[#c9d1d9] outline-none ${readability === "great" ? "text-[0.9rem] leading-7" : readability === "best" ? "text-[0.86rem] leading-7" : "text-[0.82rem] leading-6"}`} />
            </section>
          );
        }

        return (
          <textarea key={`text-${index}`} ref={(element) => { refs.current[index] = element; resizeTextarea(element); }} value={segment.content} onFocus={(event) => { onActiveIndexChange(index); onActiveTextarea(event.currentTarget); }} onClick={(event) => { onActiveIndexChange(index); onActiveTextarea(event.currentTarget); }} onChange={(event) => preserveScrollForChange(() => { resizeTextarea(event.currentTarget); onChangeSegment(index, event.target.value); })} aria-label="Note body" placeholder={index === 0 ? "Write markdown here…" : undefined} spellCheck={false} className={`block min-h-[8rem] w-full resize-none overflow-hidden bg-transparent p-0 text-[#c9d1d9] outline-none placeholder:text-[#8b949e] ${rhythm.textSize} ${rhythm.lineHeight}`} style={{ fontFamily: "'Fira Code', 'JetBrains Mono', 'Consolas', monospace" }} />
        );
      })}
    </div>
  );
}
