import { FileText, Folder } from "lucide-react";
import { motion } from "motion/react";

import { useCustomization } from "@/context/CustomizationContext";
import type { Course } from "@/hooks/useCourses";

const ACCENT_COLOR: Record<Course["color"], string> = {
  sky: "oklch(0.75 0.14 235)",
  violet: "oklch(0.7 0.19 300)",
  amber: "oklch(0.8 0.16 80)",
  emerald: "oklch(0.75 0.16 155)",
  rose: "oklch(0.72 0.18 15)",
  cyan: "oklch(0.78 0.13 200)",
};

type Props = {
  course: Course;
  noteCount: number;
  onOpen: () => void;
};

/**
 * Shares `layoutId={course-shell-<id>}` with the fullscreen panel rendered in
 * routes/index.tsx. When the card unmounts (course opened) and the fullscreen
 * panel mounts with the same layoutId, Motion automatically morphs one into
 * the other instead of a hard cut.
 */
export function CourseCard({ course, noteCount, onOpen }: Props) {
  const { liquid } = useCustomization();
  const gel = liquid.gel / 100;
  const accent = ACCENT_COLOR[course.color] ?? ACCENT_COLOR.sky;

  return (
    <motion.button
      type="button"
      layoutId={`course-shell-${course.id}`}
      onClick={onOpen}
      whileHover={{ scale: 1.03, y: -6 }}
      whileTap={{ scale: 0.97 }}
      transition={{
        type: "spring",
        stiffness: liquid.bounceStiffness,
        damping: liquid.bounceDamping,
      }}
      style={{
        backgroundColor: "var(--water-gel-bg)",
        backdropFilter: "blur(var(--liquid-density, 12px)) saturate(200%) contrast(105%)",
        borderRadius: `${18 + gel * 26}px`,
        borderTop: "1px solid rgba(255, 255, 255, 0.4)",
        boxShadow:
          "inset 0 1px 2px 0 rgba(255, 255, 255, 0.5), inset 0 -2px 4px 0 rgba(0, 0, 0, 0.25), 0 8px 32px 0 rgba(0, 0, 0, 0.37)",
      }}
      className="liquid-panel group relative flex h-48 w-full flex-col justify-between overflow-hidden p-5 text-left"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit]"
        style={{
          background: `radial-gradient(140% 100% at 0% 0%, color-mix(in oklab, ${accent} 35%, transparent) 0%, transparent 60%)`,
        }}
      />
      <span
        aria-hidden
        className="liquid-veil pointer-events-none absolute inset-0 -z-10 rounded-[inherit]"
      />

      <div className="flex items-start justify-between">
        <span
          className="flex size-11 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `color-mix(in oklab, ${accent} 55%, transparent)` }}
        >
          <Folder className="size-5 text-white drop-shadow" />
        </span>
        <span className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[0.65rem] font-medium text-foreground">
          <FileText className="size-3" />
          {noteCount}
        </span>
      </div>

      <div className="min-w-0">
        <h3 className="truncate text-base font-semibold text-foreground">{course.name}</h3>
        {course.description && (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {course.description}
          </p>
        )}
      </div>
    </motion.button>
  );
}
