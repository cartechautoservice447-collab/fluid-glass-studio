import type { ComponentPropsWithoutRef } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import remarkGfm from "remark-gfm";

const CODE_FONT = "'Fira Code', 'JetBrains Mono', 'Consolas', monospace";

/** Exact GitHub-dark-style palette required by the Glass Notes spec. */
const glassCodeTheme: Record<string, Record<string, string>> = {
  'code[class*="language-"]': {
    color: "#c9d1d9",
    background: "#0d1117",
    fontFamily: CODE_FONT,
    fontSize: "0.82rem",
    lineHeight: "1.65",
  },
  'pre[class*="language-"]': {
    color: "#c9d1d9",
    background: "#0d1117",
    fontFamily: CODE_FONT,
    fontSize: "0.82rem",
    lineHeight: "1.65",
    margin: 0,
    padding: "1rem 1.1rem",
    overflow: "auto",
  },
  comment: { color: "#8b949e", fontStyle: "italic" },
  prolog: { color: "#8b949e" },
  doctype: { color: "#8b949e" },
  cdata: { color: "#8b949e" },
  punctuation: { color: "#c9d1d9" },
  operator: { color: "#ff7b72" },
  keyword: { color: "#ff7b72" },
  "control-flow": { color: "#ff7b72" },
  atrule: { color: "#ff7b72" },
  "attr-value": { color: "#a5d6ff" },
  string: { color: "#a5d6ff" },
  char: { color: "#a5d6ff" },
  regex: { color: "#a5d6ff" },
  "template-string": { color: "#a5d6ff" },
  function: { color: "#d2a8ff" },
  "function-variable": { color: "#d2a8ff" },
  "class-name": { color: "#d2a8ff" },
  builtin: { color: "#d2a8ff" },
  variable: { color: "#79c0ff" },
  parameter: { color: "#79c0ff" },
  "attr-name": { color: "#79c0ff" },
  property: { color: "#79c0ff" },
  constant: { color: "#79c0ff" },
  symbol: { color: "#79c0ff" },
  number: { color: "#79c0ff" },
  boolean: { color: "#79c0ff" },
  tag: { color: "#ff7b72" },
  selector: { color: "#ff7b72" },
  deleted: { color: "#ff7b72" },
  inserted: { color: "#a5d6ff" },
  important: { color: "#ff7b72", fontWeight: "bold" },
  bold: { fontWeight: "bold" },
  italic: { fontStyle: "italic" },
};

export function MarkdownPreview({ body }: { body: string }) {
  if (!body.trim()) {
    return <p className="text-sm text-[#8b949e]">Nothing to preview yet — start writing.</p>;
  }

  return (
    <div className="space-y-4 text-sm leading-relaxed text-[#c9d1d9]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (props) => <h1 className="text-2xl font-semibold text-white" {...props} />,
          h2: (props) => <h2 className="text-xl font-semibold text-white" {...props} />,
          h3: (props) => <h3 className="text-lg font-semibold text-white" {...props} />,
          p: (props) => <p className="leading-relaxed" {...props} />,
          strong: (props) => <strong className="font-semibold text-white" {...props} />,
          a: (props) => <a className="text-[#79c0ff] underline" {...props} />,
          ul: (props) => <ul className="list-disc space-y-1 pl-5" {...props} />,
          ol: (props) => <ol className="list-decimal space-y-1 pl-5" {...props} />,
          blockquote: (props) => (
            <blockquote className="border-l-2 border-[#30363d] pl-4 italic text-[#8b949e]" {...props} />
          ),
          table: (props) => (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs" {...props} />
            </div>
          ),
          th: (props) => <th className="border border-[#30363d] px-3 py-2 text-white" {...props} />,
          td: (props) => <td className="border border-[#30363d] px-3 py-2" {...props} />,
          code: ({ className, children, ...rest }: ComponentPropsWithoutRef<"code">) => {
            const match = /language-(\w+)/.exec(className ?? "");
            const text = String(children ?? "").replace(/\n$/, "");
            if (!match) {
              return (
                <code
                  className="rounded bg-[#161b22] px-1.5 py-0.5 text-[0.8em] text-[#a5d6ff]"
                  style={{ fontFamily: CODE_FONT }}
                  {...rest}
                >
                  {children}
                </code>
              );
            }
            return (
              <div className="overflow-hidden rounded-xl border border-[#30363d]">
                <SyntaxHighlighter language={match[1]} style={glassCodeTheme} PreTag="div">
                  {text}
                </SyntaxHighlighter>
              </div>
            );
          },
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}
