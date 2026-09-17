import { Check, Plus } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { COURSE_ACCENTS, type CourseAccent } from "@/hooks/useCourses";
import { cn } from "@/lib/utils";

const ACCENT_SWATCH: Record<CourseAccent, { start: string; end: string }> = {
  sky: { start: "#38bdf8", end: "#0ea5e9" },
  violet: { start: "#a78bfa", end: "#7c3aed" },
  amber: { start: "#fbbf24", end: "#f59e0b" },
  emerald: { start: "#34d399", end: "#10b981" },
  rose: { start: "#fb7185", end: "#e11d48" },
  cyan: { start: "#22d3ee", end: "#06b6d4" },
};

const COURSE_CARD_COLORS: CourseAccent[] = ["sky", "violet", "emerald", "amber", "rose"];

const ACCENT_LABEL: Record<CourseAccent, string> = {
  sky: "Sky",
  violet: "Violet",
  amber: "Amber",
  emerald: "Emerald",
  rose: "Rose",
  cyan: "Cyan",
};

type Props = {
  onCreate: (input: { name: string; description: string; color: CourseAccent }) => void;
};

export function AddCourseModal({ onCreate }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState<CourseAccent>("sky");

  const reset = () => {
    setName("");
    setDescription("");
    setColor("sky");
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    onCreate({ name, description, color });
    reset();
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          className="notes-pulse-glow flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white shadow-[0_0_28px_rgba(16,185,129,0.62),0_10px_28px_rgba(5,150,105,0.42)] ring-1 ring-emerald-300/55 transition-all hover:scale-[1.015] hover:bg-emerald-400 hover:shadow-[0_0_34px_rgba(52,211,153,0.74),0_12px_32px_rgba(5,150,105,0.5)] active:scale-[0.985]"
        >
          <Plus className="size-4 stroke-[2]" />
          Add New Course
        </button>
      </DialogTrigger>
      <DialogContent className="overflow-hidden border-white/20 bg-transparent p-0 shadow-2xl sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="relative border-b border-white/10 px-6 pb-5 pt-6">
            <DialogTitle className="text-lg tracking-tight">New course</DialogTitle>
            <DialogDescription>Create a course and choose the accent that will define its card.</DialogDescription>
          </DialogHeader>
          <div className="relative space-y-5 px-6 py-5">
            <div className="space-y-1.5">
              <label htmlFor="course-name" className="text-xs font-medium text-muted-foreground">Course name</label>
              <Input id="course-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Organic Chemistry II" autoFocus required />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="course-desc" className="text-xs font-medium text-muted-foreground">Description (optional)</label>
              <Textarea id="course-desc" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What's this course about?" rows={3} />
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Course card color</p>
                <span className="text-[0.65rem] font-medium text-foreground/70">{ACCENT_LABEL[color]}</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {COURSE_CARD_COLORS.map((accent) => {
                  const selected = color === accent;
                  return (
                    <button
                      key={accent}
                      type="button"
                      aria-label={`${ACCENT_LABEL[accent]} course card color`}
                      aria-pressed={selected}
                      title={ACCENT_LABEL[accent]}
                      onClick={() => setColor(accent)}
                      className={cn(
                        "group relative flex h-12 items-center justify-center overflow-hidden rounded-2xl border transition-all duration-200",
                        "border-white/10 bg-white/[0.06] hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.1]",
                        selected && "-translate-y-0.5 border-white/45 bg-white/[0.13] shadow-[inset_0_1px_1px_rgba(255,255,255,.3),0_8px_24px_rgba(0,0,0,.2)]",
                      )}
                    >
                      <span className="absolute inset-1 rounded-[14px] opacity-95 transition-opacity group-hover:opacity-100" style={{ background: `linear-gradient(135deg, ${ACCENT_SWATCH[accent].start} 0%, ${ACCENT_SWATCH[accent].end} 100%)`, boxShadow: `0 0 22px ${ACCENT_SWATCH[accent].end}66` }} />
                      <span className="absolute inset-[1px] rounded-[14px] bg-gradient-to-b from-white/25 via-transparent to-black/15" aria-hidden />
                      {selected && <Check className="relative z-10 size-4 text-white drop-shadow" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter className="relative border-t border-white/10 px-6 py-4">
            <Button type="submit" disabled={!name.trim()}>Create course</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
