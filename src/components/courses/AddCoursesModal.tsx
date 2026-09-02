import { Plus } from "lucide-react";
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

const ACCENT_SWATCH: Record<CourseAccent, string> = {
  sky: "oklch(0.75 0.14 235)",
  violet: "oklch(0.7 0.19 300)",
  amber: "oklch(0.8 0.16 80)",
  emerald: "oklch(0.75 0.16 155)",
  rose: "oklch(0.72 0.18 15)",
  cyan: "oklch(0.78 0.13 200)",
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
      <DialogContent className="border-white/15 bg-[#0f1420]/90 backdrop-blur-2xl sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New course</DialogTitle>
            <DialogDescription>
              Give it a name — you can start adding notes as soon as it's created.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="space-y-1.5"><label htmlFor="course-name" className="text-xs font-medium text-muted-foreground">Course name</label><Input id="course-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Organic Chemistry II" autoFocus required /></div>
            <div className="space-y-1.5"><label htmlFor="course-desc" className="text-xs font-medium text-muted-foreground">Description (optional)</label><Textarea id="course-desc" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What's this course about?" rows={3} /></div>
            <div className="space-y-1.5"><p className="text-xs font-medium text-muted-foreground">Accent color</p><div className="flex gap-2">{COURSE_ACCENTS.map((accent) => <button key={accent} type="button" aria-label={accent} onClick={() => setColor(accent)} className={cn("size-7 rounded-full ring-offset-2 ring-offset-background transition-transform hover:scale-110", color === accent && "ring-2 ring-white")} style={{ backgroundColor: ACCENT_SWATCH[accent] }} />)}</div></div>
          </div>
          <DialogFooter className="mt-6"><Button type="submit" disabled={!name.trim()}>Create course</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
