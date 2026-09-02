import { useCallback, useEffect, useMemo, useState } from "react";
import { newId, supabase } from "@/lib/supabaseClient";

export type LectureLink = {
  id: string;
  courseId: string;
  title: string;
  url: string;
  createdAt: number;
  updatedAt: number;
};

type LectureLinkRow = {
  id: string;
  course_id: string;
  title: string;
  url: string;
  created_at: string;
  updated_at: string;
};

type StoredLink = Omit<LectureLink, "courseId">;

function localKey(userId: string, courseId: string) {
  return `study-hub-lecture-links:${userId}:${courseId}`;
}

function normalizeUrl(raw: string) {
  const value = raw.trim();
  if (!value) return "";
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

/** Convert common YouTube forms to one stable URL for idempotent saves. */
export function canonicalLectureUrl(raw: string) {
  const normalized = normalizeUrl(raw);
  if (!normalized) return "";
  try {
    const url = new URL(normalized);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      if (id) return `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch") {
        const id = url.searchParams.get("v");
        if (id) return `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;
      }
      const shorts = url.pathname.match(/^\/shorts\/([^/]+)/i)?.[1];
      if (shorts) return `https://www.youtube.com/watch?v=${encodeURIComponent(shorts)}`;
      if (url.pathname === "/playlist") {
        const list = url.searchParams.get("list");
        if (list) return `https://www.youtube.com/playlist?list=${encodeURIComponent(list)}`;
      }
      const embed = url.pathname.match(/^\/embed\/([^/]+)/i)?.[1];
      if (embed) return `https://www.youtube.com/watch?v=${encodeURIComponent(embed)}`;
    }
    return url.toString();
  } catch {
    return normalized;
  }
}

function readLocal(userId: string, courseId: string): LectureLink[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(localKey(userId, courseId)) ?? "[]") as StoredLink[];
    return Array.isArray(parsed)
      ? parsed.map((link) => ({ ...link, courseId }))
      : [];
  } catch {
    return [];
  }
}

function writeLocal(userId: string, courseId: string, links: LectureLink[]) {
  try {
    localStorage.setItem(localKey(userId, courseId), JSON.stringify(links.map(({ courseId: _courseId, ...link }) => link)));
  } catch {
    // localStorage is only a graceful fallback when the cloud table is unavailable.
  }
}

function toLectureLink(row: LectureLinkRow): LectureLink {
  const createdAt = new Date(row.created_at).getTime();
  const updatedAt = new Date(row.updated_at).getTime();
  return {
    id: row.id,
    courseId: row.course_id,
    title: row.title || "Untitled lecture",
    url: row.url,
    createdAt: Number.isFinite(createdAt) ? createdAt : Date.now(),
    updatedAt: Number.isFinite(updatedAt) ? updatedAt : Date.now(),
  };
}

export function useLectureLinks(userId: string, courseId: string | null) {
  const key = useMemo(() => ["lecture-links", userId, courseId], [userId, courseId]);
  const [links, setLinks] = useState<LectureLink[]>(() => (courseId ? readLocal(userId, courseId) : []));
  const [loading, setLoading] = useState(Boolean(courseId));
  const [cloudAvailable, setCloudAvailable] = useState(true);

  const refresh = useCallback(async () => {
    if (!courseId || !userId) {
      setLinks([]);
      setLoading(false);
      setCloudAvailable(true);
      return;
    }
    setLoading(true);
    const { data, error } = await (supabase.from("lecture_links" as never) as unknown as {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          order: (column: string, options: { ascending: boolean }) => Promise<{ data: LectureLinkRow[] | null; error: { message: string } | null }>;
        };
      };
    })
      .select("id,course_id,title,url,created_at,updated_at")
      .eq("course_id", courseId)
      .order("updated_at", { ascending: false });

    if (error) {
      setCloudAvailable(false);
      setLinks(readLocal(userId, courseId));
    } else {
      setCloudAvailable(true);
      const next = (data ?? []).map(toLectureLink);
      setLinks(next);
      writeLocal(userId, courseId, next);
    }
    setLoading(false);
  }, [courseId, userId]);

  useEffect(() => {
    setCloudAvailable(true);
    void refresh();
  }, [refresh]);

  const saveLocal = useCallback((title: string, url: string) => {
    const current = readLocal(userId, courseId!);
    const existing = current.find((link) => link.url === url);
    const now = Date.now();
    const next = existing
      ? current.map((link) => link.id === existing.id ? { ...link, title, updatedAt: now } : link)
      : [{ id: newId(), courseId: courseId!, title, url, createdAt: now, updatedAt: now }, ...current];
    setLinks(next);
    writeLocal(userId, courseId!, next);
    return next.find((link) => link.url === url) ?? null;
  }, [courseId, userId]);

  const saveLink = useCallback(async (title: string, rawUrl: string) => {
    if (!courseId || !userId) return null;
    const url = canonicalLectureUrl(rawUrl);
    if (!url) return null;
    const cleanTitle = title.trim() || "Untitled lecture";

    if (!cloudAvailable) return saveLocal(cleanTitle, url);

    const result = await (supabase.from("lecture_links" as never) as unknown as {
      upsert: (values: Record<string, unknown>, options: { onConflict: string }) => {
        select: (columns: string) => Promise<{ data: LectureLinkRow[] | null; error: { message: string } | null }>;
      };
    }).upsert(
      { id: newId(), user_id: userId, course_id: courseId, title: cleanTitle, url },
      { onConflict: "user_id,course_id,url" },
    ).select("id,course_id,title,url,created_at,updated_at");

    if (result.error) {
      setCloudAvailable(false);
      return saveLocal(cleanTitle, url);
    }

    const saved = result.data?.[0] ? toLectureLink(result.data[0]) : null;
    if (saved) {
      setLinks((current) => {
        const without = current.filter((link) => link.url !== saved.url);
        const next = [saved, ...without];
        writeLocal(userId, courseId, next);
        return next;
      });
    }
    return saved;
  }, [cloudAvailable, courseId, saveLocal, userId]);

  const deleteLink = useCallback(async (id: string) => {
    if (!courseId || !userId) return;
    const previous = links;
    setLinks((current) => current.filter((link) => link.id !== id));
    writeLocal(userId, courseId, previous.filter((link) => link.id !== id));
    if (!cloudAvailable) return;
    const { error } = await (supabase.from("lecture_links" as never) as unknown as {
      delete: () => { eq: (column: string, value: string) => { eq: (column: string, value: string) => Promise<{ error: { message: string } | null }> } };
    }).delete().eq("id", id).eq("course_id", courseId);
    if (error) {
      setLinks(previous);
      writeLocal(userId, courseId, previous);
    }
  }, [cloudAvailable, courseId, links, userId]);

  return { links, loading, cloudAvailable, refresh, saveLink, deleteLink, queryKey: key };
}
