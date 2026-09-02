import { Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";

export type Segment =
  | { type: "text"; content: string; start: number; end: number }
  | { type: "output"; content: string; start: number; end: number };

type Readability = "default" | "good" | "best" | "great";

type Props = {
  value: string;
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  onChangeSegment: (index: number, value: string) => void;
  onRemoveSegment: (index: number) => void;
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
    if (start > cursor) segments.push({ type: "text", content: value.slice(cursor, start), start: cursor, end: start });
    segments.push({ type: "output", content: (match[1] ?? "").replace(/\n$/, ""), start, end });
    cursor = end;
  }
  if (cursor < value.length || !segments.length) segments.push({ type: "text", content: value.slice(cursor), start: cursor, end: value.length });
  return segments;
}

export function replaceNoteSegment(value: string, segment: Segment, nextContent: string): string {
  const raw = segment.type === "output" ? `\n\`\`\`output\n${nextContent}\n\`\`\`` : nextContent;
  const originalPrefix = segment.type === "output" ? "\n" : "";
  if (segment.type === "output" && value.slice(segment.start, segment.start + 1) === "\n") return `${value.slice(0, segment.start)}${raw}${value.slice(segment.end)}`.replace(/^\n/, "");
  return `${value.slice(0, segment.start)}${raw.replace(originalPrefix, "")}${value.slice(segment.end)}`;
}

export function NoteDocumentEditor({ value, activeIndex, onActiveIndexChange, onChangeSegment, onRemoveSegment, onActiveTextarea, readability = "default" }: Props) {
  const segments = useMemo(() => parseNoteSegments(value), [value]);
  const refs = useRef<Array<HTMLTextAreaElement | null>>([]);
  const rhythm = READABILITY[readability];

  // Keep output blocks in their original document position while editing.
  // Native field-sizing avoids the scroll jump caused by JS textarea resizing.

  useEffect(() => {
    onActiveTextarea(refs.current[activeIndex] ?? null);
  }, [activeIndex, onActiveTextarea]);

  return (
    <div className={`min-h-[16rem] flex-1 bg-transparent text-[#c9d1d9] ${rhythm.textSize} ${rhythm.lineHeight} ${rhythm.paragraphGap}`} style={{ fontFamily: "'Fira Code', 'JetBrains Mono', 'Consolas', monospace" }}>
      {segments.map((segment, index) => segment.type === "output" ? (
        <section key={`output-${index}`} className="my-3 overflow-hidden rounded-xl border border-[#30363d] bg-[#010409] shadow-[0_8px_24px_rgba(0,0,0,0.22)]" aria-label="Terminal output">
          <div className="flex items-center justify-between border-b border-[#21262d] bg-[#0d1117] px-3 py-2 text-[0.62rem] font-medium uppercase tracking-[0.14em] text-[#8b949e]">
            <span>Output</span>
            <button type="button" onClick={() => onRemoveSegment(index)} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[0.62rem] font-medium normal-case tracking-normal text-[#8b949e] transition-colors hover:bg-white/10 hover:text-red-300" aria-label="Remove output" title="Remove output">
              <Trash2 className="size-3.5" />
              <span>Remove</span>
            </button>
          </div>
          <textarea value={segment.content} onFocus={(e) => { onActiveIndexChange(index); onActiveTextarea(e.currentTarget); }} onClick={(e) => { onActiveIndexChange(index); onActiveTextarea(e.currentTarget); }} onChange={(e) => onChangeSegment(index, e.target.value)} ref={(e) => { refs.current[index] = e; }} aria-label="Code output" spellCheck={false} className={`block min-h-[4rem] w-full [field-sizing:content] resize-none overflow-hidden bg-transparent px-4 py-3 font-mono text-[#c9d1d9] outline-none ${readability === "great" ? "text-[0.9rem] leading-7" : readability === "best" ? "text-[0.86rem] leading-7" : "text-[0.82rem] leading-6"}`} />
        </section>
      ) : (
        <textarea key={`text-${index}`} ref={(e) => { refs.current[index] = e; }} value={segment.content} onFocus={(e) => { onActiveIndexChange(index); onActiveTextarea(e.currentTarget); }} onClick={(e) => { onActiveIndexChange(index); onActiveTextarea(e.currentTarget); }} onChange={(e) => onChangeSegment(index, e.target.value)} aria-label="Note body" placeholder={index === 0 ? "Write markdown here…" : undefined} spellCheck={false} className={`block min-h-[8rem] w-full [field-sizing:content] resize-none overflow-hidden bg-transparent p-0 text-[#c9d1d9] outline-none placeholder:text-[#8b949e] ${rhythm.textSize} ${rhythm.lineHeight}`} style={{ fontFamily: "'Fira Code', 'JetBrains Mono', 'Consolas', monospace" }} />
      ))}
    </div>
  );
}
