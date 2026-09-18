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
      <DialogContent glass glassRadius={32} glassBezel={48} className="max-w-2xl overflow-hidden rounded-[28px] border-white/20 p-0 text-foreground shadow-none [&>button]:hidden">
        <div className="relative max-h-[88vh] overflow-y-auto p-6 sm:p-8">
          <div className="relative">
            <div className="flex items-center justify-between gap-3">
              <DialogTitle className="text-lg font-semibold tracking-tight">Study Session</DialogTitle>
              <button type="button" onClick={() => onOpenChange(false)} className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-medium text-muted-foreground transition hover:bg-white/15 hover:text-foreground">Close</button>
            </div>
            <StudySessionPanel onStartSession={onStartSession} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
