import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";

export type Theme = "light" | "dark";
export type UITextClarity = "default" | "smooth" | "medium" | "punchy";
export type BackgroundPreset = "classic" | "aurora-luxe" | "emerald-sapphire" | "royal-violet" | "arctic-amethyst";
const BACKGROUND_PRESET_VALUES: BackgroundPreset[] = ["classic", "aurora-luxe", "emerald-sapphire", "royal-violet", "arctic-amethyst"];

const UI_TEXT_CLARITY_VALUES: UITextClarity[] = ["default", "smooth", "medium", "punchy"];
const isUITextClarity = (value: unknown): value is UITextClarity =>
  typeof value === "string" && UI_TEXT_CLARITY_VALUES.includes(value as UITextClarity);

type Ctx = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  displayName: string;
  setDisplayName: (name: string) => void;
  pureBlack: boolean;
  setPureBlack: (value: boolean) => void;
  backgroundThemeEnabled: boolean;
  setBackgroundThemeEnabled: (value: boolean) => void;
  backgroundOpacity: number;
  setBackgroundOpacity: (value: number) => void;
  fullDarkBackground: boolean;
  setFullDarkBackground: (value: boolean) => void;
  backgroundPreset: BackgroundPreset;
  setBackgroundPreset: (value: BackgroundPreset) => void;
  uiTextClarity: UITextClarity;
  setUITextClarity: (value: UITextClarity) => void;
};

const CustomizationContext = createContext<Ctx | null>(null);

const LEGACY_KEYS = {
  theme: "liquid-glass-theme-v1",
  displayName: "liquid-glass-display-name-v1",
  pureBlack: "liquid-glass-pure-black-v1",
  backgroundTheme: "liquid-glass-background-theme-v1",
  backgroundOpacity: "liquid-glass-background-opacity-v1",
  fullDarkBackground: "liquid-glass-full-dark-background-v1",
  backgroundPreset: "liquid-glass-background-preset-v1",
  uiTextClarity: "liquid-glass-ui-text-clarity-v1",
};

const scoped = (key: string, userId: string) => `${key}:${userId}`;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function readBool(key: string, userId: string, fallback = false) {
  if (typeof window === "undefined") return fallback;
  try {
    return ((userId ? localStorage.getItem(scoped(key, userId)) : null) ?? localStorage.getItem(key)) === "1";
  } catch {
    return fallback;
  }
}

function readNumber(key: string, userId: string, fallback: number, min: number, max: number) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = (userId ? localStorage.getItem(scoped(key, userId)) : null) ?? localStorage.getItem(key);
    const value = Number(raw ?? fallback);
    return Number.isFinite(value) ? clamp(value, min, max) : fallback;
  } catch {
    return fallback;
  }
}

function readBackgroundPreset(key: string, userId: string): BackgroundPreset | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = (userId ? localStorage.getItem(scoped(key, userId)) : null) ?? localStorage.getItem(key);
    return typeof raw === "string" && BACKGROUND_PRESET_VALUES.includes(raw as BackgroundPreset) ? raw as BackgroundPreset : null;
  } catch {
    return null;
  }
}

function readUITextClarity(key: string, userId: string): UITextClarity | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = (userId ? localStorage.getItem(scoped(key, userId)) : null) ?? localStorage.getItem(key);
    return isUITextClarity(raw) ? raw : null;
  } catch {
    return null;
  }
}

function initialTheme(userId: string): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const value = (userId ? localStorage.getItem(scoped(LEGACY_KEYS.theme, userId)) : null) ?? localStorage.getItem(LEGACY_KEYS.theme);
    return value === "dark" || value === "light"
      ? value
      : window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
  } catch {
    return "light";
  }
}

function initialName(userId: string) {
  if (typeof window === "undefined") return "";
  try {
    return (userId ? localStorage.getItem(scoped(LEGACY_KEYS.displayName, userId)) : null) ??
      localStorage.getItem(LEGACY_KEYS.displayName) ??
      "";
  } catch {
    return "";
  }
}

export function CustomizationProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [profileReady, setProfileReady] = useState(false);
  const [theme, setThemeState] = useState<Theme>("light");
  const [displayName, setDisplayNameState] = useState("");
  const [pureBlack, setPureBlackState] = useState(false);
  const [backgroundThemeEnabled, setBackgroundThemeEnabledState] = useState(false);
  const [backgroundOpacity, setBackgroundOpacityState] = useState(100);
  const [fullDarkBackground, setFullDarkBackgroundState] = useState(false);
  const [backgroundPreset, setBackgroundPresetState] = useState<BackgroundPreset>("classic");
  const [uiTextClarity, setUITextClarityState] = useState<UITextClarity>("default");

  useEffect(() => {
    let active = true;

    const load = async (id: string | null) => {
      setUserId(id);
      setProfileReady(false);

      const localTheme = initialTheme(id ?? "");
      const localName = initialName(id ?? "");
      const localBlack = readBool(LEGACY_KEYS.pureBlack, id ?? "", false);
      const localBackgroundTheme = readBool(LEGACY_KEYS.backgroundTheme, id ?? "", false);
      const localBackgroundOpacity = readNumber(LEGACY_KEYS.backgroundOpacity, id ?? "", 100, 0, 100);
      const localFullDarkBackground = readBool(LEGACY_KEYS.fullDarkBackground, id ?? "", false);
      const localBackgroundPreset = readBackgroundPreset(LEGACY_KEYS.backgroundPreset, id ?? "");
      const localUITextClarity = readUITextClarity(LEGACY_KEYS.uiTextClarity, id ?? "");

      setThemeState(localTheme);
      setDisplayNameState(localName);
      setPureBlackState(localBlack);
      setBackgroundThemeEnabledState(localBackgroundTheme);
      setBackgroundOpacityState(localBackgroundOpacity);
      setFullDarkBackgroundState(localFullDarkBackground);
      setBackgroundPresetState(localBackgroundPreset ?? "classic");
      setUITextClarityState(localUITextClarity ?? "default");

      if (!id) {
        setProfileReady(true);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("theme,display_name,pure_black,background_theme_enabled,background_opacity,full_dark_background,background_preset,ui_text_clarity")
          .eq("id", id)
          .maybeSingle();

        if (!active) return;
        if (error) {
          console.warn("Could not load cloud customization", error);
          setProfileReady(true);
          return;
        }

        if (data) {
          if (!localStorage.getItem(scoped(LEGACY_KEYS.theme, id)) && (data.theme === "light" || data.theme === "dark")) {
            setThemeState(data.theme);
          }
          if (!localStorage.getItem(scoped(LEGACY_KEYS.displayName, id)) && typeof data.display_name === "string") {
            setDisplayNameState(data.display_name);
          }
          if (!localStorage.getItem(scoped(LEGACY_KEYS.pureBlack, id)) && typeof data.pure_black === "boolean") {
            setPureBlackState(data.pure_black);
          }
          if (!localStorage.getItem(scoped(LEGACY_KEYS.backgroundTheme, id)) && typeof data.background_theme_enabled === "boolean") {
            setBackgroundThemeEnabledState(data.background_theme_enabled);
          }
          if (!localStorage.getItem(scoped(LEGACY_KEYS.backgroundOpacity, id)) && data.background_opacity != null) {
            setBackgroundOpacityState(clamp(Number(data.background_opacity), 0, 100));
          }
          if (!localStorage.getItem(scoped(LEGACY_KEYS.fullDarkBackground, id)) && typeof data.full_dark_background === "boolean") {
            setFullDarkBackgroundState(data.full_dark_background);
          }
          if (!localStorage.getItem(scoped(LEGACY_KEYS.backgroundPreset, id)) && typeof data.background_preset === "string" && BACKGROUND_PRESET_VALUES.includes(data.background_preset as BackgroundPreset)) {
            setBackgroundPresetState(data.background_preset as BackgroundPreset);
          }
          if (!localStorage.getItem(scoped(LEGACY_KEYS.uiTextClarity, id)) && isUITextClarity(data.ui_text_clarity)) {
            setUITextClarityState(data.ui_text_clarity);
          }
        }
      } catch (error) {
        console.warn("Could not load cloud customization", error);
      } finally {
        if (active) setProfileReady(true);
      }
    };

    void supabase.auth.getUser().then(({ data }) => load(data.user?.id ?? null)).catch(() => load(null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => void load(session?.user?.id ?? null));

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
    if (!userId || !profileReady) return;
    try { localStorage.setItem(scoped(LEGACY_KEYS.theme, userId), theme); } catch {}
    const timer = window.setTimeout(() => { void supabase.from("profiles").upsert({ id: userId, theme }); }, 150);
    return () => window.clearTimeout(timer);
  }, [theme, userId, profileReady]);

  useEffect(() => {
    if (!userId || !profileReady) return;
    try { localStorage.setItem(scoped(LEGACY_KEYS.displayName, userId), displayName); } catch {}
    const timer = window.setTimeout(() => { void supabase.from("profiles").upsert({ id: userId, display_name: displayName || null }); }, 250);
    return () => window.clearTimeout(timer);
  }, [displayName, userId, profileReady]);

  useEffect(() => {
    document.documentElement.classList.toggle("pure-black", pureBlack);
    if (!userId || !profileReady) return;
    try { localStorage.setItem(scoped(LEGACY_KEYS.pureBlack, userId), pureBlack ? "1" : "0"); } catch {}
    const timer = window.setTimeout(() => { void supabase.from("profiles").upsert({ id: userId, pure_black: pureBlack }); }, 150);
    return () => window.clearTimeout(timer);
  }, [pureBlack, userId, profileReady]);

  useEffect(() => {
    document.documentElement.dataset["backgroundTheme"] = backgroundThemeEnabled ? "on" : "off";
    document.documentElement.dataset["backgroundPreset"] = backgroundThemeEnabled ? backgroundPreset : "classic";
    document.documentElement.dataset["fullDarkBackground"] = backgroundThemeEnabled && fullDarkBackground ? "on" : "off";
    document.documentElement.style.setProperty("--background-opacity", `${backgroundOpacity / 100}`);
    if (!userId || !profileReady) return;
    try {
      localStorage.setItem(scoped(LEGACY_KEYS.backgroundTheme, userId), backgroundThemeEnabled ? "1" : "0");
      localStorage.setItem(scoped(LEGACY_KEYS.backgroundOpacity, userId), String(backgroundOpacity));
      localStorage.setItem(scoped(LEGACY_KEYS.fullDarkBackground, userId), fullDarkBackground ? "1" : "0");
    } catch {}
    const timer = window.setTimeout(() => {
      void supabase.from("profiles").upsert({
        id: userId,
        background_theme_enabled: backgroundThemeEnabled,
        background_opacity: backgroundOpacity,
        full_dark_background: fullDarkBackground,
        background_preset: backgroundPreset,
      });
    }, 150);
    return () => window.clearTimeout(timer);
  }, [backgroundThemeEnabled, backgroundOpacity, fullDarkBackground, backgroundPreset, userId, profileReady]);

  useEffect(() => {
    document.documentElement.dataset["uiTextClarity"] = uiTextClarity;
    if (!userId || !profileReady) return;
    try { localStorage.setItem(scoped(LEGACY_KEYS.uiTextClarity, userId), uiTextClarity); } catch {}
    const timer = window.setTimeout(() => { void supabase.from("profiles").upsert({ id: userId, ui_text_clarity: uiTextClarity }); }, 150);
    return () => window.clearTimeout(timer);
  }, [uiTextClarity, userId, profileReady]);

  const value = useMemo<Ctx>(() => ({
    theme,
    setTheme: setThemeState,
    toggleTheme: () => setThemeState((previous) => previous === "dark" ? "light" : "dark"),
    displayName,
    setDisplayName: (name) => setDisplayNameState(name.trim().slice(0, 40)),
    pureBlack,
    setPureBlack: (value) => {
      if (value) setThemeState("dark");
      setPureBlackState(value);
    },
    backgroundThemeEnabled,
    setBackgroundThemeEnabled: setBackgroundThemeEnabledState,
    backgroundOpacity,
    setBackgroundOpacity: (value) => setBackgroundOpacityState(clamp(value, 0, 100)),
    fullDarkBackground,
    setFullDarkBackground: setFullDarkBackgroundState,
    backgroundPreset,
    setBackgroundPreset: (value) => {
      if (!BACKGROUND_PRESET_VALUES.includes(value)) return;
      setBackgroundPresetState(value);
      if (value !== "classic") setBackgroundThemeEnabledState(true);
    },
    uiTextClarity,
    setUITextClarity: setUITextClarityState,
  }), [theme, displayName, pureBlack, backgroundThemeEnabled, backgroundOpacity, fullDarkBackground, backgroundPreset, uiTextClarity]);

  return <CustomizationContext.Provider value={value}>{children}</CustomizationContext.Provider>;
}

const FALLBACK_CTX: Ctx = {
  theme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
  displayName: "",
  setDisplayName: () => {},
  pureBlack: false,
  setPureBlack: () => {},
  backgroundThemeEnabled: false,
  setBackgroundThemeEnabled: () => {},
  backgroundOpacity: 100,
  setBackgroundOpacity: () => {},
  fullDarkBackground: false,
  setFullDarkBackground: () => {},
  backgroundPreset: "classic",
  setBackgroundPreset: () => {},
  uiTextClarity: "default",
  setUITextClarity: () => {},
};

export function useCustomization() {
  const context = useContext(CustomizationContext);
  if (!context) {
    if (import.meta.env.DEV) console.warn("useCustomization used outside CustomizationProvider, using defaults");
    return FALLBACK_CTX;
  }
  return context;
}
