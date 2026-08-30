import { Download, FileDown, FileText, Link2, X } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

type Block = { kind: "heading" | "code" | "text"; text: string; level?: number; html?: string };
type PreviewSource = "content" | "url";

const INITIAL_CONTENT = "Paste your content here.\n\n# Heading\n\nNormal text stays exactly as pasted.\n\n```js\nconst example = true;\n```";

const ALLOWED_INLINE = new Set(["B", "STRONG", "I", "EM", "U", "A", "BR", "CODE", "SPAN", "MARK", "SUP", "SUB"]);

function normalizeUrl(raw: string) {
  const value = raw.trim();
  if (!value) return "";
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function textFromElement(element: Element) {
  return (element.textContent ?? "").replace(/\r\n/g, "\n").replace(/\u00a0/g, " ");
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
}

// Keeps only a safe set of inline formatting tags (bold, italic, underline,
// color, links) from pasted HTML — everything else is stripped or unwrapped.
// This is what lets a Google Docs / Word paste keep looking like itself.
function sanitizeInline(node: Node): string {
  let out = "";
  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      out += escapeHtml(child.textContent ?? "");
      return;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) return;
    const el = child as HTMLElement;
    const tag = el.tagName;
    if (tag === "BR") { out += "<br />"; return; }
    if (!ALLOWED_INLINE.has(tag)) { out += sanitizeInline(el); return; }
    const inner = sanitizeInline(el);
    if (tag === "A") {
      const href = el.getAttribute("href") ?? "";
      const safeHref = /^https?:\/\//i.test(href) ? href : "#";
      out += `<a href="${escapeHtml(safeHref)}" target="_blank" rel="noreferrer" class="underline">${inner}</a>`;
    } else if (tag === "SPAN" || tag === "MARK") {
      const style = el.getAttribute("style") ?? "";
      const color = style.match(/(?<!background-)color:\s*([^;]+)/i)?.[1]?.trim();
      const bg = style.match(/background(?:-color)?:\s*([^;]+)/i)?.[1]?.trim();
      const bold = /font-weight:\s*(bold|[6-9]00)/i.test(style);
      const italic = /font-style:\s*italic/i.test(style);
      const underline = /text-decoration:\s*underline/i.test(style);
      const css = [color && `color:${color}`, bg && `background-color:${bg}`, bold && "font-weight:bold", italic && "font-style:italic", underline && "text-decoration:underline"].filter(Boolean).join(";");
      out += css ? `<span style="${css}">${inner}</span>` : inner;
    } else {
      out += `<${tag.toLowerCase()}>${inner}</${tag.toLowerCase()}>`;
    }
  });
  return out;
}

function extractBlocks(html: string): Block[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script,style,noscript,template,svg,img").forEach((node) => node.remove());
  const blocks: Block[] = [];
  const root = doc.body;

  root.querySelectorAll("h1,h2,h3,h4,h5,h6,pre,blockquote,p,li").forEach((node) => {
    const text = textFromElement(node).trimEnd();
    if (!text.trim()) return;
    const tag = node.tagName.toLowerCase();
    const html = sanitizeInline(node).trim();
    if (/^h[1-6]$/.test(tag)) blocks.push({ kind: "heading", text, html, level: Number(tag[1]) });
    else if (tag === "pre") blocks.push({ kind: "code", text, html });
    else blocks.push({ kind: "text", text, html });
  });

  if (blocks.length === 0) {
    const fallback = (root.textContent ?? "").replace(/\r\n/g, "\n").trim();
    if (fallback) blocks.push({ kind: "text", text: fallback });
  }
  return blocks;
}

function blocksFromPastedText(value: string): Block[] {
  return value ? [{ kind: "text", text: value.replace(/\r\n/g, "\n") }] : [];
}

function blocksToHtml(blocks: Block[]) {
  return blocks
    .map((block) => {
      const inner = block.html && block.html.trim() ? block.html : escapeHtml(block.text).replace(/\n/g, "<br />");
      if (block.kind === "heading") return `<h${block.level ?? 1}>${inner}</h${block.level ?? 1}>`;
      if (block.kind === "code") return `<pre>${inner}</pre>`;
      return `<p>${inner}</p>`;
    })
    .join("");
}

function rawContentToHtml(value: string) {
  return `<pre class="exact-content">${escapeHtml(value.replace(/\r\n/g, "\n"))}</pre>`;
}

function openPrintWindow(contentHtml: string, title: string) {
  const win = window.open("", "_blank", "width=1000,height=900");
  if (!win) throw new Error("The browser blocked the PDF export window. Allow pop-ups for this site and try again.");

  win.document.write(`<!doctype html><html><head><meta charset="utf-8" /><title>${escapeHtml(title)}</title><style>
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body { margin: 0; color: #111827; background: #fff; font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.55; }
  main { width: 100%; overflow-wrap: anywhere; }
  h1,h2,h3,h4,h5,h6 { page-break-after: avoid; margin: 0 0 10px; line-height: 1.2; }
  h1 { font-size: 22pt; } h2 { font-size: 18pt; } h3 { font-size: 15pt; } h4 { font-size: 13pt; } h5 { font-size: 12pt; } h6 { font-size: 11pt; }
  p { margin: 0 0 9px; white-space: pre-wrap; }
  pre { font-family: "Courier New", Consolas, monospace; font-size: 9.5pt; line-height: 1.5; white-space: pre-wrap; overflow-wrap: anywhere; margin: 0; }
  .exact-content { color: #111827; background: #fff; border: 0; padding: 0; }
  footer { margin-top: 24px; color: #6b7280; font-size: 8pt; }
  </style></head><body><main>${contentHtml}</main><footer>Generated from Glass Notes</footer></body></html>`);
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
  const [source, setSource] = useState<PreviewSource>("content");
  const [content, setContent] = useState(INITIAL_CONTENT);
  const [url, setUrl] = useState("");
  const [blocks, setBlocks] = useState<Block[]>(() => blocksFromPastedText(INITIAL_CONTENT));
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [rawMode, setRawMode] = useState(true);

  const previewHtml = useMemo(() => (rawMode ? rawContentToHtml(content) : blocksToHtml(blocks)), [rawMode, content, blocks]);

  const buildFromContent = () => {
    setBlocks(blocksFromPastedText(content));
    setRawMode(true);
    setStatus("Exact mode: every character, heading marker, space, indentation, code fence, and line break is preserved.");
  };

  // Intercepts paste on the content box: if the clipboard has rich HTML (e.g. from
  // Google Docs or Word), it's parsed and rendered with formatting kept intact —
  // instead of the browser's normal behavior of flattening everything to plain text.
  const handleContentPaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const html = event.clipboardData.getData("text/html");
    if (!html) return;
    const next = extractBlocks(html);
    if (!next.length) return;
    event.preventDefault();
    setBlocks(next);
    setContent(next.map((block) => block.text).join("\n\n"));
    setRawMode(false);
    setStatus("Pasted content — headings, bold, italics, colors, and links kept as they looked in the source.");
  };

  const extractFromUrl = async () => {
    const target = normalizeUrl(url);
    if (!target) return;
    setLoading(true);
    setStatus("");
    setRawMode(false);
    try {
      const response = await fetch(target, { credentials: "omit" });
      if (!response.ok) throw new Error(`The page returned ${response.status}.`);
      const html = await response.text();
      const next = extractBlocks(html);
      if (!next.length) throw new Error("No readable page content was found.");
      setBlocks(next);
      setContent(next.map((block) => block.text).join("\n\n"));
      setStatus("Extracted readable headings, text, formatting, and code blocks in source order.");
    } catch (error) {
      setRawMode(true);
      setStatus(error instanceof Error ? `${error.message} You can paste the page content instead for exact preservation.` : "This page could not be extracted in the browser. Paste its content instead for exact preservation.");
    } finally {
      setLoading(false);
    }
  };

  const exportPdf = () => {
    try {
      openPrintWindow(previewHtml, "Glass Notes PDF");
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
            <div className="flex items-center gap-3"><div className="flex size-9 items-center justify-center rounded-xl border border-white/15 bg-white/10"><FileText className="size-4" /></div><div><DialogTitle className="text-sm font-semibold">PDF Generator</DialogTitle><p className="text-[11px] text-muted-foreground">Paste content (formatting kept like Google Docs) or extract from a URL, preview, then export.</p></div></div>
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
                  <textarea value={content} onChange={(event) => { setContent(event.target.value); setRawMode(true); }} onPaste={handleContentPaste} spellCheck={false} className="h-[440px] w-full resize-none rounded-2xl border border-white/10 bg-black/25 p-4 font-mono text-xs leading-6 text-foreground outline-none focus:border-white/30" placeholder="Paste from Google Docs, Word, or plain text…" />
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
              <div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">3rd Glass Preview</p><p className="mt-1 text-xs text-muted-foreground">{rawMode ? "Exact pasted content — formatting characters are preserved." : "Formatting preserved — headings, bold, italics, colors, and links."}</p></div><Button onClick={exportPdf} size="sm" className="shrink-0"><Download className="mr-2 size-3.5" />Export PDF</Button></div>
              <div className={`min-h-0 flex-1 overflow-y-auto rounded-2xl border border-white/20 bg-white/[0.08] p-5 shadow-[inset_0_1px_2px_rgba(255,255,255,.3),0_16px_40px_rgba(0,0,0,.22)] backdrop-blur-2xl ${rawMode ? "font-mono" : ""}`}>
                {rawMode ? <pre className="m-0 whitespace-pre-wrap break-words text-sm leading-6 text-foreground">{content.replace(/\r\n/g, "\n")}</pre> : <article className="prose prose-invert max-w-none text-sm text-foreground" dangerouslySetInnerHTML={{ __html: previewHtml }} />}
              </div>
              {status && <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] leading-5 text-muted-foreground">{status}</p>}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
