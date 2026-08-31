import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";

export type AuthUser = { id:string; email:string|null; user_metadata?:{display_name?:string}|undefined };
type AuthContextValue={user:AuthUser|null;loading:boolean;signInWithPassword:(email:string,password:string)=>Promise<void>;signUpWithPassword:(email:string,password:string,displayName:string)=>Promise<boolean>;signInWithGoogle:()=>Promise<void>;resetPassword:(email:string)=>Promise<void>;updatePassword:(newPassword:string)=>Promise<void>;logout:()=>Promise<void>};
const AuthContext=createContext<AuthContextValue|null>(null);

const ACCOUNT_STORAGE_NAMESPACE="glass-notes-account-state-v1";
const FIXED_ACCOUNT_KEYS=[
  "liquid-glass-performance-mode",
  "liquid-glass-study-reminders",
  "liquid-glass-pomodoro-durations",
  "liquid-glass-pomodoro-session",
  "liquid-glass-background-image-v1",
  "liquid-glass-background-opacity",
  "glass-notes-study-progress-v1",
];
const ACCOUNT_KEY_PREFIXES=["glass-notes-trash-v1:","glass-notes-history-v1:","glass-notes-pomodoro-v1:"];

function isAccountStateKey(key:string){return FIXED_ACCOUNT_KEYS.includes(key)||ACCOUNT_KEY_PREFIXES.some(prefix=>key.startsWith(prefix));}
function accountSlot(userId:string,key:string){return `${ACCOUNT_STORAGE_NAMESPACE}:${userId}:${key}`;}

function switchAccountBrowserState(userId:string|null, previousUserId:string|null){
  if(typeof window==="undefined") return;
  try{
    const keys=Object.keys(localStorage);
    if(previousUserId){
      for(const key of keys){
        if(!isAccountStateKey(key)) continue;
        const value=localStorage.getItem(key);
        if(value!==null) localStorage.setItem(accountSlot(previousUserId,key),value);
      }
    }
    const nextKeys=Object.keys(localStorage);
    for(const key of nextKeys){
      if(isAccountStateKey(key)) localStorage.removeItem(key);
    }
    if(userId){
      const prefix=`${ACCOUNT_STORAGE_NAMESPACE}:${userId}:`;
      for(const key of Object.keys(localStorage)){
        if(!key.startsWith(prefix)) continue;
        const originalKey=key.slice(prefix.length);
        const value=localStorage.getItem(key);
        if(value!==null) localStorage.setItem(originalKey,value);
        localStorage.removeItem(key);
      }
    }
  }catch{
    // Browser storage can be unavailable; Supabase/cloud state remains authoritative.
  }
}

export function AuthProvider({children}:{children:ReactNode}){
  const[user,setUser]=useState<AuthUser|null>(null);const[loading,setLoading]=useState(true);
  useEffect(()=>{
    let active=true;let currentStorageUserId:string|null=null;
    const apply=(sessionUser:typeof currentStorageUserId extends string ? never : {id:string;email?:string|null;user_metadata?:unknown}|null)=>{};
    const syncUser=(nextUser:{id:string;email?:string|null;user_metadata?:unknown}|null)=>{
      if(!active)return;
      const nextId=nextUser?.id??null;
      if(currentStorageUserId!==nextId){switchAccountBrowserState(nextId,currentStorageUserId);currentStorageUserId=nextId;}
      setUser(nextUser?{id:nextUser.id,email:nextUser.email??null,user_metadata:nextUser.user_metadata as {display_name?:string}|undefined}:null);
      setLoading(false);
    };
    void supabase.auth.getSession().then(({data})=>{syncUser(data.session?.user??null);});
    const{data:subscription}=supabase.auth.onAuthStateChange((_event,session)=>syncUser(session?.user??null));
    return()=>{active=false;subscription.subscription.unsubscribe();};
  },[]);
  const value=useMemo<AuthContextValue>(()=>({user,loading,
    async signInWithPassword(email,password){const{error}=await supabase.auth.signInWithPassword({email,password});if(error)throw new Error(error.message);},
    async signUpWithPassword(email,password,displayName){const{data,error}=await supabase.auth.signUp({email,password,options:{data:{display_name:displayName},emailRedirectTo:window.location.origin}});if(error)throw new Error(error.message);return Boolean(data.session);},
    async signInWithGoogle(){const result=await lovable.auth.signInWithOAuth("google",{redirect_uri:window.location.origin});if("error"in result&&result.error)throw new Error(result.error.message);},
    async resetPassword(email){const{error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:`${window.location.origin}/reset-password`});if(error)throw new Error(error.message);},
    async updatePassword(newPassword){const{error}=await supabase.auth.updateUser({password:newPassword});if(error)throw new Error(error.message);},
    async logout(){await supabase.auth.signOut();setUser(null);}
  }),[loading,user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth(){const value=useContext(AuthContext);if(!value)throw new Error("useAuth must be used inside AuthProvider.");return value;}
