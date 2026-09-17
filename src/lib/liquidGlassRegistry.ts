export type GlassBoxDescriptor = {
  id: string;
  element: HTMLElement;
  r: number;
  bezel: number;
};

const registry = new Map<string, GlassBoxDescriptor>();
let nextId = 0;

export function createGlassId(prefix = "glass") {
  nextId += 1;
  return `${prefix}-${nextId}`;
}

export function registerGlassElement(
  id: string,
  element: HTMLElement,
  options: { radius?: number; bezel?: number } = {},
) {
  registry.set(id, {
    id,
    element,
    r: options.radius ?? 28,
    bezel: options.bezel ?? 45,
  });

  return () => {
    const current = registry.get(id);
    if (current?.element === element) registry.delete(id);
  };
}

export function updateGlassElement(id: string, options: { radius?: number; bezel?: number }) {
  const current = registry.get(id);
  if (!current) return;
  if (options.radius !== undefined) current.r = options.radius;
  if (options.bezel !== undefined) current.bezel = options.bezel;
}

export function getGlassBoxes(): Omit<GlassBoxDescriptor, "element"> & {
  x: number;
  y: number;
  w: number;
  h: number;
}[] {
  const boxes = [];

  for (const descriptor of registry.values()) {
    const element = descriptor.element;
    if (!element.isConnected) continue;
    const style = window.getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden") continue;

    const rect = element.getBoundingClientRect();
    if (rect.width <= 1 || rect.height <= 1) continue;

    boxes.push({
      id: descriptor.id,
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      w: rect.width,
      h: rect.height,
      r: Math.min(descriptor.r, rect.width / 2, rect.height / 2),
      bezel: descriptor.bezel,
    });
  }

  return boxes;
}

export function clearGlassRegistry() {
  registry.clear();
}
