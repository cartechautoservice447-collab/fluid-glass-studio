export type BackgroundPresetId =
  | "classic"
  | "aurora-luxe"
  | "emerald-sapphire"
  | "royal-violet"
  | "arctic-amethyst";

export type BackgroundPreset = {
  id: BackgroundPresetId;
  label: string;
  description: string;
  preview: string;
  baseStops: Array<[number, string]>;
  radials: Array<{ x: number; y: number; radius: number; color: string; alpha: number }>;
};

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: "classic",
    label: "Current WebGL",
    description: "Keep the existing animated light scene.",
    preview: "linear-gradient(135deg,#17171c,#0f172a 48%,#241041)",
    baseStops: [[0, "#1a1a1a"], [1, "#0f0f15"]],
    radials: [],
  },
  {
    id: "aurora-luxe",
    label: "Aurora Luxe",
    description: "Purple + emerald + sapphire — static 2K.",
    preview:
      "radial-gradient(circle at 18% 10%,#7647ff 0%,transparent 44%),radial-gradient(circle at 84% 28%,#00c98d 0%,transparent 40%),radial-gradient(circle at 72% 90%,#2368ff 0%,transparent 48%),linear-gradient(145deg,#090f1d,#10234d 52%,#24144e)",
    baseStops: [
      [0, "#090f1d"],
      [0.52, "#10234d"],
      [1, "#24144e"],
    ],
    radials: [
      { x: 18, y: 10, radius: 60, color: "#7647ff", alpha: 0.78 },
      { x: 84, y: 28, radius: 58, color: "#00c98d", alpha: 0.68 },
      { x: 72, y: 90, radius: 64, color: "#2368ff", alpha: 0.78 },
    ],
  },
  {
    id: "emerald-sapphire",
    label: "Emerald Sapphire",
    description: "Deep emerald, cyan and royal violet.",
    preview:
      "radial-gradient(circle at 82% 16%,#00c2a8 0%,transparent 42%),radial-gradient(circle at 12% 62%,#2e6bff 0%,transparent 44%),radial-gradient(circle at 76% 88%,#7436ff 0%,transparent 46%),linear-gradient(145deg,#061519,#083d55 50%,#0a1233)",
    baseStops: [
      [0, "#061519"],
      [0.5, "#083d55"],
      [1, "#0a1233"],
    ],
    radials: [
      { x: 82, y: 16, radius: 62, color: "#00c2a8", alpha: 0.72 },
      { x: 12, y: 62, radius: 64, color: "#2e6bff", alpha: 0.78 },
      { x: 76, y: 88, radius: 62, color: "#7436ff", alpha: 0.72 },
    ],
  },
  {
    id: "royal-violet",
    label: "Royal Violet",
    description: "Luxury indigo and violet with a cool cyan lift.",
    preview:
      "radial-gradient(circle at 20% 16%,#8b5cf6 0%,transparent 43%),radial-gradient(circle at 78% 48%,#4f46e5 0%,transparent 46%),radial-gradient(circle at 42% 92%,#22d3ee 0%,transparent 44%),linear-gradient(145deg,#0e071b,#2a124f 52%,#11143b)",
    baseStops: [
      [0, "#0e071b"],
      [0.52, "#2a124f"],
      [1, "#11143b"],
    ],
    radials: [
      { x: 20, y: 16, radius: 62, color: "#8b5cf6", alpha: 0.72 },
      { x: 78, y: 48, radius: 64, color: "#4f46e5", alpha: 0.7 },
      { x: 42, y: 92, radius: 62, color: "#22d3ee", alpha: 0.58 },
    ],
  },
  {
    id: "arctic-amethyst",
    label: "Arctic Amethyst",
    description: "Sapphire blue, amethyst and soft magenta.",
    preview:
      "radial-gradient(circle at 12% 18%,#38bdf8 0%,transparent 42%),radial-gradient(circle at 82% 20%,#a855f7 0%,transparent 44%),radial-gradient(circle at 58% 88%,#ec4899 0%,transparent 48%),linear-gradient(145deg,#081522,#173c72 52%,#3a154e)",
    baseStops: [
      [0, "#081522"],
      [0.52, "#173c72"],
      [1, "#3a154e"],
    ],
    radials: [
      { x: 12, y: 18, radius: 62, color: "#38bdf8", alpha: 0.66 },
      { x: 82, y: 20, radius: 64, color: "#a855f7", alpha: 0.7 },
      { x: 58, y: 88, radius: 64, color: "#ec4899", alpha: 0.52 },
    ],
  },
];

export function getBackgroundPreset(id: string): BackgroundPreset {
  return BACKGROUND_PRESETS.find((preset) => preset.id === id) ?? BACKGROUND_PRESETS[0];
}

export function drawBackgroundPreset(
  canvas: HTMLCanvasElement,
  id: BackgroundPresetId,
) {
  canvas.width = 2048;
  canvas.height = 1152;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const preset = getBackgroundPreset(id);
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  preset.baseStops.forEach(([offset, color]) => gradient.addColorStop(offset, color));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  preset.radials.forEach(({ x, y, radius, color, alpha }) => {
    const px = (x / 100) * canvas.width;
    const py = (y / 100) * canvas.height;
    const r = (radius / 100) * Math.max(canvas.width, canvas.height);
    const radial = ctx.createRadialGradient(px, py, 0, px, py, r);
    radial.addColorStop(0, color);
    radial.addColorStop(Math.max(0, Math.min(0.72, 0.48)), `rgba(0,0,0,0)`);
    radial.addColorStop(1, `rgba(0,0,0,0)`);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  });

  ctx.globalAlpha = 1;
}
