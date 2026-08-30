import { Download, FileDown, FileText, Link2, X } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

type Block = { kind: "heading" | "code" | "text"; text: string; level?: number };

const INITIAL_CONTENT = "Paste your content here.\n\nHeadings, normal text, and code are kept in the same order.\n\n```\nconst example = true;\n```";

function normalizeUrl(raw: string) {
  const value = raw.trim();
  if (!value) return "";
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function textFromElement(element: Element) {
  return (element.textContent ?? "").replace(/\r\n/g, "\n").replace(/\u00a0/g, " ");
}

function extractBlocks(html: string): Block[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script,style,noscript,template,svg").forEach((node) => node.remove());
  const blocks: Block[] = [];
  const root = doc.body;

  root.querySelectorAll("h1,h2,h3,h4,h5,h6,pre,blockquote,p,li").forEach((node) => {
    const text = textFromElement(node).trimEnd();
    if (!text.trim()) return;
    const tag = node.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tag)) blocks.push({ kind: "heading", text, level: Number(tag[1]) });
    else if (tag === "pre") blocks.push({ kind: "code", text });
    else blocks.push({ kind: "text", text });
  });

  if (blocks.length === 0) {
    const fallback = (root.textContent ?? "").replace(/\r\n/g, "\n").trim();
    if (fallback) blocks.push({ kind: "text", text: fallback });
  }
  return blocks;
}

function blocksFromPastedText(value: string): Block[] {
  const lines = value.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let inCode = false;
  let code: string[] = [];

  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      if (inCode) {
        blocks.push({ kind: "code", text: code.join("\n") });
        code = [];
      }
      inCode = !inCode;
      continue;
    }
    if (inCode) {
      code.push(line);
      continue;
    }
    const heading = line.match(/^\s*(#{1,6})\s+(.+)$/);
    if (heading) {
      blocks.push({ kind: "heading", level: heading[1].length, text: heading[2] });
      continue;
    }
    if (line.trim() === "") {
      if (blocks.length && blocks[blocks.length - 1].kind === "text" && !blocks[blocks.length - 1].text.endsWith("\n")) {
        blocks[blocks.length - 1].text += "\n";
      }
      continue;
    }
    blocks.push({ kind: "text", text: line });
  }
  if (inCode) blocks.push({ kind: "code", text: code.join("\n") });
  return blocks.length ? blocks : [{ kind: "text", text: value }];
}

function blocksToHtml(blocks: Block[]) {
  return blocks
    .map((block) => {
      if (block.kind === "heading") return `<h${block.level ?? 1}>${escapeHtml(block.text)}</h${block.level ?? 1}>`;
      if (block.kind === "code") return `<pre>${escapeHtml(block.text)}</pre>`;
      return `<p>${escapeHtml(block.text).replace(/\n/g, "<br />")}</p>`;
    })
    .join("");
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
}

function openPrintWindow(blocks: Block[], title: string) {
  const win = window.open("", "_blank", "noopener,noreferrer,width=1000,height=900");
  if (!win) throw new Error("The browser blocked the PDF export window. Allow pop-ups for this site and try again.");

  win.document.write(`<!doctype html><html><head><meta charset="utf-8" /><title>${escapeHtml(title)}</title><style>
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body { margin: 0; color: #111827; background: #fff; font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.55; }
  main { white-space: normal; overflow-wrap: anywhere; }
  h1,h2,h3,h4,h5,h6 { page-break-after: avoid; margin: 0 0 10px; line-height: 1.2; }
  h1 { font-size: 22pt; } h2 { font-size: 18pt; } h3 { font-size: 15pt; } h4 { font-size: 13pt; } h5 { font-size: 12pt; } h6 { font-size: 11pt; }
  p { margin: 0 0 9px; white-space: pre-wrap; }
  pre { font-family: "Courier New", Consolas, monospace; font-size: 9pt; line-height: 1.45; white-space: pre-wrap; overflow-wrap: anywhere; margin: 12px 0; padding: 10px 12px; border: 1px solid #d1d5db; background: #f3f4f6; border-radius: 6px; page-break-inside: avoid; }
  footer { margin-top: 24px; color: #6b7280; font-size: 8pt; }
  </style></head><body><main>${blocksToHtml(blocks)}</main><footer>Generated from Glass Notes</footer></body></html>`);
  win.document.close();
  win.focus();
  const runPrint = () => {
    win.print();
    win.onafterprint = () => win.close();
  };
  if (win.document.fonts?.ready) win.document.fonts.ready.then(runPrint).catch(runPrint);
  else setTimeout(runPrint, 250);
}

export function PdfGeneratorModal() {
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState<"content" | "url">("content");
  const [content, setContent] = useState(INITIAL_CONTENT);
  const [url, setUrl] = useState("");
  const [blocks, setBlocks] = useState<Block[]>(() => blocksFromPastedText(INITIAL_CONTENT));
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const previewHtml = useMemo(() => blocksToHtml(blocks), [blocks]);

  const buildFromContent = () => {
    setBlocks(blocksFromPastedText(content));
    setStatus("Content preserved exactly as entered.");
  };

  const extractFromUrl = async () => {
    const target = normalizeUrl(url);
    if (!target) return;
    setLoading(true);
    setStatus("");
    try {
      const response = await fetch(target, { credentials: "omit" });
      if (!response.ok) throw new Error(`The page returned ${response.status}.`);
      const html = await response.text();
      const next = extractBlocks(html);
      if (!next.length) throw new Error("No readable page content was found.");
      setBlocks(next);
      setContent(next.map((block) => block.text).join("\n"));
      setStatus("Extracted headings, text, and code blocks in source order.");
    } catch (error) {
      setStatus(error instanceof Error ? `${error.message} You can paste the page content instead for exact preservation.` : "This page could not be extracted in the browser. Paste its content instead for exact preservation.");
    } finally {
      setLoading(false);
    }
  };

  const exportPdf = () => {
    try {
      openPrintWindow(blocks, "Glass Notes PDF");
      setStatus("PDF export opened. Choose “Save as PDF” in the browser print dialog.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "PDF export could not be opened.");
    }
  };

  return (
    <>
      <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:bg-white/10" onClick={() => setOpen(true)} aria-label="Open PDF generator" title="PDF generator">
        <FileDown className="size-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl overflow-hidden rounded-[28px] border-white/20 bg-black/40 p-0 text-foreground shadow-2xl backdrop-blur-2xl">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div className="flex items-center gap-3"><div className="flex size-9 items-center justify-center rounded-xl border border-white/15 bg-white/10"><FileText className="size-4" /></div><div><DialogTitle className="text-sm font-semibold">PDF Generator</DialogTitle><p className="text-[11px] text-muted-foreground">Paste exact content or extract readable content from a URL, preview, then export.</p></div></div>
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setOpen(false)} aria-label="Close PDF generator"><X className="size-4" /></Button>
          </div>

          <div className="grid min-h-0 gap-0 lg:grid-cols-2">
            <div className="border-b border-white/10 p-5 lg:border-b-0 lg:border-r">
              <div className="flex gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-1">
                <button type="button" onClick={() => setSource("content")} className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium ${source === "content" ? "bg-white/15 text-foreground" : "text-muted-foreground hover:bg-white/10"}`}>Paste content</button>
                <button type="button" onClick={() => setSource("url")} className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium ${source === "url" ? "bg-white/15 text-foreground" : "text-muted-foreground hover:bg-white/10"}`}><Link2 className="mr-1 inline size-3" />Paste link</button>
              </div>

              {source === "content" ? (
                <div className="mt-4 space-y-3">
                  <textarea value={content} onChange={(event) => setContent(event.target.value)} spellCheck={false} className="h-[440px] w-full resize-none rounded-2xl border border-white/10 bg-black/25 p-4 font-mono text-xs leading-6 text-foreground outline-none focus:border-white/30" placeholder="Paste exact words, headings, code and line breaks here…" />
                  <Button onClick={buildFromContent} className="w-full">Update exact preview</Button>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><p className="text-xs font-medium">Source URL</p><input value={url} onChange={(event) => setUrl(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void extractFromUrl(); }} placeholder="https://example.com/lecture" className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-xs outline-none" /><Button onClick={() => void extractFromUrl()} disabled={loading} className="mt-3 w-full">{loading ? "Extracting…" : "Extract content"}</Button></div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-xs leading-5 text-muted-foreground">Browser security can block extraction from some sites. When that happens, paste the page content in the other tab to preserve it exactly.</div>
                </div>
              )}
            </div>

            <div className="flex min-h-0 flex-col p-5">
              <div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">3rd Glass Preview</p><p className="mt-1 text-xs text-muted-foreground">This is the content sent to the PDF export.</p></div><Button onClick={exportPdf} size="sm" className="shrink-0"><Download className="mr-2 size-3.5" />Export PDF</Button></div>
              <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-white/20 bg-white/[0.08] p-5 shadow-[inset_0_1px_2px_rgba(255,255,255,.3),0_16px_40px_rgba(0,0,0,.22)] backdrop-blur-2xl">
                <article className="prose prose-invert max-w-none text-sm text-foreground" dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>
              {status && <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] leading-5 text-muted-foreground">{status}</p>}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
