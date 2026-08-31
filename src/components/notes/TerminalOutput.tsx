import { Terminal } from "lucide-react";

type TerminalOutputProps = {
  value: string;
  className?: string;
};

type OutputBlock = {
  content: string;
  codeIndex: number | null;
};

export function TerminalOutput({ value, className = "" }: TerminalOutputProps) {
  const blocks = [...value.matchAll(/```([^\n]*)\n([\s\S]*?)```/g)];
  const outputBlocks: OutputBlock[] = [];
  let codeIndex = -1;

  for (const block of blocks) {
    const language = (block[1] ?? "").trim().toLowerCase();
    const content = block[2]?.replace(/\n$/, "") ?? "";

    if (language === "output" || language === "terminal-output") {
      if (!content.trim()) continue;
      outputBlocks.push({ content, codeIndex: codeIndex >= 0 ? codeIndex : null });
    } else if (language) {
      codeIndex += 1;
    }
  }

  if (!outputBlocks.length) return null;

  return (
    <div className={`mt-4 space-y-3 ${className}`}>
      {outputBlocks.map((output, index) => (
        <section
          key={`${output.codeIndex ?? "output"}-${index}-${output.content}`}
          className="overflow-hidden rounded-xl border border-[#30363d] bg-[#010409] shadow-[0_8px_24px_rgba(0,0,0,0.22)]"
          aria-label={`Terminal output${output.codeIndex !== null ? ` for code block ${output.codeIndex + 1}` : ""}`}
        >
          <div className="flex items-center gap-2 border-b border-[#21262d] bg-[#0d1117] px-3 py-2">
            <Terminal className="size-3.5 text-[#8b949e]" />
            <span className="text-[0.62rem] font-medium uppercase tracking-[0.14em] text-[#8b949e]">
              {output.codeIndex !== null ? `Output · Code ${output.codeIndex + 1}` : "Terminal output"}
            </span>
          </div>
          <pre className="max-h-56 overflow-auto px-4 py-3 font-mono text-[0.82rem] leading-6 text-[#c9d1d9]">
            {output.content}
          </pre>
        </section>
      ))}
    </div>
  );
}

export default TerminalOutput;
