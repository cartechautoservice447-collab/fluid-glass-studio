import { Terminal } from "lucide-react";

type TerminalOutputProps = {
  value: string;
  className?: string;
};

/**
 * Read-only terminal output presentation.
 * It deliberately does not execute user code; it displays output written in
 * fenced `output` / `terminal-output` blocks in the note.
 */
export function TerminalOutput({ value, className = "" }: TerminalOutputProps) {
  const outputBlocks = [...value.matchAll(/```(?:output|terminal-output)\s*\n([\s\S]*?)```/gi)]
    .map((match) => match[1].replace(/\n$/, ""))
    .filter(Boolean);

  if (!outputBlocks.length) return null;

  return (
    <section className={`mt-4 overflow-hidden rounded-xl border border-[#30363d] bg-[#010409] shadow-[0_8px_24px_rgba(0,0,0,0.22)] ${className}`}>
      <div className="flex items-center gap-2 border-b border-[#21262d] bg-[#0d1117] px-3 py-2">
        <Terminal className="size-3.5 text-[#8b949e]" />
        <span className="text-[0.62rem] font-medium uppercase tracking-[0.14em] text-[#8b949e]">
          Terminal output
        </span>
      </div>
      <pre className="max-h-56 overflow-auto px-4 py-3 font-mono text-[0.82rem] leading-6 text-[#c9d1d9]">
        {outputBlocks.join("\n\n")}
      </pre>
    </section>
  );
}

export default TerminalOutput;
