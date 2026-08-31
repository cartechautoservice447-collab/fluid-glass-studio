import { useEffect, useMemo, useRef } from "react";

type Segment =
  | { type: "text"; content: string; start: number; end: number }
  | { type: "output"; content: string; start: number; end: number };

type Props = {
  value: string;
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  onChangeSegment: (index: number, value: string) => void;
  onActiveTextarea: (element: HTMLTextAreaElement | null) => void;
};

const OUTPUT_RE = /```(?:output|terminal-output)\n([\s\S]*?)```/gi;

function parseSegments(value: string): Segment[] {
  const segments: Segment[] = [];
  let cursor = 0;

  for (const match of value.matchAll(OUTPUT_RE)) {
    const start = match.index ?? cursor;
    const end = start + match[0].length;

    if (start > cursor) {
      segments.push({ type: "text", content: value.slice(cursor, start), start: cursor, end: start });
    }

    segments.push({
      type: "output",
      content: (match[1] ?? "").replace(/\n$/, ""),
      start,
      end,
    });
    cursor = end;
  }

  if (cursor < value.length || !segments.length) {
    segments.push({ type: "text", content: value.slice(cursor), start: cursor, end: value.length });
  }

  return segments;
}

export function NoteDocumentEditor({
  value,
  activeIndex,
  onActiveIndexChange,
  onChangeSegment,
  onActiveTextarea,
}: Props) {
  const segments = useMemo(() => parseSegments(value), [value]);
  const refs = useRef<Array<HTMLTextAreaElement | null>>([]);

  useEffect(() => {
    const active = refs.current[activeIndex] ?? null;
    onActiveTextarea(active);
  }, [activeIndex, segments.length, onActiveTextarea]);

  return (
    <div className="min-h-[16rem] flex-1 resize-none bg-transparent text-sm leading-relaxed text-[#c9d1d9] outline-none placeholder:text-[#8b949e]" style={{ fontFamily: "'Fira Code', 'JetBrains Mono', 'Consolas', monospace" }}>
      {segments.map((segment, index) => {
        if (segment.type === "output") {
          return (
            <section
              key={`output-${segment.start}-${segment.end}`}
              className="my-3 overflow-hidden rounded-xl border border-[#30363d] bg-[#010409] shadow-[0_8px_24px_rgba(0,0,0,0.22)]"
              aria-label={`Terminal output${index > 0 ? ` after editor block ${index}` : ""}`}
            >
              <div className="border-b border-[#21262d] bg-[#0d1117] px-3 py-2 text-[0.62rem] font-medium uppercase tracking-[0.14em] text-[#8b949e]">
                Output
              </div>
              <textarea
                value={segment.content}
                onFocus={(event) => {
                  onActiveIndexChange(index);
                  onActiveTextarea(event.currentTarget);
                }}
                onClick={(event) => {
                  onActiveIndexChange(index);
                  onActiveTextarea(event.currentTarget);
                }}
                onChange={(event) => onChangeSegment(index, event.target.value)}
                aria-label="Code output"
                spellCheck={false}
                className="block min-h-[4rem] w-full resize-none overflow-auto bg-transparent px-4 py-3 font-mono text-[0.82rem] leading-6 text-[#c9d1d9] outline-none"
              />
            </section>
          );
        }

        return (
          <textarea
            key={`text-${segment.start}-${segment.end}-${index}`}
            ref={(element) => {
              refs.current[index] = element;
            }}
            value={segment.content}
            onFocus={(event) => {
              onActiveIndexChange(index);
              onActiveTextarea(event.currentTarget);
            }}
            onClick={(event) => {
              onActiveIndexChange(index);
              onActiveTextarea(event.currentTarget);
            }}
            onChange={(event) => onChangeSegment(index, event.target.value)}
            aria-label="Note body"
            placeholder={index === 0 ? "Write markdown here…" : undefined}
            spellCheck={false}
            className="block min-h-[8rem] w-full resize-none overflow-hidden bg-transparent p-0 text-sm leading-relaxed text-[#c9d1d9] outline-none placeholder:text-[#8b949e]"
            style={{ fontFamily: "'Fira Code', 'JetBrains Mono', 'Consolas', monospace" }}
          />
        );
      })}
    </div>
  );
}
