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

export function MarkdownToolbar({ textareaRef, value, onChange, disabled }: Props) {
  const wrap = (before: string, after: string) => {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const selected = value.slice(start, end);
    const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      {ACTIONS.map(({ key, label, icon: Icon, before, after }) => (
        <Button
          key={key}
          type="button"
          size="sm"
          variant="ghost"
          disabled={disabled}
          aria-label={label}
          title={label}
          onClick={() => wrap(before, after)}
          className="h-8 gap-1.5 px-2 text-[#c9d1d9] hover:bg-white/10 hover:text-white"
        >
          <Icon className="size-3.5" />
          <span className="text-xs">{label}</span>
        </Button>
      ))}
    </div>
  );
}
