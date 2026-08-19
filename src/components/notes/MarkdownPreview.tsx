import type { ComponentPropsWithoutRef } from "react";
import { Check, Copy, PanelRight, PanelTop } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import remarkGfm from "remark-gfm";

const CODE_FONT = "'Fira Code', 'JetBrains Mono', 'Consolas', monospace";

const glassCodeTheme: Record<string, Record<string, string>> = {
  'code[class*="language-"]': { color: "#c9d1d9", background: "transparent", fontFamily: CODE_FONT, fontSize: "0.84rem", lineHeight: "1.7" },
  'pre[class*="language-"]': { color: "#c9d1d9", background: "transparent", fontFamily: CODE_FONT, fontSize: "0.84rem", lineHeight: "1.7", margin: "0", padding: "1.1rem 1.2rem", overflow: "auto" },
  comment: { color: "#8b949e", fontStyle: "italic" }, prolog: { color: "#8b949e" }, doctype: { color: "#8b949e" }, cdata: { color: "#8b949e" },
  punctuation: { color: "#c9d1d9" }, operator: { color: "#ff7b72" }, keyword: { color: "#ff7b72" }, "control-flow": { color: "#ff7b72" }, atrule: { color: "#ff7b72" },
  "attr-value": { color: "#a5d6ff" }, string: { color: "#a5d6ff" }, char: { color: "#a5d6ff" }, regex: { color: "#a5d6ff" }, "template-string": { color: "#a5d6ff" },
  function: { color: "#d2a8ff" }, "function-variable": { color: "#d2a8ff" }, "class-name": { color: "#d2a8ff" }, builtin: { color: "#d2a8ff" },
  variable: { color: "#79c0ff" }, parameter: { color: "#79c0ff" }, "attr-name": { color: "#79c0ff" }, property: { color: "#79c0ff" }, constant: { color: "#79c0ff" }, symbol: { color: "#79c0ff" }, number: { color: "#79c0ff" }, boolean: { color: "#79c0ff" },
  tag: { color: "#ff7b72" }, selector: { color: "#ff7b72" }, deleted: { color: "#ff7b72" }, inserted: { color: "#a5d6ff" }, important: { color: "#ff7b72", fontWeight: "bold" }, bold: { fontWeight: "bold" }, italic: { fontStyle: "italic" },
};

async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}

export function MarkdownPreview({ body }: { body: string }) {
  const [copied, setCopied] = useState(false);
  const [width, setWidth] = useState<"comfortable" | "wide">("comfortable");

  const copyMarkdown = async () => {
    if (await copyText(body)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    }
  };

  if (!body.trim()) {
    return <div className="flex min-h-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.025] px-6 py-16 text-center"><div><p className="text-base font-medium text-white/75">Nothing to preview yet</p><p className="mt-1 text-sm text-white/40">Start writing in Edit mode and your finished note will appear here.</p></div></div>;
  }

  return (
    <div className="flex min-h-full flex-col rounded-2xl border border-white/10 bg-white/[0.025] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#0d1117]/90 px-3 py-2 backdrop-blur-xl">
        <div className="flex items-center gap-1.5 text-[0.65rem] font-medium uppercase tracking-[0.16em] text-white/40"><PanelTop className="size-3.5" /><span>Reading preview</span></div>
        <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.035] p-0.5">
          <button type="button" onClick={() => setWidth("comfortable")} className={`flex h-7 items-center gap-1.5 rounded-md px-2 text-[0.68rem] transition ${width === "comfortable" ? "bg-white/10 text-white" : "text-white/45 hover:text-white/75"}`} title="Comfortable reading width"><PanelTop className="size-3.5" /> Read</button>
          <button type="button" onClick={() => setWidth("wide")} className={`flex h-7 items-center gap-1.5 rounded-md px-2 text-[0.68rem] transition ${width === "wide" ? "bg-white/10 text-white" : "text-white/45 hover:text-white/75"}`} title="Wide reading width"><PanelRight className="size-3.5" /> Wide</button>
          <button type="button" onClick={copyMarkdown} className="flex h-7 items-center gap-1.5 rounded-md px-2 text-[0.68rem] text-white/55 transition hover:bg-white/10 hover:text-white" title="Copy Markdown">{copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {copied ? "Copied" : "Copy"}</button>
        </div>
      </div>
      <article className={`mx-auto w-full flex-1 px-6 py-8 sm:px-8 sm:py-10 lg:px-10 ${width === "comfortable" ? "max-w-3xl" : "max-w-5xl"}`}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
          h1: (props) => <h1 className="mb-7 text-3xl font-semibold tracking-tight text-white sm:text-4xl" {...props} />,
          h2: (props) => <h2 className="mb-4 mt-10 border-b border-white/10 pb-2 text-2xl font-semibold tracking-tight text-white" {...props} />,
          h3: (props) => <h3 className="mb-3 mt-8 text-xl font-semibold text-white" {...props} />,
          h4: (props) => <h4 className="mb-2 mt-6 text-base font-semibold uppercase tracking-wide text-white/85" {...props} />,
          p: (props) => <p className="mb-5 text-[0.98rem] leading-8 text-[#c9d1d9] sm:text-[1.02rem]" {...props} />,
          strong: (props) => <strong className="font-semibold text-white" {...props} />,
          em: (props) => <em className="text-white/80" {...props} />,
          a: (props) => <a className="text-[#79c0ff] underline decoration-[#79c0ff]/35 underline-offset-4 transition hover:text-white" target="_blank" rel="noreferrer" {...props} />,
          ul: (props) => <ul className="mb-6 list-disc space-y-2 pl-6 text-[#c9d1d9] marker:text-white/35" {...props} />,
          ol: (props) => <ol className="mb-6 list-decimal space-y-2 pl-6 text-[#c9d1d9] marker:text-white/35" {...props} />,
          li: (props) => <li className="pl-1 leading-7" {...props} />,
          blockquote: (props) => <blockquote className="my-7 rounded-r-xl border-l-2 border-white/25 bg-white/[0.035] px-5 py-3 text-white/60 [&>p]:mb-0" {...props} />,
          hr: (props) => <hr className="my-9 border-white/10" {...props} />,
          table: (props) => <div className="my-7 overflow-x-auto rounded-xl border border-white/10"><table className="w-full min-w-[32rem] border-collapse text-left text-sm" {...props} /></div>,
          th: (props) => <th className="border-b border-white/10 bg-white/[0.04] px-4 py-3 font-semibold text-white" {...props} />,
          td: (props) => <td className="border-b border-white/[0.07] px-4 py-3 text-white/70" {...props} />,
          code: ({ className, children, ...rest }: ComponentPropsWithoutRef<"code">) => {
            const match = /language-(\w+)/.exec(className ?? "");
            const text = String(children ?? "").replace(/\n$/, "");
            if (!match) return <code className="rounded-md border border-white/10 bg-white/[0.06] px-1.5 py-0.5 text-[0.84em] text-[#a5d6ff]" style={{ fontFamily: CODE_FONT }} {...rest}>{children}</code>;
            return <div className="group my-6 overflow-hidden rounded-xl border border-white/10 bg-black/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"><div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-[0.62rem] uppercase tracking-[0.14em] text-white/35"><span>{match[1]}</span><button type="button" onClick={() => void copyText(text)} className="rounded-md px-2 py-1 normal-case tracking-normal text-white/45 opacity-70 transition hover:bg-white/10 hover:text-white group-hover:opacity-100" title="Copy code"><Copy className="mr-1 inline size-3" />Copy</button></div><SyntaxHighlighter language={match[1]} style={glassCodeTheme} PreTag="div">{text}</SyntaxHighlighter></div>;
          },
        }}>{body}</ReactMarkdown>
      </article>
    </div>
  );
}
