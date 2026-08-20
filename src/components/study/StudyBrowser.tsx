import { ArrowLeft, ArrowRight, ExternalLink, Lock, RefreshCw, Search } from "lucide-react";
import { useMemo, useState } from "react";

type Props = {
  allowedDomains?: string[];
  initialUrl?: string;
};

const DEFAULT_ALLOWED_DOMAINS = [
  "developer.mozilla.org",
  "docs.python.org",
  "docs.github.com",
  "freecodecamp.org",
  "cs50.harvard.edu",
  "w3schools.com",
];

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:") return null;
    return url;
  } catch {
    return null;
  }
}

function isAllowed(url: URL, domains: string[]) {
  const host = url.hostname.toLowerCase();
  return domains.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

export function StudyBrowser({ allowedDomains = DEFAULT_ALLOWED_DOMAINS, initialUrl = "" }: Props) {
  const [address, setAddress] = useState(initialUrl);
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [forward, setForward] = useState<string[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

  const allowed = useMemo(() => allowedDomains.map((domain) => domain.toLowerCase()), [allowedDomains]);

  const openUrl = (raw: string, pushHistory = true) => {
    const url = normalizeUrl(raw);
    if (!url) {
      setError("Only secure HTTPS study URLs are allowed.");
      return;
    }
    if (!isAllowed(url, allowed)) {
      setError("This website is not on the study allowlist.");
      return;
    }
    if (pushHistory && currentUrl) setHistory((items) => [...items, currentUrl]);
    setForward([]);
    setError("");
    const value = url.toString();
    setAddress(value);
    setCurrentUrl(value);
  };

  const goBack = () => {
    const previous = history.at(-1);
    if (!previous) return;
    setHistory((items) => items.slice(0, -1));
    if (currentUrl) setForward((items) => [currentUrl, ...items]);
    setAddress(previous);
    setCurrentUrl(previous);
    setError("");
  };

  const goForward = () => {
    const next = forward[0];
    if (!next) return;
    setForward((items) => items.slice(1));
    if (currentUrl) setHistory((items) => [...items, currentUrl]);
    setAddress(next);
    setCurrentUrl(next);
    setError("");
  };

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] border border-white/15 bg-black/[0.16] shadow-2xl backdrop-blur-2xl">
      <header className="flex shrink-0 items-center gap-2 border-b border-white/10 p-3">
        <button type="button" onClick={goBack} disabled={!history.length} className="rounded-xl p-2 disabled:opacity-30" aria-label="Back"><ArrowLeft className="size-4" /></button>
        <button type="button" onClick={goForward} disabled={!forward.length} className="rounded-xl p-2 disabled:opacity-30" aria-label="Forward"><ArrowRight className="size-4" /></button>
        <button type="button" onClick={() => setReloadKey((key) => key + 1)} disabled={!currentUrl} className="rounded-xl p-2 disabled:opacity-30" aria-label="Reload"><RefreshCw className="size-4" /></button>
        <form className="flex min-w-0 flex-1" onSubmit={(event) => { event.preventDefault(); openUrl(address); }}>
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2">
            <Lock className="size-3.5 shrink-0 text-emerald-300" />
            <input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Enter an approved study URL" className="min-w-0 flex-1 bg-transparent text-xs outline-none" aria-label="Study URL" />
            <button type="submit" className="rounded-lg p-1.5 hover:bg-white/10" aria-label="Open study URL"><Search className="size-3.5" /></button>
          </div>
        </form>
        {currentUrl && <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="rounded-xl p-2" aria-label="Open study page in browser"><ExternalLink className="size-4" /></a>}
      </header>

      {error && <div className="shrink-0 border-b border-white/10 px-4 py-2 text-xs text-amber-200">{error}</div>}

      <div className="min-h-0 flex-1 bg-white">
        {currentUrl ? (
          <iframe key={reloadKey} title="Study browser" src={currentUrl} className="h-full w-full border-0" sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts" referrerPolicy="no-referrer" />
        ) : (
          <div className="flex h-full items-center justify-center p-8 text-center text-sm text-slate-500"><div><Lock className="mx-auto mb-3 size-8" /><p className="font-medium">Study Browser</p><p className="mt-1 text-xs">Only HTTPS URLs from the configured study allowlist can open here.</p></div></div>
        )}
      </div>
    </section>
  );
}
