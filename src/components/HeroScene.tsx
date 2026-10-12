import { useEffect, useRef } from "react";
import {
  AdditiveBlending, BufferAttribute, BufferGeometry, Group, Mesh, MeshBasicMaterial, PerspectiveCamera,
  PlaneGeometry, Points, Scene, ShaderMaterial, SphereGeometry, Vector2, WebGLRenderer,
} from "three";

// A galaxy falling into a black hole. ~100k points stream inward along spiral arms; a second copy of
// the inner disc is bent into a halo around the event horizon (the lensing look). All motion is in
// the vertex shader. The loop pauses off-screen; reduced motion renders one still frame.

const RMIN = 0.2, RMAX = 4.6;

const diskVertex = /* glsl */ `
  attribute vec4 aSeed;            // x phase, y arm angle, z angular scatter, w height scatter
  uniform float uTime, uPR, uLens;
  varying float vA;
  varying float vCore;
  varying float vTint;
  void main() {
    float u = fract(aSeed.x + uTime * 0.03);
    float r = ${RMIN.toFixed(2)} + (${(RMAX - RMIN).toFixed(2)}) * pow(1.0 - u, 1.9);
    float core = exp(-r * 0.75);
    float theta = aSeed.y - 2.7 * log(r * 0.9 + 0.2) + uTime * 0.05 + aSeed.z * (0.09 + 0.09 * r);
    float h = aSeed.w * (0.025 + 0.16 * exp(-r * 0.9));
    vec3 p;
    if (uLens > 0.5) {
      // Lensed image: the disc folded up into the viewing plane, wrapping the hole.
      float rl = 0.3 + r * 0.22;
      p = vec3(cos(theta) * rl, sin(theta) * rl * 0.92, h * 1.5);
    } else {
      p = vec3(cos(theta) * r, h, sin(theta) * r);
    }
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float rnd = fract(aSeed.x * 97.31);
    float lensFade = uLens > 0.5 ? smoothstep(2.6, 0.4, r) : 1.0;
    vA = (0.16 + 0.85 * core) * smoothstep(${RMIN.toFixed(2)}, ${(RMIN + 0.15).toFixed(2)}, r)
       * smoothstep(0.0, 0.06, u) * lensFade * (uLens > 0.5 ? 0.9 : 1.0);
    vCore = core;
    vTint = aSeed.y / 6.2832 + 0.25 * sin(r * 1.3);
    gl_PointSize = (0.7 + 1.9 * rnd) * uPR * (16.0 / -mv.z) * (0.7 + 0.9 * core);
  }
`;
const diskFragment = /* glsl */ `
  varying float vA;
  varying float vCore;
  varying float vTint;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = exp(-d * d * 22.0) * vA;
    if (a < 0.004) discard;
    vec3 blue = vec3(0.16, 0.38, 1.0), violet = vec3(0.62, 0.26, 1.0), cyan = vec3(0.45, 0.92, 1.0);
    vec3 arm = mix(blue, violet, smoothstep(0.1, 0.9, fract(vTint)));
    vec3 c = mix(arm, cyan, smoothstep(0.15, 0.55, vCore));
    c = mix(c, vec3(1.0), smoothstep(0.55, 0.95, vCore));
    gl_FragColor = vec4(c, a);
  }
`;

const starVertex = /* glsl */ `
  attribute float aR;
  uniform float uTime, uPR;
  varying float vA;
  varying float vH;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    vH = fract(aR * 13.7);
    vA = 0.25 + 0.55 * aR * (0.7 + 0.3 * sin(uTime * (0.6 + aR * 2.0) + aR * 40.0));
    gl_PointSize = (0.6 + aR * 1.3) * uPR;
  }
`;
const starFragment = /* glsl */ `
  varying float vA;
  varying float vH;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d) * vA;
    gl_FragColor = vec4(mix(vec3(0.7, 0.82, 1.0), vec3(0.88, 0.7, 1.0), vH), a);
  }
`;

// Photon ring and glow, drawn on a camera-facing quad.
const ringFragment = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float d = length(p);
    float ang = atan(p.y, p.x);
    float ring = exp(-pow((d - 0.2) / 0.011, 2.0));
    float halo = exp(-pow((d - 0.2) / 0.06, 2.0)) * 0.32;
    float glow = exp(-d * 3.2) * 0.2;
    float beam = (0.65 + 0.35 * cos(ang - 0.6 + uTime * 0.15));
    float a = (ring * 0.95 * beam + halo * beam + glow) * smoothstep(1.0, 0.7, d);
    vec3 col = mix(vec3(0.4, 0.45, 1.0), vec3(0.85, 0.95, 1.0), clamp(ring * 1.4 + halo * 2.0, 0.0, 1.0));
    gl_FragColor = vec4(col, a);
  }
`;

const gaussian = () => (Math.random() + Math.random() + Math.random() - 1.5) / 0.75;

export default function HeroScene() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ alpha: true, antialias: false, powerPreference: "high-performance" });
    } catch {
      return; // no WebGL: the hero simply shows without the scene
    }
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = window.innerWidth < 768;
    const count = small ? 40000 : 110000;
    const pr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2);
    renderer.setPixelRatio(pr);
    el.appendChild(renderer.domElement);

    const scene = new Scene();
    const camera = new PerspectiveCamera(42, 1, 0.1, 100);

    // Disc particles
    const arms = 3;
    const seed = new Float32Array(count * 4);
    const pos = new Float32Array(count * 3); // required by three; real position is computed in the shader
    for (let i = 0; i < count; i++) {
      seed[i * 4] = Math.random();
      seed[i * 4 + 1] = Math.floor(Math.random() * arms) * ((Math.PI * 2) / arms);
      seed[i * 4 + 2] = gaussian();
      seed[i * 4 + 3] = gaussian();
    }
    const geo = new BufferGeometry();
    geo.setAttribute("position", new BufferAttribute(pos, 3));
    geo.setAttribute("aSeed", new BufferAttribute(seed, 4));
    geo.boundingSphere = null;

    const makeDisk = (lens: number) => new ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uPR: { value: pr }, uLens: { value: lens } },
      vertexShader: diskVertex, fragmentShader: diskFragment, transparent: true, depthWrite: false,
      blending: AdditiveBlending,
    });
    const diskMat = makeDisk(0), lensMat = makeDisk(1);

    const hole = new Group();
    const disk = new Points(geo, diskMat);
    disk.frustumCulled = false;
    const lens = new Points(geo, lensMat);
    lens.frustumCulled = false;
    const tilt = new Group();
    tilt.add(disk);
    hole.add(tilt, lens);
    scene.add(hole);

    // Event horizon: an opaque black sphere that also hides particles passing behind it.
    const horizon = new Mesh(new SphereGeometry(0.19, 48, 32), new MeshBasicMaterial({ color: 0x000000 }));
    hole.add(horizon);

    const ringMat = new ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: ringFragment, transparent: true, depthWrite: false, blending: AdditiveBlending,
    });
    const ring = new Mesh(new PlaneGeometry(4.4, 4.4), ringMat);
    hole.add(ring);

    // Distant stars
    const sc = small ? 2500 : 6000;
    const sp = new Float32Array(sc * 3), sr = new Float32Array(sc);
    for (let i = 0; i < sc; i++) {
      const r = 18 + Math.random() * 30, a = Math.random() * Math.PI * 2, c = Math.random() * 2 - 1, s = Math.sqrt(1 - c * c);
      sp.set([Math.cos(a) * s * r, c * r, Math.sin(a) * s * r], i * 3);
      sr[i] = Math.pow(Math.random(), 2.2);
    }
    const sg = new BufferGeometry();
    sg.setAttribute("position", new BufferAttribute(sp, 3));
    sg.setAttribute("aR", new BufferAttribute(sr, 1));
    const starMat = new ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uPR: { value: pr } }, vertexShader: starVertex, fragmentShader: starFragment,
      transparent: true, depthWrite: false, blending: AdditiveBlending,
    });
    const stars = new Points(sg, starMat);
    stars.frustumCulled = false;
    scene.add(stars);

    const size = () => {
      const w = el.clientWidth, h = el.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const wide = w / h > 1.25;
      hole.position.set(wide ? 2.5 : 0, wide ? 0.1 : 1.5, 0);
      if (still) draw(0);
    };

    const mouse = new Vector2(), mTarget = new Vector2();
    const area = el.parentElement ?? el;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      mTarget.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
    };
    if (!still) area.addEventListener("pointermove", move);

    const ease = (x: number) => 1 - Math.pow(1 - x, 4);
    let elapsed = still ? 20 : 0;
    const draw = (dt: number) => {
      elapsed += dt;
      const t = elapsed;
      diskMat.uniforms.uTime.value = lensMat.uniforms.uTime.value = starMat.uniforms.uTime.value = ringMat.uniforms.uTime.value = t;
      // Fly-in: far and edge-on first, settling closer and tilted toward us.
      const k = ease(Math.min(t / 4.2, 1));
      mouse.lerp(mTarget, 1 - Math.pow(0.02, dt || 0.016));
      camera.position.set(mouse.x * 0.9, mouse.y * 0.5 + 0.2, 17 - k * 8.7);
      camera.lookAt(hole.position.x * 0.25, hole.position.y * 0.25, 0);
      tilt.rotation.set(1.35 - k * 0.55, 0, -0.32 + Math.sin(t * 0.07) * 0.04);
      tilt.rotation.y = t * 0.0;
      // The halo and ring always face the camera.
      ring.quaternion.copy(camera.quaternion);
      lens.quaternion.copy(camera.quaternion);
      stars.rotation.y = t * 0.004;
      renderer.render(scene, camera);
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(el);

    let raf = 0, visible = true, last = performance.now();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!visible) { last = now; return; }
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      draw(dt);
    };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(el);
    if (!still) raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      area.removeEventListener("pointermove", move);
      geo.dispose(); sg.dispose();
      diskMat.dispose(); lensMat.dispose(); ringMat.dispose(); starMat.dispose();
      horizon.geometry.dispose(); (horizon.material as MeshBasicMaterial).dispose(); ring.geometry.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={host} className="hero-scene" aria-hidden="true" />;
}
