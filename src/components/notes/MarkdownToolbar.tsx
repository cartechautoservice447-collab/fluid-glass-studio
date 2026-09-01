import type { RefObject } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Props = {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (next: string) => void;
  onReplaceAll?: (next: string) => void;
  disabled?: boolean;
};

const SYMBOL_TOOLS = [
  { key: "h1", label: "# Heading 1", insert: "# " },
  { key: "h2", label: "## Heading 2", insert: "## " },
  { key: "h3", label: "### Heading 3", insert: "### " },
  { key: "bullet", label: "* Bullet list", insert: "* " },
  { key: "bold", label: "** Bold **", before: "**", after: "**" },
  { key: "italic", label: "_ Italic _", before: "_", after: "_" },
  { key: "code", label: "` Code `", before: "`", after: "`" },
  { key: "link", label: "[text](url) Link", insert: "[text](https://)" },
  { key: "quote", label: "> Quote box", insert: "> " },
  { key: "code-block", label: "```python Code block", insert: "```python\n\n```" },
  { key: "numbered", label: "1. Numbered list", insert: "1. " },
  { key: "divider", label: "--- Divider", insert: "---\n" },
  { key: "strike", label: "~~ Strikethrough ~~", before: "~~", after: "~~" },
  { key: "checklist", label: "[ ] Checklist", insert: "- [ ] " },
  { key: "image", label: "![alt](url) Image", insert: "![alt text](https://)" },
  { key: "table", label: "| | Table", insert: "| Column 1 | Column 2 |\n| --- | --- |\n|  |  |" },
  { key: "note-callout", label: "> [!NOTE] Note", insert: "> [!NOTE]\n> " },
  { key: "tip-callout", label: "> [!TIP] Tip", insert: "> [!TIP]\n> " },
  { key: "warning-callout", label: "> [!WARNING] Warning", insert: "> [!WARNING]\n> " },
  { key: "important-callout", label: "> [!IMPORTANT] Important", insert: "> [!IMPORTANT]\n> " },
] as const;

export function MarkdownToolbar({ textareaRef, value, onChange, disabled }: Props) {
  const insertSymbol = (tool: (typeof SYMBOL_TOOLS)[number]) => {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const selected = value.slice(start, end);

    if ("before" in tool && "after" in tool) {
      const next = `${value.slice(0, start)}${tool.before}${selected}${tool.after}${value.slice(end)}`;
      onChange(next);
      requestAnimationFrame(() => {
        if (!el) return;
        el.focus();
        const selectionStart = start + tool.before.length;
        el.setSelectionRange(selectionStart, selectionStart + selected.length);
      });
      return;
    }

    const insert = tool.insert;
    const next = `${value.slice(0, start)}${insert}${selected}${value.slice(end)}`;
    onChange(next);

    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      const caret = start + insert.length;
      if (selected) {
        el.setSelectionRange(caret, caret + selected.length);
      } else if (tool.key === "code-block") {
        const bodyStart = start + "```python\n".length;
        el.setSelectionRange(bodyStart, bodyStart);
      } else if (tool.key === "table") {
        const cellStart = start + "| Column 1 | Column 2 |\n| --- | --- |\n| ".length;
        el.setSelectionRange(cellStart, cellStart);
      } else if (tool.key === "link") {
        const labelStart = start + 1;
        el.setSelectionRange(labelStart, labelStart + 4);
      } else if (tool.key === "image") {
        const altStart = start + 2;
        el.setSelectionRange(altStart, altStart + 3);
      } else {
        el.setSelectionRange(caret, caret);
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      <Select
        disabled={disabled ?? false}
        defaultValue=""
        onValueChange={(selectedKey) => {
          const tool = SYMBOL_TOOLS.find((item) => item.key === selectedKey);
          if (tool) insertSymbol(tool);
        }}
      >
        <SelectTrigger
          className="h-8 w-[7.2rem] border-white/25 bg-white/10 text-xs font-medium text-[#c9d1d9] shadow-sm backdrop-blur-md"
          aria-label="Note symbols"
          title="Note symbols"
        >
          <SelectValue placeholder="Symbols" />
        </SelectTrigger>
        <SelectContent className="min-w-[14rem]">
          {SYMBOL_TOOLS.map((tool) => (
            <SelectItem key={tool.key} value={tool.key}>
              {tool.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
