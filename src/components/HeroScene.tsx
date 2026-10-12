import { useEffect, useRef } from "react";
import {
  AdditiveBlending, BufferAttribute, BufferGeometry, Group, LineSegments, PerspectiveCamera, Points, Scene,
  ShaderMaterial, Vector2, WebGLRenderer,
} from "three";

// A fully connected neural network in 3D. Neurons are drawn as rings in vertical layers; every neuron is
// wired to every neuron in the next layer. Wire colour shows the sign of the weight (cyan positive,
// magenta negative) and brightness its size. A forward pass sweeps the layers: neurons fire and a pulse
// runs down every wire. The camera sways slowly so the layers separate in depth.

const FOV = 40, CAM_Z = 11, NET_Y = 0.3; // NET_Y: network centre as a fraction of height from the top
const COUNTS = [6, 9, 10, 10, 9, 6];
const SPACING_X = 2.1, SPACING_Y = 0.38, RADIUS = 0.15;
const PERIOD = 7.5; // seconds per forward pass

const HASH = /* glsl */ `
  float hash(float n) { return fract(sin(n * 12.9898 + 4.1414) * 43758.5453); }
`;

const nodeVertex = /* glsl */ `
  attribute float aL;
  attribute float aId;
  uniform float uS, uCycle, uUnit, uPR;
  varying float vAct;
  ${HASH}
  void main() {
    float amp = 0.35 + 0.65 * hash(aId + uCycle * 17.0);
    vAct = exp(-pow((uS - aL - 0.12) / 0.3, 2.0)) * amp;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uUnit * uPR * ${(RADIUS * 2 * 2.1).toFixed(3)} * (${CAM_Z.toFixed(1)} / -mv.z);
  }
`;
const nodeFragment = /* glsl */ `
  varying float vAct;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;      // 0 centre .. 1 edge of sprite
    float ring = smoothstep(0.58, 0.52, d) * smoothstep(0.36, 0.42, d);
    float glow = exp(-d * d * 6.0);
    float fill = smoothstep(0.5, 0.0, d);
    vec3 idle = vec3(0.6, 0.68, 0.95), hot = vec3(0.75, 1.0, 1.0);
    vec3 rgb = mix(idle, hot, vAct) * ring * (0.75 + 0.9 * vAct)
             + vec3(0.35, 0.6, 1.0) * glow * (0.06 + 0.7 * vAct)
             + vec3(1.0) * fill * vAct * 0.55;
    float a = clamp(ring * 0.85 + glow * (0.08 + 0.6 * vAct) + fill * vAct * 0.7, 0.0, 1.0);
    gl_FragColor = vec4(rgb, a);
  }
`;

const wireVertex = /* glsl */ `
  attribute float aT;       // 0 at the source neuron, 1 at the target
  attribute float aW;       // weight, -1..1
  attribute float aL;       // layer the wire leaves
  attribute float aSrc;     // source neuron id
  uniform float uS, uCycle;
  varying vec3 vBase; varying float vT, vU, vAmp, vStr;
  ${HASH}
  void main() {
    vec3 pos = vec3(0.25, 0.85, 1.0), neg = vec3(0.92, 0.3, 1.0);
    vStr = pow(abs(aW), 1.15);
    vBase = (aW > 0.0 ? pos : neg) * (0.07 + 0.62 * vStr);
    vT = aT;
    vU = uS - aL;                                    // how far the pulse has travelled along this wire
    vAmp = (0.3 + 0.7 * hash(aSrc + uCycle * 17.0)) * (0.35 + 1.1 * vStr);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const wireFragment = /* glsl */ `
  varying vec3 vBase; varying float vT, vU, vAmp, vStr;
  void main() {
    float gate = smoothstep(-0.12, 0.0, vU) * smoothstep(1.14, 1.0, vU);
    float pulse = exp(-pow((vT - vU) / 0.085, 2.0)) * gate;
    float wake = smoothstep(vU, vU - 0.5, vT) * step(vT, vU) * gate * 0.35;   // fading trail behind the pulse
    vec3 rgb = vBase + vec3(0.6, 0.95, 1.0) * (pulse + wake) * vAmp;
    gl_FragColor = vec4(rgb, 1.0);
  }
`;

export default function HeroScene() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    } catch {
      return; // no WebGL: the hero keeps its text without the scene
    }
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(pr);
    el.appendChild(renderer.domElement);

    const scene = new Scene();
    const camera = new PerspectiveCamera(FOV, 1, 0.1, 100);
    camera.position.z = CAM_Z;
    const net = new Group();
    scene.add(net);

    // Neurons in vertical layers, centred, with a little depth stagger so rotation separates them.
    const mid = (COUNTS.length - 1) / 2;
    const nodes: [number, number, number][] = [], nodeLayer: number[] = [], layerStart: number[] = [];
    COUNTS.forEach((n, l) => {
      layerStart.push(nodes.length);
      for (let i = 0; i < n; i++)
        nodes.push([(l - mid) * SPACING_X, (i - (n - 1) / 2) * SPACING_Y, ((i % 3) - 1) * 0.3]);
      for (let i = 0; i < n; i++) nodeLayer.push(l);
    });
    layerStart.push(nodes.length);

    // Every neuron to every neuron in the next layer.
    const wp: number[] = [], wT: number[] = [], wW: number[] = [], wL: number[] = [], wS: number[] = [];
    let e = 0;
    for (let l = 0; l < COUNTS.length - 1; l++)
      for (let i = layerStart[l]; i < layerStart[l + 1]; i++)
        for (let j = layerStart[l + 1]; j < layerStart[l + 2]; j++, e++) {
          const r = (k: number) => { const x = Math.sin(e * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };
          const w = Math.max(-1, Math.min(1, (r(1) + r(2) + r(3) - 1.5) * 1.15)); // bell-shaped weights
          for (const [end, n] of [[0, i], [1, j]] as const) {
            wp.push(...nodes[n]); wT.push(end); wW.push(w); wL.push(l); wS.push(i);
          }
        }

    const wireGeo = new BufferGeometry();
    wireGeo.setAttribute("position", new BufferAttribute(new Float32Array(wp), 3));
    wireGeo.setAttribute("aT", new BufferAttribute(new Float32Array(wT), 1));
    wireGeo.setAttribute("aW", new BufferAttribute(new Float32Array(wW), 1));
    wireGeo.setAttribute("aL", new BufferAttribute(new Float32Array(wL), 1));
    wireGeo.setAttribute("aSrc", new BufferAttribute(new Float32Array(wS), 1));
    const shared = { uS: { value: 0 }, uCycle: { value: 0 } };
    const wireMat = new ShaderMaterial({
      uniforms: { ...shared }, vertexShader: wireVertex, fragmentShader: wireFragment,
      transparent: true, depthWrite: false, blending: AdditiveBlending,
    });
    const wires = new LineSegments(wireGeo, wireMat);
    wires.frustumCulled = false;
    net.add(wires);

    const nodeGeo = new BufferGeometry();
    nodeGeo.setAttribute("position", new BufferAttribute(new Float32Array(nodes.flat()), 3));
    nodeGeo.setAttribute("aL", new BufferAttribute(new Float32Array(nodeLayer), 1));
    nodeGeo.setAttribute("aId", new BufferAttribute(new Float32Array(nodes.map((_, i) => i)), 1));
    const nodeMat = new ShaderMaterial({
      uniforms: { ...shared, uUnit: { value: 100 }, uPR: { value: pr } }, vertexShader: nodeVertex, fragmentShader: nodeFragment,
      transparent: true, depthWrite: false, blending: AdditiveBlending,
    });
    const neurons = new Points(nodeGeo, nodeMat);
    neurons.frustumCulled = false;
    net.add(neurons);

    const layout = () => {
      const w = el.clientWidth, h = el.clientHeight, aspect = w / h;
      renderer.setSize(w, h);
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      const tan = Math.tan((FOV * Math.PI) / 360);
      const fitW = (tan * CAM_Z * aspect * 2 * 0.9) / ((COUNTS.length - 1) * SPACING_X + 1);
      const fitH = (0.4 * 2 * tan * CAM_Z) / (Math.max(...COUNTS) * SPACING_Y + 0.5);
      const s = Math.min(1.1, fitW, fitH);
      net.scale.setScalar(s);
      net.position.y = (0.5 - NET_Y) * 2 * tan * CAM_Z;
      nodeMat.uniforms.uUnit.value = (h / (2 * tan * CAM_Z)) * s; // px per world unit at the network
      if (still) draw(0);
    };

    const mouse = new Vector2(), target = new Vector2();
    const area = el.parentElement ?? el;
    const move = (ev: PointerEvent) => {
      const r = el.getBoundingClientRect();
      target.set(((ev.clientX - r.left) / r.width) * 2 - 1, -(((ev.clientY - r.top) / r.height) * 2 - 1));
    };
    if (!still) area.addEventListener("pointermove", move);

    let t = still ? 3.2 : 0;
    const draw = (dt: number) => {
      t += dt;
      // The wavefront sweeps from before the first layer to after the last, then restarts.
      const phase = (t % PERIOD) / PERIOD;
      shared.uS.value = -0.6 + phase * (COUNTS.length - 1 + 1.4);
      shared.uCycle.value = Math.floor(t / PERIOD);
      nodeMat.uniforms.uS.value = shared.uS.value;
      nodeMat.uniforms.uCycle.value = shared.uCycle.value;
      wireMat.uniforms.uS.value = shared.uS.value;
      wireMat.uniforms.uCycle.value = shared.uCycle.value;
      mouse.lerp(target, 1 - Math.pow(0.01, dt || 0.016));
      const p = still ? 0 : Math.min(window.scrollY / Math.max(el.clientHeight, 1), 1);
      const intro = 1 - Math.pow(1 - Math.min(t / 2.2, 1), 4);
      net.rotation.y = Math.sin(t * 0.22) * 0.24 + mouse.x * 0.2;
      net.rotation.x = -0.05 + mouse.y * 0.12;
      camera.position.z = CAM_Z + (1 - intro) * 5 - p * 3;
      el.style.opacity = String(Math.min(1, intro * 1.5) * (1 - p * 0.9));
      renderer.render(scene, camera);
    };

    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(el);

    let raf = 0, visible = true, last = performance.now();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!visible) { last = now; return; }
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      draw(dt);
    };
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; });
    io.observe(el);
    if (!still) raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      area.removeEventListener("pointermove", move);
      wireGeo.dispose(); nodeGeo.dispose(); wireMat.dispose(); nodeMat.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={host} className="hero-scene" aria-hidden="true" />;
}
