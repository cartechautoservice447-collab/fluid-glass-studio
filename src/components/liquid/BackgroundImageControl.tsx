import { ImagePlus, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "liquid-glass-background-image-v1";
const EVENT_NAME = "background-image-change";
const MAX_BYTES = 5 * 1024 * 1024;

export function BackgroundImageControl() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      setImage(localStorage.getItem(STORAGE_KEY) ?? "");
    } catch {
      setImage("");
    }
  }, []);

  useEffect(() => {
    const apply = (value: string) => {
      document.documentElement.style.setProperty("--custom-background-image", value ? `url(${value})` : "none");
    };
    apply(image);
    const onChange = (event: Event) => {
      const value = (event as CustomEvent<string>).detail ?? "";
      setImage(value);
      apply(value);
    };
    window.addEventListener(EVENT_NAME, onChange);
    return () => window.removeEventListener(EVENT_NAME, onChange);
  }, [image]);

  const update = (value: string) => {
    setError("");
    try {
      if (value) localStorage.setItem(STORAGE_KEY, value);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      setError("The image is too large for browser storage.");
      return;
    }
    setImage(value);
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: value }));
  };

  const handleFile = (file: File | undefined) => {
    setError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image must be 5 MB or smaller.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => update(String(reader.result));
    reader.onerror = () => setError("Could not read that image.");
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3 rounded-2xl border border-white/20 bg-white/5 p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl border border-white/15 bg-white/10"><ImagePlus className="size-4" /></div>
        <div><p className="text-sm font-medium text-foreground">Background Image</p><p className="mt-1 text-xs text-muted-foreground">Upload a personal image behind the liquid-glass interface. Your glass panels stay on top.</p></div>
      </div>
      {image && <div className="overflow-hidden rounded-xl border border-white/15 bg-black/10"><img src={image} alt="Current background preview" className="h-28 w-full object-cover" /></div>}
      <div className="flex gap-2">
        <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={(event) => handleFile(event.target.files?.[0])} />
        <button type="button" onClick={() => inputRef.current?.click()} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-xs font-semibold text-foreground backdrop-blur-xl transition hover:bg-white/20"><ImagePlus className="size-4" />{image ? "Change image" : "Upload image"}</button>
        {image && <button type="button" onClick={() => update("")} className="flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-xs font-semibold text-foreground backdrop-blur-xl transition hover:bg-white/20"><RotateCcw className="size-4" />Reset</button>}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <p className="text-[10px] text-muted-foreground">Stored locally on this browser · PNG, JPG, WEBP and other browser-supported image formats · 5 MB max.</p>
    </div>
  );
}
