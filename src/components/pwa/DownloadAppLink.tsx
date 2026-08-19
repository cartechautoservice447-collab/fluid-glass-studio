import { Link } from "@tanstack/react-router";

export function DownloadAppLink() {
  return (
    <Link
      to="/download-app"
      className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-xl transition hover:bg-white/[0.1]"
    >
      Download App
    </Link>
  );
}
