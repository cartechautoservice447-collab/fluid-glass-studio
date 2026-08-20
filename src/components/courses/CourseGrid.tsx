import { BookOpen, CalendarDays, Clock3, Power, ShieldCheck, Timer, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { AddCourseModal } from "@/components/courses/AddCoursesModal";
import { CourseCard } from "@/components/courses/CourseCard";
import { PomodoroModal } from "@/components/focus/PomodoroModal";
import { EngineSettingsModal } from "@/components/liquid/EngineSettingsModal";
import { ThemeToggle } from "@/components/liquid/ThemeToggle";
import { useCustomization } from "@/context/CustomizationContext";
import type { Course, CourseAccent } from "@/hooks/useCourses";

type Props = {
  courses: Course[];
  noteCounts: Record<string, number>;
  lastEdited: Record<string, number | null>;
  hiddenCourseId: string | null;
  onOpenCourse: (id: string) => void;
  onCreateCourse: (input: { name: string; description: string; color: CourseAccent }) => void;
};

const DISTRACTION_KEY = "liquid-glass-distraction-mode";

type DistractionSession = {
  active: boolean;
  courseName: string;
  date: string;
  durationHours: number;
  endsAt: number | null;
};

const DEFAULT_SESSION: DistractionSession = {
  active: false,
  courseName: "",
  date: new Date().toISOString().slice(0, 10),
  durationHours: 1,
  endsAt: null,
};

function readDistractionSession(): DistractionSession {
  try {
    const saved = JSON.parse(localStorage.getItem(DISTRACTION_KEY) ?? "null");
    if (!saved) return DEFAULT_SESSION;
    const session = { ...DEFAULT_SESSION, ...saved } as DistractionSession;
    if (session.active && session.endsAt && session.endsAt <= Date.now()) {
      return { ...session, active: false, endsAt: null };
    }
    return session;
  } catch {
    return DEFAULT_SESSION;
  }
}

function formatRemaining(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
  const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function DistractionMode({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [session, setSession] = useState<DistractionSession>(() => readDistractionSession());
  const [remaining, setRemaining] = useState(0);

  const save = (next: DistractionSession) => {
    setSession(next);
    localStorage.setItem(DISTRACTION_KEY, JSON.stringify(next));
  };

  useEffect(() => {
    if (!session.active || !session.endsAt) {
      setRemaining(0);
      return;
    }

    const tick = () => {
      const left = Math.max(0, session.endsAt! - Date.now());
      setRemaining(left);
      if (left === 0) {
        save({ ...session, active: false, endsAt: null });
      }
    };

    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [session.active, session.endsAt]);

  const start = () => {
    const hours = Math.min(24, Math.max(1, Number(session.durationHours) || 1));
    const courseName = session.courseName.trim() || "Study Session";
    const endsAt = Date.now() + hours * 60 * 60 * 1000;
    save({ ...session, active: true, courseName, durationHours: hours, endsAt });
  };

  const stop = () => {
    save({ ...session, active: false, endsAt: null });
    onOpenChange(false);
  };

  const dateLabel = useMemo(() => {
    const date = new Date(`${session.date}T00:00:00`);
    return Number.isNaN(date.getTime()) ? session.date : date.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
  }, [session.date]);

  if (session.active) {
    return (
      <div className="fixed inset-0 z-[200] flex min-h-screen items-center justify-center overflow-hidden bg-black/70 p-5 backdrop-blur-2xl" role="dialog" aria-modal="true" aria-label="Distraction mode active">
        <div className="pointer-events-none absolute -left-32 -top-28 size-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-24 size-[28rem] rounded-full bg-white/10 blur-3xl" />
        <div className="relative w-full max-w-xl rounded-[34px] border border-white/20 bg-black/40 p-7 text-center shadow-2xl backdrop-blur-2xl sm:p-10">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.07] shadow-inner">
            <ShieldCheck className="size-7" />
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">Distraction Mode ON</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">Stay with your study</h2>
          <p className="mt-2 text-sm text-muted-foreground">The website workspace is locked until your study session ends.</p>

          <div className="mt-7 grid grid-cols-1 gap-2 text-left sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3">
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground"><BookOpen className="size-3.5" /> Course</div>
              <p className="mt-1 truncate text-sm font-semibold">{session.courseName}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3">
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground"><CalendarDays className="size-3.5" /> Date</div>
              <p className="mt-1 text-sm font-semibold">{dateLabel}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3">
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground"><Clock3 className="size-3.5" /> Planned</div>
              <p className="mt-1 text-sm font-semibold">{session.durationHours} hour{session.durationHours === 1 ? "" : "s"}</p>
            </div>
          </div>

          <div className="mt-9 text-6xl font-semibold tabular-nums tracking-[-0.05em] sm:text-7xl">{formatRemaining(remaining)}</div>
          <p className="mt-2 text-sm text-muted-foreground">Study time remaining</p>
          <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-xs leading-5 text-muted-foreground">
            Notes, course folders, and dashboard controls are unavailable during this session.
          </div>

          <button type="button" onClick={stop} className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs text-muted-foreground transition hover:bg-white/10 hover:text-foreground" aria-label="Turn off distraction mode">
            <Power className="size-3.5" /> Turn off Distraction Mode
          </button>
        </div>
      </div>
    );
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[190] flex items-center justify-center bg-black/35 p-5 backdrop-blur-md" role="dialog" aria-modal="true" aria-label="Distraction Mode setup">
      <div className="w-full max-w-md rounded-[30px] border border-white/20 bg-black/35 p-6 shadow-2xl backdrop-blur-2xl sm:p-7">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold">Distraction Mode</p>
            <p className="mt-1 text-xs text-muted-foreground">Create a focused study session.</p>
          </div>
          <button type="button" onClick={() => onOpenChange(false)} className="rounded-full p-2 text-muted-foreground hover:bg-white/10" aria-label="Close"><X className="size-4" /></button>
        </div>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 block text-xs font-medium text-muted-foreground">Course name</span>
            <input value={session.courseName} onChange={(event) => setSession((current) => ({ ...current, courseName: event.target.value }))} placeholder="e.g. Accountancy" className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm outline-none transition focus:border-white/25" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-2 block text-xs font-medium text-muted-foreground">Study hours</span>
              <input type="number" min={1} max={24} value={session.durationHours} onChange={(event) => setSession((current) => ({ ...current, durationHours: Math.min(24, Math.max(1, Number(event.target.value) || 1)) }))} className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm outline-none" />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-medium text-muted-foreground">Date</span>
              <input type="date" value={session.date} onChange={(event) => setSession((current) => ({ ...current, date: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm outline-none" />
            </label>
          </div>
        </div>

        <button type="button" onClick={start} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground px-5 py-3 text-sm font-semibold text-background transition hover:opacity-90">
          <Power className="size-4" /> Turn ON & Start Study
        </button>
        <p className="mt-3 text-center text-[11px] leading-5 text-muted-foreground">This locks the website interface for the selected time. It cannot lock your phone, browser, or other apps outside this website.</p>
      </div>
    </div>
  );
}

export function CourseGrid({
  courses,
  noteCounts,
  lastEdited,
  hiddenCourseId,
  onOpenCourse,
  onCreateCourse,
}: Props) {
  const { displayName } = useCustomization();
  const [pomodoroOpen, setPomodoroOpen] = useState(false);
  const [distractionOpen, setDistractionOpen] = useState(false);
  const [distractionActive, setDistractionActive] = useState(() => readDistractionSession().active);

  useEffect(() => {
    const sync = () => setDistractionActive(readDistractionSession().active);
    window.addEventListener("storage", sync);
    const id = window.setInterval(sync, 1000);
    return () => {
      window.removeEventListener("storage", sync);
      window.clearInterval(id);
    };
  }, []);

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-6 overflow-y-auto px-2 py-2">
      <div className="liquid-panel flex flex-wrap items-center justify-between gap-4 rounded-3xl p-5" style={{ backgroundColor: "var(--water-gel-bg)", backdropFilter: "blur(var(--liquid-density, 12px)) saturate(200%) contrast(105%)", borderTop: "1px solid rgba(255, 255, 255, 0.4)", boxShadow: "inset 0 1px 2px 0 rgba(255, 255, 255, 0.5), inset 0 -2px 4px 0 rgba(0, 0, 0, 0.25), 0 8px 32px 0 rgba(0, 0, 0, 0.37)" }}>
        <div className="flex items-center gap-4">
          <span aria-hidden className="flex size-14 shrink-0 items-center justify-center rounded-full" style={{ background: "radial-gradient(60% 60% at 35% 30%, oklch(0.85 0.15 250 / 0.9), oklch(0.55 0.2 285 / 0.6) 55%, transparent 75%)", boxShadow: "0 0 24px 4px oklch(0.6 0.2 270 / 0.45)" }}>
            <BookOpen className="size-6 text-white drop-shadow" />
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Welcome back{displayName ? `, ${displayName}` : ""}! 👋</h1>
            <p className="text-sm text-muted-foreground">Select a course folder to access your workspace</p>
          </div>
        </div>
        <div className="flex items-center gap-2"><ThemeToggle /><EngineSettingsModal /></div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button type="button" onClick={() => setDistractionOpen(true)} className="liquid-panel group flex min-h-28 items-center gap-4 rounded-3xl p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:brightness-110" style={{ backgroundColor: "var(--water-gel-bg)", backdropFilter: "blur(var(--liquid-density, 12px)) saturate(180%)", borderTop: "1px solid rgba(255,255,255,.32)" }}>
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-foreground shadow-inner"><ShieldCheck className="size-5" /></span>
          <span><span className="block text-base font-semibold text-foreground">Distraction Mode</span><span className="mt-1 block text-xs text-muted-foreground">Lock the workspace and study without distractions</span></span>
        </button>

        <button type="button" onClick={() => setPomodoroOpen(true)} className="liquid-panel group flex min-h-28 items-center gap-4 rounded-3xl p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:brightness-110" style={{ backgroundColor: "var(--water-gel-bg)", backdropFilter: "blur(var(--liquid-density, 12px)) saturate(180%)", borderTop: "1px solid rgba(255,255,255,.32)" }}>
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-foreground shadow-inner"><Timer className="size-5" /></span>
          <span><span className="block text-base font-semibold text-foreground">Pomodoro</span><span className="mt-1 block text-xs text-muted-foreground">Focus with a timer</span></span>
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-primary" aria-hidden /><h2 className="text-[0.68rem] font-bold uppercase tracking-[0.3em] text-muted-foreground on-stage-muted">Course Folders</h2></div>
        <AddCourseModal onCreate={onCreateCourse} />
      </div>

      {courses.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center"><p className="text-sm font-medium text-foreground on-stage">No courses yet</p><p className="max-w-xs text-xs text-muted-foreground on-stage-muted">Add your first course to start taking notes inside its own glass workspace.</p></div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5">{courses.map((course) => course.id === hiddenCourseId ? <div key={course.id} className="h-52" aria-hidden /> : <CourseCard key={course.id} course={course} noteCount={noteCounts[course.id] ?? 0} lastEditedAt={lastEdited[course.id] ?? null} onOpen={() => onOpenCourse(course.id)} />)}</div>
      )}

      <PomodoroModal open={pomodoroOpen} onOpenChange={setPomodoroOpen} />
      <DistractionMode open={distractionOpen} onOpenChange={(value) => { setDistractionOpen(value); setDistractionActive(readDistractionSession().active); }} />
      {distractionActive && !distractionOpen && <DistractionMode open={false} onOpenChange={() => setDistractionActive(false)} />}
    </div>
  );
}
