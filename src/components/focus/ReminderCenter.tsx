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
  { label: "Lecture 0 · Scratch", url: "https://www.youtube.com/embed/UuIEbpQms8o", embeddable: true },
  { label: "Lecture 1 · C", url: "https://www.youtube.com/embed/SlqjA04_dpk", embeddable: true },
  { label: "cs50.harvard.edu ↗", url: "https://cs50.harvard.edu", embeddable: false },
  { label: "cs50.dev ↗", url: "https://cs50.dev", embeddable: false },
  { label: "cs50.ai ↗", url: "https://cs50.ai", embeddable: false },
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

  useEffect(() => {
    if (!activeCourseId || !courses.some((course) => course.id === activeCourseId)) {
      setActiveCourseId(courses[0]?.id ?? null);
    }
  }, [courses, activeCourseId]);

  if (!open) return null;

  const activeCourse = courses.find((course) => course.id === activeCourseId) ?? null;

  const openLink = (link: Cs50Link) => {
    if (link.embeddable) {
      setBrowserUrl(link.url);
      setUrlInput(link.url);
      setIframeKey((k) => k + 1);
    } else {
      window.open(link.url, "_blank", "noopener,noreferrer");
    }
  };

  const loadCustomUrl = () => {
    const embeddableUrl = toEmbeddableUrl(urlInput);
    if (!embeddableUrl) return;
    setBrowserUrl(embeddableUrl);
    setUrlInput(embeddableUrl);
    setIframeKey((k) => k + 1);
  };

  return (
    <div className="fixed inset-0 z-[150] flex flex-col bg-black/70 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4 sm:px-8">
        <div className="flex items-center gap-3"><BookOpen className="size-5" /><div><h2 className="text-lg font-semibold text-foreground">Study Hub</h2><p className="text-xs text-muted-foreground">CS50 lectures{notesOpen ? " · Notes" : ""}</p></div></div>
        <div className="flex items-center gap-2">
          {courses.length > 0 && <button type="button" onClick={() => setNotesOpen((value) => !value)} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium ${notesOpen ? "border-white/40 bg-white/15 text-foreground" : "border-white/10 bg-white/[.03] text-muted-foreground hover:bg-white/10"}`}><NotebookPen className="size-3.5" />{notesOpen ? "Hide Notes" : "Open Notes"}</button>}
          <button type="button" onClick={() => onOpenChange(false)} aria-label="Close Study Hub" className="rounded-full p-2 text-muted-foreground hover:bg-white/10"><X className="size-5" /></button>
        </div>
      </div>

      {notesOpen && courses.length > 0 && (
        <div className="flex shrink-0 items-center gap-2 border-b border-white/10 px-5 py-3 sm:px-8">
          <span className="text-xs text-muted-foreground">Course:</span>
          <select value={activeCourseId ?? ""} onChange={(event) => setActiveCourseId(event.target.value || null)} className="min-w-0 rounded-xl border border-white/10 bg-white/[.05] px-3 py-1.5 text-xs text-foreground outline-none">
            {courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}
          </select>
        </div>
      )}

      <div className={`min-h-0 flex-1 ${notesOpen && activeCourse ? "grid grid-cols-1 md:grid-cols-2" : "flex flex-col"}`}>
        <div className="flex min-h-0 flex-col border-r border-white/10">
          <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-white/10 px-5 py-3 sm:px-8">
            <div className="flex flex-wrap items-center gap-2">
              {CS50_LINKS.map((link) => <button key={link.url} onClick={() => openLink(link)} className={`rounded-xl border px-3 py-1.5 text-xs font-medium ${link.embeddable && browserUrl === link.url ? "border-white/40 bg-white/15 text-foreground" : "border-white/10 bg-white/[.03] text-muted-foreground"}`}>{link.label}</button>)}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 border-b border-white/10 px-5 py-3 sm:px-8">
            <input value={urlInput} onChange={(e) => setUrlInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") loadCustomUrl(); }} placeholder="Paste a YouTube or embeddable video/lecture URL" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs outline-none" />
            <button onClick={loadCustomUrl} className="shrink-0 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-medium">Go</button>
          </div>
          <div className="min-h-0 flex-1 bg-black">
            <iframe key={iframeKey} src={browserUrl} title="CS50 lecture viewer" className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
          </div>
        </div>

        {notesOpen && activeCourse ? (
          <div className="min-h-0 overflow-hidden p-2 md:p-3">
            <CourseNotesView course={activeCourse} userId={userId} email={email} onLogout={onLogout} onBack={() => setNotesOpen(false)} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
