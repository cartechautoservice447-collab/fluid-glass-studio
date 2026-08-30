import { BookOpen, NotebookPen, X } from "lucide-react";
import { useEffect, useState } from "react";

import { CourseNotesView } from "@/components/courses/CourseNotesView";
import type { Course } from "@/hooks/useCourses";

type Cs50Link = { label: string; url: string; embeddable: boolean };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: Course[];
  userId: string;
  email: string | null;
  onLogout: () => void;
};

const CS50_LINKS: Cs50Link[] = [
  { label: "CS50 Lectures (YouTube)", url: "https://www.youtube.com/embed/videoseries?list=PLhQjrBD2T381WAHyx1pq-sBfykqMBI7V4", embeddable: true },
];

function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function toEmbeddableUrl(raw: string): string | null {
  const normalized = normalizeUrl(raw);
  if (!normalized) return null;

  try {
    const url = new URL(normalized);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch") {
        const videoId = url.searchParams.get("v");
        if (!videoId) return normalized;
        const embed = new URL(`https://www.youtube.com/embed/${encodeURIComponent(videoId)}`);
        const playlistId = url.searchParams.get("list");
        if (playlistId) embed.searchParams.set("list", playlistId);
        return embed.toString();
      }
      const shortsMatch = url.pathname.match(/^\/shorts\/([^/]+)/i);
      if (shortsMatch?.[1]) return `https://www.youtube.com/embed/${encodeURIComponent(shortsMatch[1])}`;
      const embedMatch = url.pathname.match(/^\/embed\/([^/]+)/i);
      if (embedMatch?.[1]) return normalized;
      if (url.pathname === "/playlist") {
        const playlistId = url.searchParams.get("list");
        return playlistId ? `https://www.youtube.com/embed/videoseries?list=${encodeURIComponent(playlistId)}` : normalized;
      }
    }

    if (host === "youtu.be") {
      const videoId = url.pathname.split("/").filter(Boolean)[0];
      if (videoId) {
        const embed = new URL(`https://www.youtube.com/embed/${encodeURIComponent(videoId)}`);
        const playlistId = url.searchParams.get("list");
        if (playlistId) embed.searchParams.set("list", playlistId);
        return embed.toString();
      }
    }

    return normalized;
  } catch {
    return normalized;
  }
}

export function ReminderCenter({ open, onOpenChange, courses, userId, email, onLogout }: Props) {
  const [browserUrl, setBrowserUrl] = useState(CS50_LINKS[0].url);
  const [urlInput, setUrlInput] = useState("");
  const [iframeKey, setIframeKey] = useState(0);
  const [notesOpen, setNotesOpen] = useState(false);
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [splitRatio, setSplitRatio] = useState(50);

  useEffect(() => {
    if (!activeCourseId || !courses.some((course) => course.id === activeCourseId)) {
      setActiveCourseId(courses[0]?.id ?? null);
    }
  }, [courses, activeCourseId]);

  if (!open) return null;

  const activeCourse = courses.find((course) => course.id === activeCourseId) ?? null;

  const loadCustomUrl = () => {
    const embeddableUrl = toEmbeddableUrl(urlInput);
    if (!embeddableUrl) return;
    setBrowserUrl(embeddableUrl);
    setUrlInput(embeddableUrl);
    setIframeKey((k) => k + 1);
  };

  const adjustSplit = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.parentElement?.getBoundingClientRect();
    if (!rect || !notesOpen || !activeCourse) return;
    const next = ((event.clientX - rect.left) / rect.width) * 100;
    setSplitRatio(Math.min(75, Math.max(25, next)));
  };

  return (
    <div className="fixed inset-0 z-[150] flex flex-col bg-black/70 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="flex shrink-0 items-center gap-2 border-b border-white/10 px-3 py-2 sm:px-4">
        <div className="flex shrink-0 items-center gap-1.5"><BookOpen className="size-3.5" /><h2 className="text-xs font-semibold text-foreground">Study Hub</h2></div>
        <div className="flex min-w-0 flex-1 items-center gap-1.5"><input value={urlInput} onChange={(e) => setUrlInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") loadCustomUrl(); }} placeholder="Paste URL" aria-label="Lecture URL" className="min-w-0 flex-1 rounded-md border border-white/10 bg-black/20 px-2 py-1 text-[11px] outline-none" /><button type="button" onClick={loadCustomUrl} className="shrink-0 rounded-md border border-white/15 bg-white/10 px-2 py-1 text-[11px] font-medium">Go</button></div>
        {courses.length > 0 && <button type="button" onClick={() => setNotesOpen((value) => !value)} className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium ${notesOpen ? "border-white/40 bg-white/15 text-foreground" : "border-white/10 bg-white/[.03] text-muted-foreground hover:bg-white/10"}`}><NotebookPen className="size-3" />Note Editor</button>}
        <button type="button" onClick={() => onOpenChange(false)} aria-label="Close Study Hub" className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-white/10"><X className="size-3.5" /></button>
      </div>

      {notesOpen && courses.length > 0 && <div className="flex shrink-0 items-center gap-2 border-b border-white/10 px-3 py-1.5 sm:px-4"><span className="text-[10px] text-muted-foreground">Course</span><select value={activeCourseId ?? ""} onChange={(event) => setActiveCourseId(event.target.value || null)} className="min-w-0 max-w-xs rounded-md border border-white/10 bg-white/[.05] px-2 py-1 text-[11px] text-foreground outline-none">{courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}</select></div>}

      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="flex h-full" onPointerMove={(event) => { if ((event.currentTarget as HTMLElement).dataset.resizing === "true") adjustSplit(event as unknown as React.PointerEvent<HTMLDivElement>); }} onPointerUp={(event) => { (event.currentTarget as HTMLElement).dataset.resizing = "false"; }} onPointerLeave={(event) => { if ((event.currentTarget as HTMLElement).dataset.resizing === "true") adjustSplit(event as unknown as React.PointerEvent<HTMLDivElement>); }}>
          <div className="flex min-h-0 min-w-0 flex-col" style={{ width: notesOpen && activeCourse ? `${splitRatio}%` : "100%" }}><div className="min-h-0 flex-1 bg-black"><iframe key={iframeKey} src={browserUrl} title="CS50 lecture viewer" className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div></div>
          {notesOpen && activeCourse ? <>
            <div role="separator" aria-label="Resize lecture and note editor panes" aria-orientation="vertical" tabIndex={0} className="group relative z-10 w-2 shrink-0 cursor-col-resize bg-white/[.04] hover:bg-white/[.12] focus:bg-white/[.15]" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); const parent = event.currentTarget.parentElement; if (parent) parent.dataset.resizing = "true"; }} onKeyDown={(event) => { if (event.key === "ArrowLeft") setSplitRatio((value) => Math.max(25, value - 5)); if (event.key === "ArrowRight") setSplitRatio((value) => Math.min(75, value + 5)); }}><span className="absolute left-1/2 top-1/2 h-16 w-px -translate-x-1/2 -translate-y-1/2 bg-white/20 transition group-hover:bg-white/45" /></div>
            <div className="min-h-0 min-w-0 flex-1 overflow-hidden p-2 md:p-3"><CourseNotesView course={activeCourse} userId={userId} email={email} onLogout={onLogout} onBack={() => setNotesOpen(false)} studyHubMode /></div>
          </> : null}
        </div>
      </div>
    </div>
  );
}
