import type { ComponentPropsWithoutRef } from "react";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import remarkGfm from "remark-gfm";

const NOTEBOOK_CODE_FONT = "'Fira Code', 'JetBrains Mono', 'Consolas', monospace";

type Readability = "default" | "good" | "best" | "great";

const READABILITY: Record<Readability, { body: string; heading: string; list: string; quote: string; table: string }> = {
  default: { body: "text-[0.98rem] leading-8", heading: "", list: "text-[0.98rem]", quote: "text-[0.98rem]", table: "text-sm" },
  good: { body: "text-[1.02rem] leading-8", heading: "", list: "text-[1.02rem]", quote: "text-[1.02rem]", table: "text-[0.95rem]" },
  best: { body: "text-[1.06rem] leading-[1.9]", heading: "", list: "text-[1.06rem]", quote: "text-[1.06rem]", table: "text-base" },
  great: { body: "text-[1.1rem] leading-[1.95]", heading: "", list: "text-[1.1rem]", quote: "text-[1.1rem]", table: "text-base" },
};

const githubDarkCodeTheme: Record<string, Record<string, string>> = {
  'code[class*="language-"]': { color: "#c9d1d9", background: "transparent", fontFamily: NOTEBOOK_CODE_FONT, fontSize: "0.9rem", lineHeight: "1.7" },
  'pre[class*="language-"]': { color: "#c9d1d9", background: "transparent", fontFamily: NOTEBOOK_CODE_FONT, fontSize: "0.9rem", lineHeight: "1.7", margin: "0", padding: "1.15rem 1.25rem", overflow: "auto" },
  comment: { color: "#8b949e", fontStyle: "italic" }, prolog: { color: "#8b949e" }, doctype: { color: "#8b949e" }, cdata: { color: "#8b949e" }, punctuation: { color: "#c9d1d9" }, operator: { color: "#ff7b72" }, keyword: { color: "#ff7b72" }, "control-flow": { color: "#ff7b72" }, atrule: { color: "#ff7b72" }, "attr-value": { color: "#a5d6ff" }, string: { color: "#a5d6ff" }, char: { color: "#a5d6ff" }, regex: { color: "#a5d6ff" }, "template-string": { color: "#a5d6ff" }, function: { color: "#d2a8ff" }, "function-variable": { color: "#d2a8ff" }, "class-name": { color: "#d2a8ff" }, builtin: { color: "#d2a8ff" }, variable: { color: "#79c0ff" }, parameter: { color: "#79c0ff" }, "attr-name": { color: "#79c0ff" }, property: { color: "#79c0ff" }, constant: { color: "#79c0ff" }, symbol: { color: "#79c0ff" }, number: { color: "#79c0ff" }, boolean: { color: "#79c0ff" }, tag: { color: "#ff7b72" }, selector: { color: "#ff7b72" }, deleted: { color: "#ff7b72" }, inserted: { color: "#a5d6ff" }, important: { color: "#ff7b72", fontWeight: "bold" }, bold: { fontWeight: "bold" }, italic: { fontStyle: "italic" },
};

async function copyCode(text: string) { try { await navigator.clipboard.writeText(text); return true; } catch { return false; } }

export interface NotebookPreviewAdditiveProps { body: string; className?: string; readability?: Readability; }

export function NotebookPreviewAdditive({ body, className = "", readability = "default" }: NotebookPreviewAdditiveProps) {
  const [copiedBlock, setCopiedBlock] = useState<number | null>(null);
  const rhythm = READABILITY[readability];

  if (!body.trim()) return <div className={`flex min-h-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.025] px-6 py-16 text-center ${className}`}><div><p className="text-base font-medium text-white/80">Nothing to preview yet</p><p className="mt-1 text-sm text-white/55">Start writing and your finished note will appear here.</p></div></div>;

  return (
    <article className={`mx-auto w-full max-w-4xl px-6 py-8 sm:px-10 sm:py-10 ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
        h1: (props) => <h1 className="mb-6 text-2xl font-semibold leading-tight tracking-tight text-white sm:text-3xl" {...props} />,
        h2: (props) => <h2 className="mb-4 mt-9 border-b border-white/10 pb-2 text-xl font-semibold leading-tight tracking-tight text-white sm:text-2xl" {...props} />,
        h3: (props) => <h3 className="mb-3 mt-7 text-lg font-semibold leading-tight text-white sm:text-xl" {...props} />,
        h4: (props) => <h4 className="mb-2 mt-6 text-base font-semibold text-white/95" {...props} />,
        p: (props) => <p className={`mb-5 font-sans font-normal text-white/90 ${rhythm.body}`} {...props} />,
        strong: (props) => <strong className="font-semibold text-white" {...props} />,
        em: (props) => <em className="text-white/90" {...props} />,
        del: (props) => <del className="text-white/75" {...props} />,
        a: (props) => <a className="font-medium text-[#9bd1ff] underline decoration-[#9bd1ff]/50 underline-offset-4 transition hover:text-white" target="_blank" rel="noreferrer" {...props} />,
        ul: (props) => <ul className={`mb-6 list-disc space-y-2 pl-7 marker:text-white/60 ${rhythm.list}`} {...props} />,
        ol: (props) => <ol className={`mb-6 list-decimal space-y-2 pl-7 marker:text-white/60 ${rhythm.list}`} {...props} />,
        li: (props) => <li className="pl-1 font-normal leading-8 text-white/90" {...props} />,
        blockquote: (props) => <blockquote className={`my-7 rounded-r-xl border-l-2 border-white/40 bg-white/[0.055] px-5 py-4 font-normal text-white/85 [&>p]:mb-0 ${rhythm.quote}`} {...props} />,
        hr: (props) => <hr className="my-9 border-white/15" {...props} />,
        table: (props) => <div className="my-7 overflow-x-auto rounded-xl border border-white/15"><table className={`w-full min-w-[32rem] border-collapse text-left ${rhythm.table}`} {...props} /></div>,
        th: (props) => <th className="border-b border-white/15 bg-white/[0.07] px-4 py-3 font-semibold text-white" {...props} />,
        td: (props) => <td className="border-b border-white/[0.09] px-4 py-3 text-white/85" {...props} />,
        code: ({ className: codeClassName, children, ...rest }: ComponentPropsWithoutRef<"code">) => {
          const match = /language-(\w+)/.exec(codeClassName ?? "");
          const text = String(children ?? "").replace(/\n$/, "");
          if (!match) return <code className="rounded-md border border-white/15 bg-white/[0.08] px-1.5 py-0.5 text-[0.88em] font-mono text-[#b7dcff]" style={{ fontFamily: NOTEBOOK_CODE_FONT }} {...rest}>{children}</code>;
          const blockId = `${text.length}-${text.slice(0, 12)}`.length;
          return <div className="group my-6 overflow-hidden rounded-xl border border-[#30363d] bg-[#0d1117] shadow-[0_8px_30px_rgba(0,0,0,0.28)]"><div className="flex items-center justify-between border-b border-[#21262d] bg-[#161b22] px-3 py-2"><span className="text-[0.62rem] font-medium uppercase tracking-[0.14em] text-[#8b949e]">{match[1]}</span><button type="button" onClick={async () => { if (await copyCode(text)) { setCopiedBlock(blockId); window.setTimeout(() => setCopiedBlock(null), 1400); } }} className="rounded-md px-2 py-1 text-xs text-[#b0bac5] transition hover:bg-[#21262d] hover:text-[#f0f6fc]" title="Copy code">{copiedBlock === blockId ? <><Check className="mr-1 inline size-3" />Copied</> : <><Copy className="mr-1 inline size-3" />Copy</>}</button></div><SyntaxHighlighter language={match[1]} style={githubDarkCodeTheme} PreTag="div">{text}</SyntaxHighlighter></div>;
        },
      }}>{body}</ReactMarkdown>
    </article>
  );
}

export default NotebookPreviewAdditive;
