import { BookOpen, History, Timer } from "lucide-react";
import { useState } from "react";
import { AddCourseModal } from "@/components/courses/AddCoursesModal";
import { CourseCard } from "@/components/courses/CourseCard";
import { PomodoroModal } from "@/components/focus/PomodoroModal";
import { OverviewModal } from "@/components/focus/OverviewModal";
import { ReminderCenter } from "@/components/focus/ReminderCenter";
import { EngineSettingsModal } from "@/components/liquid/EngineSettingsModal";
import { ThemeToggle } from "@/components/liquid/ThemeToggle";
import { useCustomization } from "@/context/CustomizationContext";
import type { Course, CourseAccent } from "@/hooks/useCourses";

type Props={courses:Course[];noteCounts:Record<string,number>;lastEdited:Record<string,number|null>;hiddenCourseId:string|null;onOpenCourse:(id:string)=>void;onCreateCourse:(input:{name:string;description:string;color:CourseAccent})=>void;onDeleteCourse:(id:string)=>void;userId:string;email:string|null;onLogout:()=>void};

export function CourseGrid({courses,noteCounts,lastEdited,hiddenCourseId,onOpenCourse,onCreateCourse,onDeleteCourse,userId,email,onLogout}:Props){
  const {displayName}=useCustomization();
  const[pomodoroOpen,setPomodoroOpen]=useState(false),[overviewOpen,setOverviewOpen]=useState(false),[reminderOpen,setReminderOpen]=useState(false);
  const glassActionClass="liquid-panel group flex min-h-24 items-center gap-4 rounded-3xl p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:brightness-110";
  const glassActionStyle={backgroundColor:"var(--water-gel-bg)",backdropFilter:"blur(var(--liquid-density, 12px)) saturate(180%)",borderTop:"1px solid rgba(255,255,255,.32)"};
  const welcomeName=displayName?.trim()||"there";
  return <div className="flex h-full min-h-0 w-full flex-col gap-6 overflow-y-auto px-2 py-2">
    <div className="relative flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-[28px] border border-white/20 bg-white/[0.10] px-5 py-5 shadow-[inset_0_1px_2px_rgba(255,255,255,.35),0_10px_36px_rgba(0,0,0,.22)] backdrop-blur-xl sm:px-6 sm:py-5">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.16] via-transparent to-transparent" aria-hidden/>
      <div className="relative min-w-0 flex-1 py-0.5">
        <h1 className="max-w-full break-words text-[clamp(1.15rem,2.5vw,1.6rem)] font-bold uppercase leading-[1.05] tracking-[clamp(.18em,1.9vw,.34em)] text-foreground">WELCOME BACK, {welcomeName.toUpperCase()}</h1>
        <p className="mt-2 max-w-xl text-xs leading-5 text-muted-foreground sm:text-sm sm:leading-6">Select a course folder to open your notes and study workspace.</p>
      </div>
      <div className="relative flex shrink-0 items-center gap-2">
        <ThemeToggle/>
        <EngineSettingsModal userId={userId}/>
      </div>
    </div>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <button type="button" onClick={()=>setReminderOpen(true)} className={glassActionClass} style={glassActionStyle}><span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-foreground shadow-inner"><BookOpen className="size-5"/></span><span><span className="block text-base font-semibold text-foreground">Study Hub</span><span className="mt-1 block text-xs text-muted-foreground">CS50 lectures</span></span></button>
      <button type="button" onClick={()=>setPomodoroOpen(true)} className={glassActionClass} style={glassActionStyle}><span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-foreground shadow-inner"><Timer className="size-5"/></span><span><span className="block text-base font-semibold text-foreground">Pomodoro</span><span className="mt-1 block text-xs text-muted-foreground">Focus with a timer</span></span></button>
      <button type="button" onClick={()=>setOverviewOpen(true)} className={glassActionClass} style={glassActionStyle}><span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-foreground shadow-inner"><History className="size-5"/></span><span><span className="block text-base font-semibold text-foreground">Overview</span><span className="mt-1 block text-xs text-muted-foreground">All study tools and progress</span></span></button>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-primary" aria-hidden/><h2 className="text-[0.68rem] font-bold uppercase tracking-[0.3em] text-muted-foreground on-stage-muted">Course Folders</h2></div><AddCourseModal onCreate={onCreateCourse}/></div>
    {courses.length===0?<div className="flex flex-1 flex-col items-center justify-center gap-2 text-center"><p className="text-sm font-medium text-foreground on-stage">No courses yet</p><p className="max-w-xs text-xs text-muted-foreground on-stage-muted">Add your first course to start taking notes inside its own glass workspace.</p></div>:<div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5">{courses.map(course=>course.id===hiddenCourseId?<div key={course.id} className="h-52" aria-hidden/>:<CourseCard key={course.id} course={course} noteCount={noteCounts[course.id]??0} lastEditedAt={lastEdited[course.id]??null} onOpen={()=>onOpenCourse(course.id)} onDelete={()=>onDeleteCourse(course.id)}/>)}</div>}
    <PomodoroModal open={pomodoroOpen} onOpenChange={setPomodoroOpen}/><OverviewModal open={overviewOpen} onOpenChange={setOverviewOpen} courses={courses} userId={userId}/><ReminderCenter open={reminderOpen} onOpenChange={setReminderOpen} courses={courses} userId={userId} email={email} onLogout={onLogout}/>
  </div>;
}