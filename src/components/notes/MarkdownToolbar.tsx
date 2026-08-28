import { Bold, Code, Italic, Link as LinkIcon } from "lucide-react";
import type { RefObject } from "react";

import { Button } from "@/components/ui/button";

type Props = {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (next: string) => void;
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

export function MarkdownToolbar({ textareaRef, value, onChange, disabled }: Props) {
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

  const applyTemplate = (template: keyof typeof TEMPLATES) => {
    if (value.trim() && !window.confirm("Replace the current note content with this template?")) return;
    onChange(TEMPLATES[template]);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      {ACTIONS.map(({ key, label, icon: Icon, before, after }) => (
        <Button key={key} type="button" size="sm" variant="ghost" disabled={disabled} aria-label={label} title={label} onClick={() => wrap(before, after)} className="h-8 gap-1.5 px-2 text-[#c9d1d9] hover:bg-white/10 hover:text-white">
          <Icon className="size-3.5" /><span className="text-xs">{label}</span>
        </Button>
      ))}
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
