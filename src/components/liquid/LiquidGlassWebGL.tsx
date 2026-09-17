import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, type ReactNode, type RefObject } from "react";
import * as THREE from "three";
import { exactStudioFragmentShader, exactStudioVertexShader } from "@/shaders/exactLiquidGlassShader";

type GlassBoxRegistration = {
  id: string;
  element: HTMLElement;
  radius: number;
  bezel: number;
};

type LiquidGlassContextValue = {
  register: (entry: GlassBoxRegistration) => () => void;
};

const LiquidGlassContext = createContext<LiquidGlassContextValue | null>(null);
const MAX_BOXES = 64;
const DEFAULTS = { thick: 50, bezel: 55, ior: 3, blur: 1.5, spec: 0.55, tint: 0.08, shadow: 0.5, dispersion: 1.9 };
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function readNumber(name: string, fallback: number) {
  if (typeof document === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : fallback;
}

function getShaderParams() {
  return {
    thick: clamp(readNumber("--glass-thickness", DEFAULTS.thick), 10, 100),
    bezel: clamp(readNumber("--glass-bezel", DEFAULTS.bezel), 8, 120),
    ior: clamp(readNumber("--glass-ior", DEFAULTS.ior), 1, 5),
    blur: clamp(readNumber("--glass-blur", DEFAULTS.blur), 0, 20),
    spec: clamp(readNumber("--glass-specular", DEFAULTS.spec), 0, 1),
    tint: clamp(readNumber("--glass-tint", DEFAULTS.tint), 0, 0.5),
    shadow: clamp(readNumber("--glass-shadow", DEFAULTS.shadow), 0, 1),
    dispersion: clamp(readNumber("--glass-dispersion", DEFAULTS.dispersion), 0, 5),
  };
}

function getPerformanceMode(): "high" | "ultra" {
  if (typeof document === "undefined") return "ultra";
  return document.documentElement.dataset["glassPerformance"] === "high" ? "high" : "ultra";
}

function isDarkTheme() {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark") || document.documentElement.classList.contains("pure-black");
}

export function useLiquidGlassBox(ref: RefObject<HTMLElement | null>, options: { id: string; radius?: number; bezel?: number }) {
  const context = useContext(LiquidGlassContext);
  const radius = options.radius ?? 40;
  const bezel = options.bezel ?? 45;

  useEffect(() => {
    const element = ref.current;
    if (!element || !context) return;
    return context.register({ id: options.id, element, radius, bezel });
  }, [context, options.id, radius, bezel, ref]);
}

type LiquidGlassContextBridgeProps = {
  children: (args: { ref: RefObject<HTMLElement | null>; registrationId: string }) => ReactNode;
  idPrefix: string;
  radius?: number;
  bezel?: number;
};

export function LiquidGlassContextBridge({ children, idPrefix, radius = 40, bezel = 45 }: LiquidGlassContextBridgeProps) {
  const ref = useRef<HTMLElement | null>(null);
  const generatedId = useId().replace(/:/g, "-");
  const registrationId = `${idPrefix}-${generatedId}`;
  useLiquidGlassBox(ref, { id: registrationId, radius, bezel });
  return children({ ref, registrationId });
}

export function LiquidGlassProvider({ children }: { children: ReactNode }) {
  const registrations = useRef(new Map<string, GlassBoxRegistration>());
  const register = useCallback((entry: GlassBoxRegistration) => {
    registrations.current.set(entry.id, entry);
    return () => {
      const current = registrations.current.get(entry.id);
      if (current?.element === entry.element) registrations.current.delete(entry.id);
    };
  }, []);
  const value = useMemo(() => ({ register }), [register]);

  return (
    <LiquidGlassContext.Provider value={value}>
      {children}
      <LiquidGlassCanvas registrations={registrations} />
    </LiquidGlassContext.Provider>
  );
}

function LiquidGlassCanvas({ registrations }: { registrations: RefObject<Map<string, GlassBoxRegistration>> }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer;
    material: THREE.ShaderMaterial;
    fgScene: THREE.Scene;
    fgCamera: THREE.OrthographicCamera;
    bgScene: THREE.Scene;
    bgCamera: THREE.PerspectiveCamera;
    renderTarget: THREE.WebGLRenderTarget;
    orbGroup: THREE.Group;
    orbGeometries: THREE.SphereGeometry[];
    orbMaterials: THREE.MeshPhysicalMaterial[];
    wallGeometry: THREE.PlaneGeometry;
    wallMaterial: THREE.MeshStandardMaterial;
    planeGeometry: THREE.PlaneGeometry;
    boxes: THREE.Vector4[];
    radii: Float32Array;
    bezels: Float32Array;
    rafId: number;
    dark: boolean;
  } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
    } catch (error) {
      console.warn("WebGL initialization failed:", error);
      return;
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const performance = getPerformanceMode();
    const pixelRatio = performance === "ultra" ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    const rtScale = performance === "ultra" ? 1 : 0.75;
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height);

    const bgScene = new THREE.Scene();
    const bgCamera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    bgCamera.position.z = 5;

    const wallGeometry = new THREE.PlaneGeometry(100, 100);
    const wallMaterial = new THREE.MeshStandardMaterial({ color: "#0f0f15", roughness: 1 });
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.z = -10;
    bgScene.add(wall);

    const orbGroup = new THREE.Group();
    bgScene.add(orbGroup);
    const orbGeometries: THREE.SphereGeometry[] = [];
    const orbMaterials: THREE.MeshPhysicalMaterial[] = [];

    const createOrb = (color: string, x: number, y: number, z: number, size: number) => {
      const geometry = new THREE.SphereGeometry(size, 64, 64);
      const material = new THREE.MeshPhysicalMaterial({ color, emissive: color, emissiveIntensity: 0.5, roughness: 0.1, metalness: 0.8, clearcoat: 1, clearcoatRoughness: 0.1 });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      mesh.userData = { baseX: x, baseY: y, baseZ: z };
      orbGroup.add(mesh);
      orbGeometries.push(geometry);
      orbMaterials.push(material);
    };

    createOrb("#ff0055", -3, 2, -4, 1.5);
    createOrb("#00d0ff", 4, -1, -5, 2);
    createOrb("#7000ff", -2, -3, -6, 1.8);
    createOrb("#ffaa00", 2, 3, -8, 2.5);

    const ambient = new THREE.AmbientLight("#ffffff", 0.5);
    const pointLight = new THREE.PointLight("#ffffff", 2, 50);
    pointLight.position.set(0, 5, 5);
    bgScene.add(ambient, pointLight);

    const updateTheme = (dark: boolean) => {
      if (dark) {
        bgScene.background = new THREE.Color("#1a1a1a");
        wallMaterial.color.set("#0f0f15");
        ambient.intensity = 0.5;
        pointLight.intensity = 2;
        const colors = ["#ff0055", "#00d0ff", "#7000ff", "#ffaa00"];
        orbMaterials.forEach((material, index) => {
          const color = colors[index % colors.length];
          material.color.set(color);
          material.emissive.set(color);
          material.emissiveIntensity = 0.5;
          material.roughness = 0.1;
          material.metalness = 0.8;
        });
      } else {
        bgScene.background = new THREE.Color("#f4f4f7");
        wallMaterial.color.set("#ebebf0");
        ambient.intensity = 0.95;
        pointLight.intensity = 2.2;
        const colors = ["#ff0055", "#00b4d8", "#7b2cbf", "#ff9e00"];
        orbMaterials.forEach((material, index) => {
          const color = colors[index % colors.length];
          material.color.set(color);
          material.emissive.set(color);
          material.emissiveIntensity = 0.35;
          material.roughness = 0.15;
          material.metalness = 0.3;
        });
      }
    };

    const renderTarget = new THREE.WebGLRenderTarget(Math.max(1, Math.round(width * rtScale)), Math.max(1, Math.round(height * rtScale)), { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat });
    const fgScene = new THREE.Scene();
    const fgCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const boxes = Array.from({ length: MAX_BOXES }, () => new THREE.Vector4());
    const radii = new Float32Array(MAX_BOXES);
    const bezels = new Float32Array(MAX_BOXES);
    const params = getShaderParams();

    const material = new THREE.ShaderMaterial({
      vertexShader: exactStudioVertexShader,
      fragmentShader: exactStudioFragmentShader,
      uniforms: {
        uResolution: { value: new THREE.Vector2(width, height) },
        uBoxes: { value: boxes },
        uRadii: { value: radii },
        uBezels: { value: bezels },
        uBoxCount: { value: 0 },
        uFixedTopBoxIdx: { value: -1 },
        uTime: { value: 0 },
        uThickness: { value: params.thick },
        uIOR: { value: params.ior },
        uDispersion: { value: params.dispersion },
        uBlur: { value: params.blur },
        uSpecular: { value: params.spec },
        uTint: { value: params.tint },
        uShadow: { value: params.shadow },
        uBgTex: { value: renderTarget.texture },
        uBgAspect: { value: width / height },
        uRenderBg: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });

    const planeGeometry = new THREE.PlaneGeometry(2, 2);
    fgScene.add(new THREE.Mesh(planeGeometry, material));

    const state = { renderer, material, fgScene, fgCamera, bgScene, bgCamera, renderTarget, orbGroup, orbGeometries, orbMaterials, wallGeometry, wallMaterial, planeGeometry, boxes, radii, bezels, rafId: 0, dark: isDarkTheme() };
    stateRef.current = state;
    updateTheme(state.dark);

    const renderLoop = (time: number) => {
      const current = stateRef.current;
      if (!current) return;

      const dark = isDarkTheme();
      if (dark !== current.dark) {
        current.dark = dark;
        updateTheme(dark);
      }

      current.orbGroup.children.forEach((child, index) => {
        const base = child.userData as { baseX: number; baseY: number; baseZ: number };
        child.position.x = base.baseX + Math.cos(time * 0.0012 + index) * 0.25;
        child.position.y = base.baseY + Math.sin(time * 0.001 + index) * 0.4;
        child.position.z = base.baseZ;
      });

      current.renderer.setRenderTarget(current.renderTarget);
      current.renderer.render(current.bgScene, current.bgCamera);

      let count = 0;
      let fixedDockIndex = -1;
      const entries = Array.from(registrations.current.values()).slice(0, MAX_BOXES);
      for (const entry of entries) {
        const rect = entry.element.getBoundingClientRect();
        if (rect.width <= 1 || rect.height <= 1) continue;
        current.boxes[count].set(rect.left + rect.width / 2, rect.top + rect.height / 2, rect.width, rect.height);
        current.radii[count] = entry.radius;
        current.bezels[count] = entry.bezel;
        if (entry.id === "dock") fixedDockIndex = count;
        count += 1;
      }
      for (let index = count; index < MAX_BOXES; index += 1) {
        current.boxes[index].set(0, 0, 0, 0);
        current.radii[index] = 0;
        current.bezels[index] = 0;
      }

      const shaderParams = getShaderParams();
      current.material.uniforms.uBoxCount.value = count;
      current.material.uniforms.uBoxes.value = current.boxes;
      current.material.uniforms.uRadii.value = current.radii;
      current.material.uniforms.uBezels.value = current.bezels;
      current.material.uniforms.uFixedTopBoxIdx.value = fixedDockIndex;
      current.material.uniforms.uThickness.value = shaderParams.thick;
      current.material.uniforms.uIOR.value = shaderParams.ior;
      current.material.uniforms.uDispersion.value = shaderParams.dispersion;
      current.material.uniforms.uBlur.value = shaderParams.blur;
      current.material.uniforms.uSpecular.value = shaderParams.spec;
      current.material.uniforms.uTint.value = shaderParams.tint;
      current.material.uniforms.uShadow.value = shaderParams.shadow;
      current.material.uniforms.uTime.value = time * 0.001;

      current.renderer.setRenderTarget(null);
      current.renderer.render(current.fgScene, current.fgCamera);
      current.rafId = requestAnimationFrame(renderLoop);
    };

    state.rafId = requestAnimationFrame(renderLoop);

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const mode = getPerformanceMode();
      const ratio = mode === "ultra" ? Math.min(window.devicePixelRatio || 1, 2) : 1;
      const scale = mode === "ultra" ? 1 : 0.75;
      renderer.setPixelRatio(ratio);
      renderer.setSize(w, h);
      renderTarget.setSize(Math.max(1, Math.round(w * scale)), Math.max(1, Math.round(h * scale)));
      material.uniforms.uResolution.value.set(w, h);
      material.uniforms.uBgAspect.value = w / h;
      bgCamera.aspect = w / h;
      bgCamera.updateProjectionMatrix();
    };

    window.addEventListener("resize", handleResize);
    const onPerformanceChange = () => handleResize();
    window.addEventListener("glass-performance-changed", onPerformanceChange);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("glass-performance-changed", onPerformanceChange);
      if (state.rafId) cancelAnimationFrame(state.rafId);
      material.dispose();
      planeGeometry.dispose();
      renderTarget.dispose();
      wallGeometry.dispose();
      wallMaterial.dispose();
      orbGeometries.forEach((geometry) => geometry.dispose());
      orbMaterials.forEach((orbMaterial) => orbMaterial.dispose());
      renderer.dispose();
      stateRef.current = null;
    };
  }, [registrations]);

  return <canvas ref={canvasRef} id="liquid-glass-webgl-canvas" aria-hidden="true" className="pointer-events-none fixed inset-0 h-full w-full" style={{ zIndex: 20 }} />;
}
