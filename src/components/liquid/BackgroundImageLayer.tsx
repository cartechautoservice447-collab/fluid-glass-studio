import { useEffect, useState } from "react";
const STORAGE_KEY = "liquid-glass-background-image-v1";
const EVENT_NAME = "background-image-change";
export function BackgroundImageLayer() { const [image, setImage] = useState(() => localStorage.getItem(STORAGE_KEY) ?? ""); useEffect(() => { const onChange = (event: Event) => setImage((event as CustomEvent<string>).detail ?? ""); window.addEventListener(EVENT_NAME, onChange); return () => window.removeEventListener(EVENT_NAME, onChange); }, []); if (!image) return null; return <div className="pointer-events-none fixed inset-0 z-[1] bg-cover bg-center bg-no-repeat opacity-[var(--background-opacity,1)]" style={{ backgroundImage: `url(${image})` }} aria-hidden />; }
