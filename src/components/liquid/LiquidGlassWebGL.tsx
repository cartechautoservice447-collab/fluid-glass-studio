import React, { useEffect, useRef } from "react";
import * as THREE from "three";

import { exactStudioFragmentShader, exactStudioVertexShader } from "@/shaders/exactLiquidGlassShader";
import { getGlassBoxes } from "@/lib/liquidGlassRegistry";

type PerformanceMode = "high" | "ultra";

type GlassParams = {
  thick: number;
  ior: number;
  blur: number;
  spec: number;
  tint: number;
  shadow: number;
  dispersion: number;
  bezel: number;
};

const DEFAULT_PARAMS: GlassParams = {
  thick: 50,
  bezel: 55,
  ior: 3,
  blur: 1.5,
  spec: 0.55,
  tint: 0.08,
  shadow: 0.5,
  dispersion: 1.9,
};

const SETTINGS_KEY = "liquid-glass-webgl-settings-v1";
const PERFORMANCE_EVENT = "glass-performance-changed";
const SETTINGS_EVENT = "liquid-glass-settings-changed";

function readParams(): GlassParams {
  if (typeof window === "undefined") return DEFAULT_PARAMS;
  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null") as Partial<GlassParams> | null;
    return { ...DEFAULT_PARAMS, ...(raw ?? {}) };
  } catch {
    return DEFAULT_PARAMS;
  }
}

function readPerformance(): PerformanceMode {
  if (typeof document === "undefined") return "ultra";
  return document.documentElement.dataset.glassPerformance === "high" ? "high" : "ultra";
}

function isLightTheme() {
  if (typeof document === "undefined") return false;
  return !document.documentElement.classList.contains("dark");
}

export function LiquidGlassWebGL() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const paramsRef = useRef<GlassParams>(readParams());
  const performanceRef = useRef<PerformanceMode>(readPerformance());
  const themeRef = useRef(isLightTheme());
  const threeRef = useRef<{
    renderer: THREE.WebGLRenderer;
    material: THREE.ShaderMaterial;
    bgScene: THREE.Scene;
    bgCamera: THREE.PerspectiveCamera;
    renderTarget: THREE.WebGLRenderTarget;
    orbGroup: THREE.Group;
    orbGeometries: THREE.SphereGeometry[];
    orbMaterials: THREE.MeshPhysicalMaterial[];
    wallGeo: THREE.PlaneGeometry;
    wallMat: THREE.MeshStandardMaterial;
    rafId: number;
  } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch (error) {
      console.warn("WebGL Liquid Glass initialization failed:", error);
      return;
    }

    const performance = performanceRef.current;
    const pixelRatio = performance === "ultra" ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    const rtScale = performance === "ultra" ? 1 : 0.75;
    const width = window.innerWidth;
    const height = window.innerHeight;

    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height);

    const bgScene = new THREE.Scene();
    bgScene.background = new THREE.Color("#1a1a1a");

    const bgCamera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    bgCamera.position.z = 5;

    const wallGeo = new THREE.PlaneGeometry(100, 100);
    const wallMat = new THREE.MeshStandardMaterial({ color: "#0f0f15", roughness: 1 });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.z = -10;
    bgScene.add(wall);

    const orbGroup = new THREE.Group();
    bgScene.add(orbGroup);

    const orbGeometries: THREE.SphereGeometry[] = [];
    const orbMaterials: THREE.MeshPhysicalMaterial[] = [];
    const orbMeshes: THREE.Mesh[] = [];

    const createOrb = (color: string, x: number, y: number, z: number, size: number) => {
      const geometry = new THREE.SphereGeometry(size, 64, 64);
      const material = new THREE.MeshPhysicalMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.5,
        roughness: 0.1,
        metalness: 0.8,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      mesh.userData = { baseX: x, baseY: y, baseZ: z };
      orbGroup.add(mesh);
      orbMeshes.push(mesh);
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

    const updateTheme = (light: boolean) => {
      if (light) {
        bgScene.background = new THREE.Color("#f4f4f7");
        wallMat.color.set("#ebebf0");
        ambient.intensity = 0.95;
        pointLight.intensity = 2.2;
        const colors = ["#ff0055", "#00b4d8", "#7b2cbf", "#ff9e00"];
        orbMeshes.forEach((mesh, index) => {
          const material = mesh.material as THREE.MeshPhysicalMaterial;
          const color = colors[index % colors.length];
          material.color.set(color);
          material.emissive.set(color);
          material.emissiveIntensity = 0.35;
          material.roughness = 0.15;
          material.metalness = 0.3;
        });
      } else {
        bgScene.background = new THREE.Color("#1a1a1a");
        wallMat.color.set("#0f0f15");
        ambient.intensity = 0.5;
        pointLight.intensity = 2;
        const colors = ["#ff0055", "#00d0ff", "#7000ff", "#ffaa00"];
        orbMeshes.forEach((mesh, index) => {
          const material = mesh.material as THREE.MeshPhysicalMaterial;
          const color = colors[index % colors.length];
          material.color.set(color);
          material.emissive.set(color);
          material.emissiveIntensity = 0.5;
          material.roughness = 0.1;
          material.metalness = 0.8;
        });
      }
    };

    updateTheme(themeRef.current);

    const renderTarget = new THREE.WebGLRenderTarget(
      Math.max(1, Math.round(width * rtScale)),
      Math.max(1, Math.round(height * rtScale)),
      { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat },
    );

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const boxVectors = Array.from({ length: 64 }, () => new THREE.Vector4());
    const radiiArray = new Float32Array(64);
    const bezelsArray = new Float32Array(64);

    const material = new THREE.ShaderMaterial({
      vertexShader: exactStudioVertexShader,
      fragmentShader: exactStudioFragmentShader,
      uniforms: {
        uResolution: { value: new THREE.Vector2(width, height) },
        uBoxes: { value: boxVectors },
        uRadii: { value: radiiArray },
        uBezels: { value: bezelsArray },
        uBoxCount: { value: 0 },
        uFixedTopBoxIdx: { value: -1 },
        uTime: { value: 0 },
        uThickness: { value: paramsRef.current.thick },
        uIOR: { value: paramsRef.current.ior },
        uDispersion: { value: paramsRef.current.dispersion },
        uBlur: { value: paramsRef.current.blur },
        uSpecular: { value: paramsRef.current.spec },
        uTint: { value: paramsRef.current.tint },
        uShadow: { value: paramsRef.current.shadow },
        uRenderBg: { value: 1 },
        uBgTex: { value: renderTarget.texture },
        uBgAspect: { value: width / height },
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });

    const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(plane);

    threeRef.current = {
      renderer,
      material,
      bgScene,
      bgCamera,
      renderTarget,
      orbGroup,
      orbGeometries,
      orbMaterials,
      wallGeo,
      wallMat,
      rafId: 0,
    };

    const renderLoop = (time: number) => {
      const current = threeRef.current;
      if (!current) return;

      current.orbGroup.children.forEach((child, index) => {
        const base = child.userData as { baseX: number; baseY: number; baseZ: number };
        child.position.x = base.baseX + Math.cos(time * 0.0012 + index) * 0.25;
        child.position.y = base.baseY + Math.sin(time * 0.001 + index) * 0.4;
        child.position.z = base.baseZ;
      });

      current.renderer.setRenderTarget(current.renderTarget);
      current.renderer.render(current.bgScene, current.bgCamera);

      const boxes = getGlassBoxes();
      const count = Math.min(boxes.length, 64);
      for (let i = 0; i < 64; i += 1) {
        if (i < count) {
          const box = boxes[i];
          boxVectors[i].set(box.x, box.y, box.w, box.h);
          radiiArray[i] = box.r;
          bezelsArray[i] = box.bezel;
        } else {
          boxVectors[i].set(0, 0, 0, 0);
          radiiArray[i] = 0;
          bezelsArray[i] = 0;
        }
      }

      material.uniforms.uBoxCount.value = count;
      material.uniforms.uBoxes.value = boxVectors;
      material.uniforms.uRadii.value = radiiArray;
      material.uniforms.uBezels.value = bezelsArray;
      material.uniforms.uFixedTopBoxIdx.value = boxes.findIndex((box) => box.id === "dock");
      material.uniforms.uTime.value = time * 0.001;

      const params = paramsRef.current;
      material.uniforms.uThickness.value = params.thick;
      material.uniforms.uIOR.value = params.ior;
      material.uniforms.uDispersion.value = params.dispersion;
      material.uniforms.uBlur.value = params.blur;
      material.uniforms.uSpecular.value = params.spec;
      material.uniforms.uTint.value = params.tint;
      material.uniforms.uShadow.value = params.shadow;

      current.renderer.setRenderTarget(null);
      current.renderer.render(scene, camera);
      current.rafId = requestAnimationFrame(renderLoop);
    };

    threeRef.current.rafId = requestAnimationFrame(renderLoop);

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const ultra = performanceRef.current === "ultra";
      renderer.setPixelRatio(ultra ? Math.min(window.devicePixelRatio || 1, 2) : 1);
      renderer.setSize(w, h);
      renderTarget.setSize(Math.max(1, Math.round(w * (ultra ? 1 : 0.75))), Math.max(1, Math.round(h * (ultra ? 1 : 0.75))));
      material.uniforms.uResolution.value.set(w, h);
      material.uniforms.uBgAspect.value = w / h;
      bgCamera.aspect = w / h;
      bgCamera.updateProjectionMatrix();
    };

    const handleThemeChange = () => {
      themeRef.current = isLightTheme();
      updateTheme(themeRef.current);
    };

    const handlePerformance = (event: Event) => {
      const detail = (event as CustomEvent<{ mode?: PerformanceMode }>).detail;
      performanceRef.current = detail?.mode === "high" ? "high" : "ultra";
      handleResize();
    };

    const handleSettings = () => {
      paramsRef.current = readParams();
    };

    const observer = new MutationObserver(handleThemeChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("resize", handleResize);
    window.addEventListener(PERFORMANCE_EVENT, handlePerformance);
    window.addEventListener(SETTINGS_EVENT, handleSettings);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
      window.removeEventListener(PERFORMANCE_EVENT, handlePerformance);
      window.removeEventListener(SETTINGS_EVENT, handleSettings);
      if (threeRef.current?.rafId) cancelAnimationFrame(threeRef.current.rafId);
      renderTarget.dispose();
      wallGeo.dispose();
      wallMat.dispose();
      orbGeometries.forEach((geometry) => geometry.dispose());
      orbMaterials.forEach((orbMaterial) => orbMaterial.dispose());
      plane.geometry.dispose();
      material.dispose();
      renderer.dispose();
      threeRef.current = null;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="fluid-glass-webgl-canvas"
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 h-full w-full"
      style={{ zIndex: 1 }}
    />
  );
}
