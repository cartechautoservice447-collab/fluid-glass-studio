import { Bold, Code, Italic, Link as LinkIcon } from "lucide-react";
import type { RefObject } from "react";

import { Button } from "@/components/ui/button";

type Props = {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (next: string) => void;
  onReplaceAll?: (next: string) => void;
  disabled?: boolean;
};

const ACTIONS = [
  { key: "bold", label: "Bold", icon: Bold, before: "**", after: "**" },
  { key: "italic", label: "Italic", icon: Italic, before: "_", after: "_" },
  { key: "code", label: "Code", icon: Code, before: "`", after: "`" },
  { key: "link", label: "Link", icon: LinkIcon, before: "[", after: "](https://)" },
] as const;

const TEMPLATES = {
  lecture: "# Lecture Notes\n\n## Key Concepts\n- \n\n## Important Details\n- \n\n## Questions\n- \n\n## Summary\n",
  meeting: "# Meeting Notes\n\n**Date:** \n**Attendees:** \n\n## Agenda\n- \n\n## Discussion\n- \n\n## Decisions\n- \n\n## Action Items\n- [ ] \n",
  study: "# Study Plan\n\n## Goal\n\n## Topics\n- [ ] \n- [ ] \n- [ ] \n\n## Resources\n- \n\n## Review\n- \n",
  project: "# Project Notes\n\n## Objective\n\n## Tasks\n- [ ] \n- [ ] \n- [ ] \n\n## Ideas\n- \n\n## Issues / Blockers\n- \n\n## Next Steps\n- \n",
  daily: "# Daily Notes\n\n**Date:** \n\n## Today\n- \n\n## Highlights\n- \n\n## To Do\n- [ ] \n\n## Reflection\n",
} as const;

const SYMBOL_TOOLS = [
  { key: "h1", label: "# Heading 1", insert: "# " },
  { key: "h2", label: "## Heading 2", insert: "## " },
  { key: "h3", label: "### Heading 3", insert: "### " },
  { key: "bullet", label: "* Bullet list", insert: "* " },
  { key: "bold", label: "** Bold **", before: "**", after: "**" },
  { key: "quote", label: "> Quote box", insert: "> " },
  { key: "code-block", label: "```python Code", insert: "```python\n\n```" },
  { key: "numbered", label: "1. Numbered list", insert: "1. " },
  { key: "inline-code", label: "` Inline code `", before: "`", after: "`" },
  { key: "divider", label: "--- Divider", insert: "---\n" },
  { key: "strike", label: "~~ Strikethrough ~~", before: "~~", after: "~~" },
  { key: "checklist", label: "[ ] Checklist", insert: "- [ ] " },
  { key: "link", label: "[ ]( ) Link", insert: "[text](https://)" },
  { key: "image", label: "![ ]( ) Image", insert: "![alt text](https://)" },
  { key: "table", label: "| | Table", insert: "| Column 1 | Column 2 |\n| --- | --- |\n|  |  |" },
  { key: "italic", label: "_ Italic _", before: "_", after: "_" },
  { key: "note-callout", label: "> [!NOTE] Note", insert: "> [!NOTE]\n> " },
  { key: "tip-callout", label: "> [!TIP] Tip", insert: "> [!TIP]\n> " },
  { key: "warning-callout", label: "> [!WARNING] Warning", insert: "> [!WARNING]\n> " },
  { key: "important-callout", label: "> [!IMPORTANT] Important", insert: "> [!IMPORTANT]\n> " },
] as const;

export function MarkdownToolbar({ textareaRef, value, onChange, onReplaceAll, disabled }: Props) {
  const wrap = (before: string, after: string) => {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const selected = value.slice(start, end);
    onChange(`${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`);
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  };

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

  const applyTemplate = (template: keyof typeof TEMPLATES) => {
    if (value.trim() && !window.confirm("Replace the current note content with this template?")) return;
    (onReplaceAll ?? onChange)(TEMPLATES[template]);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      {ACTIONS.map(({ key, label, icon: Icon, before, after }) => (
        <Button key={key} type="button" size="sm" variant="ghost" disabled={disabled} aria-label={label} title={label} onClick={() => wrap(before, after)} className="h-8 gap-1.5 px-2 text-[#c9d1d9] hover:bg-white/10 hover:text-white">
          <Icon className="size-3.5" /><span className="text-xs">{label}</span>
        </Button>
      ))}
      <select disabled={disabled} aria-label="Note symbols" defaultValue="" onChange={(event) => { const tool = SYMBOL_TOOLS.find((item) => item.key === event.target.value); if (tool) insertSymbol(tool); event.target.value = ""; }} className="h-8 max-w-[9rem] rounded-md border border-white/10 bg-white/5 px-2 text-xs text-[#c9d1d9] outline-none hover:bg-white/10">
        <option value="">Symbols</option>
        {SYMBOL_TOOLS.map((tool) => (
          <option key={tool.key} value={tool.key}>{tool.label}</option>
        ))}
      </select>
      <select disabled={disabled} aria-label="Note templates" defaultValue="" onChange={(event) => { if (event.target.value) applyTemplate(event.target.value as keyof typeof TEMPLATES); event.target.value = ""; }} className="h-8 max-w-[9rem] rounded-md border border-white/10 bg-white/5 px-2 text-xs text-[#c9d1d9] outline-none hover:bg-white/10">
        <option value="">Templates</option>
        <option value="lecture">Lecture Notes</option>
        <option value="meeting">Meeting Notes</option>
        <option value="study">Study Plan</option>
        <option value="project">Project Notes</option>
        <option value="daily">Daily Notes</option>
      </select>
    </div>
  );
}
