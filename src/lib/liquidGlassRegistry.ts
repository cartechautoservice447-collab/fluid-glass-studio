export type GlassBoxDescriptor = {
  id: string;
  element: HTMLElement;
  r: number;
  bezel: number;
};

type MeasuredGlassBox = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
  bezel: number;
};

const registry = new Map<string, GlassBoxDescriptor>();
let nextId = 0;
let geometryDirty = true;
let listenersAttached = false;
const cachedBoxes: MeasuredGlassBox[] = [];
const observers = new Map<string, ResizeObserver>();

function markDirty() {
  geometryDirty = true;
}

function ensureGlobalListeners() {
  if (listenersAttached || typeof window === "undefined") return;
  listenersAttached = true;
  window.addEventListener("resize", markDirty, { passive: true });
  window.addEventListener("scroll", markDirty, { capture: true, passive: true });
}

function removeGlobalListenersIfUnused() {
  if (!listenersAttached || registry.size > 0 || typeof window === "undefined") return;
  window.removeEventListener("resize", markDirty);
  window.removeEventListener("scroll", markDirty, { capture: true });
  listenersAttached = false;
}

export function createGlassId(prefix = "glass") {
  nextId += 1;
  return `${prefix}-${nextId}`;
}

export function markGlassGeometryDirty() {
  markDirty();
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
  ensureGlobalListeners();
  markDirty();

  if (typeof ResizeObserver !== "undefined") {
    const observer = new ResizeObserver(markDirty);
    observer.observe(element);
    observers.get(id)?.disconnect();
    observers.set(id, observer);
  }

  return () => {
    const current = registry.get(id);
    if (current?.element === element) {
      registry.delete(id);
      observers.get(id)?.disconnect();
      observers.delete(id);
      markDirty();
      removeGlobalListenersIfUnused();
    }
  };
}

export function updateGlassElement(id: string, options: { radius?: number; bezel?: number }) {
  const current = registry.get(id);
  if (!current) return;
  if (options.radius !== undefined) current.r = options.radius;
  if (options.bezel !== undefined) current.bezel = options.bezel;
  markDirty();
}

function activeModalRoots(): HTMLElement[] {
  if (typeof document === "undefined") return [];

  return Array.from(document.querySelectorAll<HTMLElement>('[data-liquid-glass-surface="true"][data-state="open"]'));
}

function activeModalOverlayExists(): boolean {
  if (typeof document === "undefined") return false;
  return Boolean(document.querySelector('[data-liquid-glass-modal-overlay][data-state="open"]'));
}

function belongsToActiveModal(element: HTMLElement, roots: HTMLElement[], overlayOpen: boolean) {
  if (!roots.length && !overlayOpen) return true;

  if (roots.some((root) => root === element || root.contains(element))) return true;
  if (overlayOpen && element.closest('[data-liquid-glass-modal-overlay][data-state="open"]')) return true;

  return false;
}

function measure() {
  cachedBoxes.length = 0;

  if (typeof window === "undefined") return;

  const viewportHeight = window.innerHeight;
  const modalRoots = activeModalRoots();
  const overlayOpen = activeModalOverlayExists();

  for (const descriptor of registry.values()) {
    const element = descriptor.element;
    if (!element.isConnected) continue;
    if (!belongsToActiveModal(element, modalRoots, overlayOpen)) continue;

    const style = window.getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden") continue;

    const rect = element.getBoundingClientRect();
    if (rect.width <= 1 || rect.height <= 1) continue;
    if (rect.bottom < -100 || rect.top > viewportHeight + 100) continue;

    cachedBoxes.push({
      id: descriptor.id,
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      w: rect.width,
      h: rect.height,
      r: Math.min(descriptor.r, rect.width / 2, rect.height / 2),
      bezel: descriptor.bezel,
    });
  }

  geometryDirty = false;
}

export function getGlassBoxes(): MeasuredGlassBox[] {
  if (geometryDirty) measure();
  return cachedBoxes;
}

export function clearGlassRegistry() {
  for (const observer of observers.values()) observer.disconnect();
  observers.clear();
  registry.clear();
  cachedBoxes.length = 0;
  geometryDirty = true;
  removeGlobalListenersIfUnused();
}
