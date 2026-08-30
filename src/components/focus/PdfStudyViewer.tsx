import { FileText, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Props = {
  active: boolean;
};

export function PdfStudyViewer({ active }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState("");

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  const handleFile = (file: File | undefined) => {
    if (!file || file.type !== "application/pdf") return;
    const nextUrl = URL.createObjectURL(file);
    setPdfUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return nextUrl;
    });
    setPdfName(file.name);
  };

  if (!active) return null;

  return (
    <div className="flex h-full min-h-0 flex-col bg-black">
      <div className="flex shrink-0 items-center gap-2 border-b border-white/10 bg-black/35 px-3 py-2">
        <FileText className="size-3.5 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground">
          {pdfName || "No PDF imported"}
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-white/15 bg-white/10 px-2.5 py-1.5 text-[11px] font-medium text-foreground hover:bg-white/15"
        >
          <Upload className="size-3.5" />
          Import PDF
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden bg-zinc-900">
        {pdfUrl ? (
          <iframe
            key={pdfUrl}
            src={pdfUrl}
            title={pdfName || "PDF viewer"}
            className="h-full w-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center text-muted-foreground transition hover:bg-white/[.03]"
          >
            <span className="flex size-14 items-center justify-center rounded-2xl border border-white/15 bg-white/[.05]">
              <Upload className="size-6" />
            </span>
            <span>
              <span className="block text-sm font-medium text-foreground">Import a PDF</span>
              <span className="mt-1 block text-xs text-muted-foreground">Open a lecture handout, textbook, or reference PDF beside your notes.</span>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
