import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { StudySessionPanel, type StudySessionPattern, type StudySessionSegment } from "@/components/focus/StudySessionPanel";

type StudySessionInput = {
  pattern: StudySessionPattern;
  title: string;
  focusMinutes: number;
  schedule: StudySessionSegment[];
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartSession: (input: StudySessionInput) => void;
};

export function StudySessionModal({ open, onOpenChange, onStartSession }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl overflow-hidden rounded-[28px] border-white/20 bg-black/35 p-0 text-foreground shadow-2xl backdrop-blur-2xl [&>button]:hidden">
        <div className="relative max-h-[88vh] overflow-y-auto p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-24 size-56 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between gap-3">
              <DialogTitle className="text-lg font-semibold tracking-tight">Study Session</DialogTitle>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-medium text-muted-foreground transition hover:bg-white/15 hover:text-foreground"
              >
                Close
              </button>
            </div>
            <StudySessionPanel onStartSession={onStartSession} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
