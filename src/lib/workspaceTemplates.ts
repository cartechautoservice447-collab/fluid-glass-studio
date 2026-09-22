export type WorkspaceTemplate =
  | "original-glass"
  | "graphite-notes"
  | "frosted-aurora"
  | "midnight-oled";

export const WORKSPACE_TEMPLATE_VALUES: WorkspaceTemplate[] = [
  "original-glass",
  "graphite-notes",
  "frosted-aurora",
  "midnight-oled",
];

export const WORKSPACE_TEMPLATES: Array<{
  id: WorkspaceTemplate;
  name: string;
  description: string;
}> = [
  {
    id: "original-glass",
    name: "Original Glass",
    description: "Keep the current workspace appearance exactly as it is.",
  },
  {
    id: "graphite-notes",
    name: "Graphite Notes",
    description: "Charcoal three-column notes workspace with crisp borders and vivid green actions.",
  },
  {
    id: "frosted-aurora",
    name: "Frosted Aurora",
    description: "Brighter frosted glass with cool cyan highlights and soft depth.",
  },
  {
    id: "midnight-oled",
    name: "Midnight OLED",
    description: "Deep near-black glass with restrained blue accents and high readability.",
  },
];

export const WORKSPACE_TEMPLATE_STORAGE_KEY = "liquid-glass-workspace-template-v1";

export function isWorkspaceTemplate(value: unknown): value is WorkspaceTemplate {
  return (
    typeof value === "string" &&
    WORKSPACE_TEMPLATE_VALUES.includes(value as WorkspaceTemplate)
  );
}

export function workspaceTemplateKey(userId?: string | null): string {
  return userId
    ? `${WORKSPACE_TEMPLATE_STORAGE_KEY}:${userId}`
    : WORKSPACE_TEMPLATE_STORAGE_KEY;
}
