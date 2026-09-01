import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { runLegacyMigrationOnce } from "@/lib/legacyMigration";
import { newId, supabase } from "@/lib/supabaseClient";

export const COURSE_ACCENTS=["sky","violet","amber","emerald","rose","cyan"] as const;
export type CourseAccent=(typeof COURSE_ACCENTS)[number];
export type Course={id:string;name:string;description:string;color:CourseAccent;createdAt:number};
type CourseRow={id:string;name:string;description:string|null;color:string|null;created_at:string};
const EMPTY:Course[]=[];
function toCourse(row:CourseRow):Course{const color=(COURSE_ACCENTS as readonly string[]).includes(row.color??"")?(row.color as CourseAccent):COURSE_ACCENTS[0];const createdAt=new Date(row.created_at).getTime();return{id:row.id,name:row.name,description:row.description??"",color,createdAt:Number.isFinite(createdAt)?createdAt:Date.now()};}

export function useCourses(userId:string){
  const qc=useQueryClient();
  const queryKey=useMemo(()=>["courses",userId],[userId]);
  const migrationStarted=useMemo(()=>Boolean(userId),[userId]);
  useEffect(()=>{if(!userId)return;void runLegacyMigrationOnce(userId).then(()=>{void qc.invalidateQueries({queryKey});});},[userId,qc,queryKey]);
  const q=useQuery({queryKey,enabled:migrationStarted,queryFn:async()=>{const{data,error}=await supabase.from("courses").select("id,name,description,color,created_at").order("created_at",{ascending:false});if(error)throw error;return((data??[])as CourseRow[]).map(toCourse);}});
  const courses=q.data??EMPTY;
  const patch=useCallback((u:(p:Course[])=>Course[])=>qc.setQueryData<Course[]>(queryKey,p=>u(p??[])),[qc,queryKey]);
  const write=useMutation({mutationFn:async(p:{op:"insert"|"update"|"delete";id:string;values?:Record<string,unknown>})=>{if(p.op==="insert"){const{error}=await supabase.from("courses").insert({id:p.id,user_id:userId,...p.values}as never);if(error)throw error;return;}if(p.op==="update"){const{error}=await supabase.from("courses").update({...p.values,updated_at:new Date().toISOString()}).eq("id",p.id);if(error)throw error;return;}const{error}=await supabase.from("courses").delete().eq("id",p.id);if(error)throw error;},onSettled:()=>{void qc.invalidateQueries({queryKey});void qc.invalidateQueries({queryKey:["course-stats",userId]});}});
  const addCourse=useCallback((input:{name:string;description?:string;color?:CourseAccent})=>{const name=input.name.trim();if(!name||!userId)return null;const course={id:newId(),name,description:input.description?.trim()??"",color:input.color??COURSE_ACCENTS[0],createdAt:Date.now()};const prev=courses;patch(p=>[course,...p]);write.mutate({op:"insert",id:course.id,values:{name:course.name,description:course.description,color:course.color}},{onError:()=>qc.setQueryData(queryKey,prev)});return course.id;},[userId,patch,write,courses,qc,queryKey]);
  const renameCourse=useCallback((id:string,p:Partial<Omit<Course,"id"|"createdAt">>)=>{const prev=courses;patch(a=>a.map(c=>c.id===id?{...c,...p}:c));const values:Record<string,unknown>={};if(p.name!==undefined)values["name"]=p.name;if(p.description!==undefined)values["description"]=p.description;if(p.color!==undefined)values["color"]=p.color;if(Object.keys(values).length)write.mutate({op:"update",id,values},{onError:()=>qc.setQueryData(queryKey,prev)});},[courses,patch,write,qc,queryKey]);
  const deleteCourse=useCallback((id:string)=>{const prev=courses;patch(a=>a.filter(c=>c.id!==id));write.mutate({op:"delete",id},{onError:()=>qc.setQueryData(queryKey,prev)});},[courses,patch,write,qc,queryKey]);
  return{courses,hydrated:Boolean(userId)&&!q.isLoading,addCourse,renameCourse,deleteCourse};
}

export function useCourseStats(userId:string){return useQuery({queryKey:["course-stats",userId],enabled:Boolean(userId),queryFn:async()=>{const{data,error}=await supabase.from("notes").select("course_id,updated_at");if(error)throw error;const counts:Record<string,number>={},lastEdited:Record<string,number|null>={};for(const row of(data??[])as{course_id:string;updated_at:string}[]){const ts=new Date(row.updated_at).getTime();counts[row.course_id]=(counts[row.course_id]??0)+1;lastEdited[row.course_id]=Math.max(lastEdited[row.course_id]??0,ts);}return{counts,lastEdited};}});}
