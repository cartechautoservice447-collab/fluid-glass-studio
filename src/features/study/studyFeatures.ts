export type StudyFeature = "achievements" | "backup" | "trash" | "toc" | "undoRedo" | "studyMode" | "progress" | "pomodoroStats" | "tags";

export const STUDY_FEATURES: Record<StudyFeature, { title: string; description: string }> = {
  achievements: { title: "Study Achievements", description: "Track milestones and study streaks." },
  backup: { title: "Backup & Restore", description: "Protect courses, collections, and notes with a portable backup." },
  trash: { title: "Recently Deleted", description: "Keep deleted notes recoverable instead of losing them immediately." },
  toc: { title: "Table of Contents", description: "Navigate long notes from their headings." },
  undoRedo: { title: "Undo & Redo", description: "Recover recent note edits safely." },
  studyMode: { title: "Study Mode", description: "Focus on one note with a distraction-free workspace." },
  progress: { title: "Course Progress", description: "See useful activity and completion progress for each course." },
  pomodoroStats: { title: "Pomodoro Statistics", description: "Track focus sessions and time spent studying." },
  tags: { title: "Tags", description: "Organize notes with searchable tags." },
};

const STORAGE_KEY = "glass-notes-study-progress-v1";

type Progress = { streakDays: number; totalFocusMinutes: number; sessions: number; notesCreated: number; achievements: string[] };
const DEFAULT_PROGRESS: Progress = { streakDays: 0, totalFocusMinutes: 0, sessions: 0, notesCreated: 0, achievements: [] };

export function readStudyProgress(): Progress {
  try { return { ...DEFAULT_PROGRESS, ...(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Partial<Progress>) }; } catch { return DEFAULT_PROGRESS; }
}

export function writeStudyProgress(patch: Partial<Progress>) {
  const next = { ...readStudyProgress(), ...patch };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("study-progress-changed"));
  return next;
}

export function getAchievements(progress: Progress) {
  const result: string[] = [];
  if (progress.notesCreated >= 1) result.push("first-note");
  if (progress.notesCreated >= 10) result.push("ten-notes");
  if (progress.sessions >= 5) result.push("five-sessions");
  if (progress.totalFocusMinutes >= 300) result.push("five-hours");
  if (progress.streakDays >= 3) result.push("three-day-streak");
  return result;
}
