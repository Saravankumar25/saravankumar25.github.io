import { useEffect, useRef } from "react";
import {
  AdditiveBlending, BufferAttribute, BufferGeometry, PerspectiveCamera, Points, Scene, ShaderMaterial,
  Vector2, WebGLRenderer,
} from "three";

// A cloud of points that keeps re-forming into different shapes and bends away from the cursor.
// Everything runs on the GPU; the loop pauses off-screen and renders one still frame for reduced motion.

const R = 1.55;

const sphere = (n: number) => {
  const a = new Float32Array(n * 3), g = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2, r = Math.sqrt(1 - y * y), t = g * i;
    a.set([Math.cos(t) * r * R, y * R, Math.sin(t) * r * R], i * 3);
  }
  return a;
};

const knot = (n: number) => {
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    // Trefoil knot, thickened with random scatter so it reads as a tube of points.
    const t = Math.random() * Math.PI * 2, k = 0.46;
    const x = Math.sin(t) + 2 * Math.sin(2 * t), y = Math.cos(t) - 2 * Math.cos(2 * t), z = -Math.sin(3 * t);
    const j = () => (Math.random() - 0.5) * 0.28;
    a.set([x * k + j(), y * k + j(), z * k * 1.3 + j()], i * 3);
  }
  return a;
};

const cube = (n: number) => {
  const a = new Float32Array(n * 3), s = 1.25;
  for (let i = 0; i < n; i++) {
    const face = Math.floor(Math.random() * 6), u = (Math.random() * 2 - 1) * s, v = (Math.random() * 2 - 1) * s;
    const sign = face % 2 ? -s : s, axis = Math.floor(face / 2);
    const p = axis === 0 ? [sign, u, v] : axis === 1 ? [u, sign, v] : [u, v, sign];
    a.set(p, i * 3);
  }
  return a;
};

const shapes = [sphere, knot, cube];

const vertex = /* glsl */ `
  attribute vec3 aB;
  attribute float aRand;
  uniform float uMix, uTime, uPR;
  uniform vec2 uMouse;
  uniform float uAspect, uPush;
  varying float vDepth;
  void main() {
    float m = smoothstep(aRand * 0.45, 0.55 + aRand * 0.45, uMix);
    vec3 p = mix(position, aB, m);
    p += 0.035 * vec3(sin(uTime * 0.8 + p.y * 3.0), cos(uTime * 0.7 + p.z * 3.0), sin(uTime * 0.9 + p.x * 3.0));
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vec4 clip = projectionMatrix * mv;
    vec2 ndc = clip.xy / clip.w;
    vec2 d = (ndc - uMouse) * vec2(uAspect, 1.0);
    float dist = length(d);
    ndc += normalize(d + 1e-5) / vec2(uAspect, 1.0) * uPush * 0.28 * exp(-dist * dist * 9.0);
    gl_Position = vec4(ndc * clip.w, clip.zw);
    vDepth = smoothstep(-7.2, -2.8, mv.z);
    gl_PointSize = (1.4 + aRand * 1.6) * uPR * (5.0 / -mv.z);
  }
`;
const fragment = /* glsl */ `
  varying float vDepth;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.05, d) * (0.15 + 0.85 * vDepth);
    gl_FragColor = vec4(vec3(0.86, 0.86, 0.9), a);
  }
`;

export default function HeroScene() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ alpha: true, antialias: false, powerPreference: "low-power" });
    } catch {
      return; // no WebGL: the hero simply shows without the scene
    }
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const count = window.innerWidth < 768 ? 3500 : 8000;
    const pr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(pr);
    el.appendChild(renderer.domElement);

    const scene = new Scene();
    const camera = new PerspectiveCamera(45, 1, 0.1, 50);
    camera.position.z = 5;

    let from = 0;
    const next = () => shapes[(from + 1) % shapes.length](count);
    const geo = new BufferGeometry();
    const posA = new BufferAttribute(shapes[from](count), 3);
    const posB = new BufferAttribute(next(), 3);
    const rand = new BufferAttribute(Float32Array.from({ length: count }, Math.random), 1);
    geo.setAttribute("position", posA);
    geo.setAttribute("aB", posB);
    geo.setAttribute("aRand", rand);

    const uniforms = {
      uMix: { value: 0 }, uTime: { value: 0 }, uPR: { value: pr },
      uMouse: { value: new Vector2(9, 9) }, uAspect: { value: 1 }, uPush: { value: 0 },
    };
    const mat = new ShaderMaterial({
      uniforms, vertexShader: vertex, fragmentShader: fragment, transparent: true, depthWrite: false,
      blending: AdditiveBlending,
    });
    const points = new Points(geo, mat);
    scene.add(points);

    const size = () => {
      const w = el.clientWidth, h = el.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      uniforms.uAspect.value = w / h;
      // On wide screens the shape sits to the right of the text.
      points.position.x = w / h > 1.25 ? 1.7 : 0;
      points.position.y = w / h > 1.25 ? 0 : 1.1;
      camera.updateProjectionMatrix();
      if (still) renderer.render(scene, camera);
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(el);

    const target = new Vector2(9, 9);
    let pushTarget = 0;
    const area = el.parentElement ?? el;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      target.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
      pushTarget = 1;
    };
    const leave = () => { pushTarget = 0; };
    if (!still) {
      area.addEventListener("pointermove", move);
      area.addEventListener("pointerleave", leave);
    }

    let raf = 0, visible = true, last = performance.now(), hold = 0, morph = -1;
    const HOLD = 3.4, MORPH = 2.6;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!visible) { last = now; return; }
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      uniforms.uTime.value += dt;
      // Phase machine: hold the shape, then morph to the next one, then promote it.
      if (morph < 0) {
        hold += dt;
        if (hold > HOLD) { morph = 0; hold = 0; }
      } else {
        morph += dt / MORPH;
        uniforms.uMix.value = Math.min(morph, 1);
        if (morph >= 1) {
          from = (from + 1) % shapes.length;
          (posA.array as Float32Array).set(posB.array as Float32Array);
          posA.needsUpdate = true;
          (posB.array as Float32Array).set(next());
          posB.needsUpdate = true;
          uniforms.uMix.value = 0;
          morph = -1;
        }
      }
      uniforms.uMouse.value.lerp(target, 1 - Math.pow(0.001, dt));
      uniforms.uPush.value += (pushTarget - uniforms.uPush.value) * (1 - Math.pow(0.01, dt));
      points.rotation.y += dt * 0.18;
      points.rotation.x += ((-target.y * 0.18 * (pushTarget ? 1 : 0)) - points.rotation.x) * (1 - Math.pow(0.05, dt));
      renderer.render(scene, camera);
    };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(el);
    if (!still) raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      area.removeEventListener("pointermove", move);
      area.removeEventListener("pointerleave", leave);
      geo.dispose();
      mat.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={host} className="hero-scene" aria-hidden="true" />;
}
