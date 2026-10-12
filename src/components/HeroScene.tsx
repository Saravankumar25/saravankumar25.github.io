import { useEffect, useRef } from "react";
import {
  AdditiveBlending, BufferAttribute, BufferGeometry, CanvasTexture, DoubleSide, Group, LineBasicMaterial,
  LineSegments, Mesh, MeshBasicMaterial, PerspectiveCamera, PlaneGeometry, Points, Scene, ShaderMaterial,
  Sprite, SpriteMaterial, SRGBColorSpace, Vector2, WebGLRenderer,
} from "three";

// An AI pipeline in 3D. Data enters on the left, passes through Retrieval, Model, Agent and Checks,
// and leaves as a Product. Glowing packets are the data; each layer lights up as a wave reaches it.
// Real code floats behind it. Everything is deterministic and left-right symmetric.

const FOV = 38, CAM_Z = 11, NET_Y = 0.3; // NET_Y: network centre as a fraction of height from the top
const LAYERS = ["Data", "Retrieval", "Model", "Agent", "Checks", "Product"];
const COUNTS = [3, 5, 7, 7, 5, 3];

type Tok = [string, string];
const K = "#b48cff", F = "#6fa8ff", S = "#5fe3ff", C = "#6b7390", P = "#d7dcff";
const CODE: { file: string; lines: Tok[][] }[] = [
  {
    file: "agent.py",
    lines: [
      [["for ", K], ["step ", P], ["in ", K], ["range", F], ["(MAX_STEPS):", P]],
      [["    action = ", P], ["model", F], [".plan(state)", P]],
      [["    if not ", K], ["policy", F], [".allows(action):", P]],
      [["        break  ", K], ["# deterministic gate", C]],
      [["    state = ", P], ["tools", F], [".run(action)", P]],
    ],
  },
  {
    file: "ask.ts",
    lines: [
      [["const ", K], ["answer = ", P], ["await ", K], ["ask", F], ["(question, {", P]],
      [["  retrieve: ", P], ['"hybrid"', S], [",", P]],
      [["  cite: ", P], ["true", K], [",", P]],
      [["});", P]],
      [["// every claim has a source", C]],
    ],
  },
];

function codeTexture(file: string, lines: Tok[][]): CanvasTexture {
  const w = 1024, h = 640, c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d")!;
  g.fillStyle = "rgba(12,14,26,.9)";
  g.strokeStyle = "rgba(130,150,255,.55)";
  g.lineWidth = 3;
  g.beginPath(); g.roundRect(6, 6, w - 12, h - 12, 28); g.fill(); g.stroke();
  ["#5b6bff", "#9a6bff", "#4fd8ff"].forEach((col, i) => { g.fillStyle = col; g.beginPath(); g.arc(52 + i * 36, 54, 10, 0, 7); g.fill(); });
  g.font = '500 28px "JetBrains Mono", ui-monospace, monospace';
  g.fillStyle = C;
  g.fillText(file, w - 52 - g.measureText(file).width, 62);
  g.font = '500 38px "JetBrains Mono", ui-monospace, monospace';
  lines.forEach((line, i) => {
    let x = 52;
    for (const [text, col] of line) { g.fillStyle = col; g.fillText(text, x, 150 + i * 80); x += g.measureText(text).width; }
  });
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

function labelTexture(text: string): CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 128;
  const g = c.getContext("2d")!;
  g.font = '500 54px "JetBrains Mono", ui-monospace, monospace';
  g.textAlign = "center"; g.textBaseline = "middle";
  g.fillStyle = "#fff";
  g.fillText(text.toUpperCase(), 256, 64);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

const nodeVertex = /* glsl */ `
  attribute float aL;
  uniform float uTime, uPR;
  varying float vAct; varying float vL;
  void main() {
    vAct = pow(0.5 + 0.5 * sin(uTime * 1.6 - aL * 0.95), 3.0);
    vL = aL / 5.0;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (26.0 + 20.0 * vAct) * uPR * (10.0 / -mv.z);
  }
`;
const nodeFragment = /* glsl */ `
  varying float vAct; varying float vL;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float halo = exp(-d * d * 16.0) * (0.35 + 0.65 * vAct);
    float core = exp(-d * d * 150.0);
    vec3 c = mix(vec3(0.25, 0.5, 1.0), vec3(0.7, 0.45, 1.0), smoothstep(0.0, 0.55, vL));
    c = mix(c, vec3(0.4, 0.95, 1.0), smoothstep(0.55, 1.0, vL));
    gl_FragColor = vec4(c * (halo + 0.4) + vec3(core), halo * 0.9 + core);
  }
`;
const packetVertex = /* glsl */ `
  attribute vec3 aB;
  attribute vec2 aP;
  uniform float uTime, uPR;
  varying float vA; varying vec3 vC;
  void main() {
    float f = fract(aP.x + uTime * aP.y);
    vec3 p = mix(position, aB, f);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    vA = sin(f * 3.14159);
    gl_PointSize = 6.0 * uPR * (10.0 / -mv.z) * (0.6 + 0.4 * vA);
    vC = mix(vec3(0.25, 0.5, 1.0), vec3(0.75, 0.45, 1.0), smoothstep(-4.0, 4.0, p.x));
    vC = mix(vC, vec3(0.6, 1.0, 1.0), pow(vA, 8.0));
  }
`;
const packetFragment = /* glsl */ `
  varying float vA; varying vec3 vC;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = exp(-d * d * 20.0) * vA;
    gl_FragColor = vec4(vC, a);
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
    const small = window.innerWidth < 768;
    const pr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(pr);
    el.appendChild(renderer.domElement);

    const scene = new Scene();
    const camera = new PerspectiveCamera(FOV, 1, 0.1, 100);
    camera.position.z = CAM_Z;

    // Network geometry: unit spacing in x, scaled per viewport in layout().
    const net = new Group();
    scene.add(net);
    const nodes: [number, number, number][] = [], nodeLayer: number[] = [], layerStart: number[] = [];
    COUNTS.forEach((n, l) => {
      layerStart.push(nodes.length);
      for (let i = 0; i < n; i++) {
        nodes.push([l - (COUNTS.length - 1) / 2, (i - (n - 1) / 2) * 0.46, Math.sin(i * 2.4 + l) * 0.45]);
        nodeLayer.push(l);
      }
    });
    layerStart.push(nodes.length);

    const edgeA: number[] = [], edgeB: number[] = [], seg: number[] = [];
    for (let l = 0; l < COUNTS.length - 1; l++)
      for (let i = layerStart[l]; i < layerStart[l + 1]; i++)
        for (let j = layerStart[l + 1]; j < layerStart[l + 2]; j++) {
          edgeA.push(...nodes[i]); edgeB.push(...nodes[j]); seg.push(...nodes[i], ...nodes[j]);
        }
    const edges = edgeA.length / 3;

    const lineGeo = new BufferGeometry();
    lineGeo.setAttribute("position", new BufferAttribute(new Float32Array(seg), 3));
    const lineMat = new LineBasicMaterial({ color: 0x6a7cff, transparent: true, opacity: small ? 0.07 : 0.09, blending: AdditiveBlending, depthWrite: false });
    net.add(new LineSegments(lineGeo, lineMat));

    const nodeGeo = new BufferGeometry();
    nodeGeo.setAttribute("position", new BufferAttribute(new Float32Array(nodes.flat()), 3));
    nodeGeo.setAttribute("aL", new BufferAttribute(new Float32Array(nodeLayer), 1));
    const nodeMat = new ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uPR: { value: pr } }, vertexShader: nodeVertex, fragmentShader: nodeFragment,
      transparent: true, depthWrite: false, blending: AdditiveBlending,
    });
    net.add(new Points(nodeGeo, nodeMat));

    const per = small ? 3 : 6, pc = edges * per;
    const pa = new Float32Array(pc * 3), pb = new Float32Array(pc * 3), pp = new Float32Array(pc * 2);
    for (let e = 0; e < edges; e++)
      for (let k = 0; k < per; k++) {
        const i = e * per + k;
        pa.set(edgeA.slice(e * 3, e * 3 + 3), i * 3);
        pb.set(edgeB.slice(e * 3, e * 3 + 3), i * 3);
        pp[i * 2] = (k + Math.sin(e * 12.9898) * 0.5 + 0.5) / per; // phase
        pp[i * 2 + 1] = 0.16 + ((e * 7919) % 100) / 100 * 0.12;    // speed
      }
    const packetGeo = new BufferGeometry();
    packetGeo.setAttribute("position", new BufferAttribute(pa, 3));
    packetGeo.setAttribute("aB", new BufferAttribute(pb, 3));
    packetGeo.setAttribute("aP", new BufferAttribute(pp, 2));
    const packetMat = new ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uPR: { value: pr } }, vertexShader: packetVertex, fragmentShader: packetFragment,
      transparent: true, depthWrite: false, blending: AdditiveBlending,
    });
    const packets = new Points(packetGeo, packetMat);
    packets.frustumCulled = false;
    net.add(packets);

    // Layer labels
    const labelMats: SpriteMaterial[] = [];
    const labels = LAYERS.map((name, l) => {
      const m = new SpriteMaterial({ map: labelTexture(name), transparent: true, depthWrite: false, opacity: 0.6 });
      labelMats.push(m);
      const s = new Sprite(m);
      s.scale.set(1.1, 0.275, 1);
      s.position.set(l - (COUNTS.length - 1) / 2, -1.75, 0);
      net.add(s);
      return s;
    });

    // Floating code
    const panes = new Group();
    scene.add(panes);
    const paneMeshes = CODE.map((c, i) => {
      const m = new Mesh(new PlaneGeometry(3.3, 2.06), new MeshBasicMaterial({ map: codeTexture(c.file, c.lines), transparent: true, opacity: 0.88, side: DoubleSide, toneMapped: false }));
      m.userData.side = i === 0 ? -1 : 1;
      panes.add(m);
      return m;
    });

    let yNet = 0, halfW = 0;
    const layout = () => {
      const w = el.clientWidth, h = el.clientHeight, aspect = w / h;
      renderer.setSize(w, h);
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      const tan = Math.tan((FOV * Math.PI) / 360);
      halfW = tan * CAM_Z * aspect;
      yNet = (0.5 - NET_Y) * 2 * tan * CAM_Z;
      const spread = Math.min(1.5, (halfW * 2 * 0.78) / (COUNTS.length - 1));
      net.scale.set(spread, Math.min(1.1, spread * 0.9), spread);
      net.position.y = yNet;
      panes.visible = aspect > 1.25;
      paneMeshes.forEach((m) => m.position.set(m.userData.side * halfW * 0.8, yNet + 0.1, -3));
      if (still) draw(0);
    };

    const mouse = new Vector2(), target = new Vector2();
    const area = el.parentElement ?? el;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      target.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
    };
    if (!still) area.addEventListener("pointermove", move);

    let t = still ? 7 : 0;
    const draw = (dt: number) => {
      t += dt;
      const time = t;
      nodeMat.uniforms.uTime.value = packetMat.uniforms.uTime.value = time;
      mouse.lerp(target, 1 - Math.pow(0.01, dt || 0.016));
      const p = still ? 0 : Math.min(window.scrollY / Math.max(el.clientHeight, 1), 1);
      const intro = 1 - Math.pow(1 - Math.min(t / 2.2, 1), 4);
      net.rotation.y = Math.sin(time * 0.28) * 0.3 + mouse.x * 0.4;
      net.rotation.x = -0.12 + mouse.y * 0.18;
      panes.rotation.y = mouse.x * 0.12;
      paneMeshes.forEach((m, i) => {
        m.position.y = yNet + 0.1 + Math.sin(time * 0.6 + i * 2) * 0.1;
        m.rotation.y = m.userData.side * -0.38;
        m.material.opacity = 0.88 * intro;
      });
      labels.forEach((_, l) => {
        labelMats[l].opacity = (0.35 + 0.65 * Math.pow(0.5 + 0.5 * Math.sin(time * 1.6 - l * 0.95), 3)) * intro;
      });
      camera.position.z = CAM_Z + (1 - intro) * 5 - p * 2.5;
      el.style.opacity = String(1 - p * 0.9);
      renderer.render(scene, camera);
    };

    let ro: ResizeObserver | undefined;
    let alive = true;
    Promise.all([document.fonts.load('500 40px "JetBrains Mono"'), document.fonts.ready]).finally(() => {
      if (!alive) return;
      // Re-draw the font-dependent textures now that the fonts are ready.
      labelMats.forEach((m, l) => { m.map?.dispose(); m.map = labelTexture(LAYERS[l]); });
      paneMeshes.forEach((m, i) => { (m.material as MeshBasicMaterial).map?.dispose(); (m.material as MeshBasicMaterial).map = codeTexture(CODE[i].file, CODE[i].lines); });
      layout();
      ro = new ResizeObserver(layout);
      ro.observe(el);
      ready = true;
    });
    let ready = false;

    let raf = 0, visible = true, last = performance.now();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!visible || !ready) { last = now; return; }
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      draw(dt);
    };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(el);
    if (!still) raf = requestAnimationFrame(tick);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro?.disconnect();
      area.removeEventListener("pointermove", move);
      [lineGeo, nodeGeo, packetGeo].forEach((g) => g.dispose());
      [lineMat, nodeMat, packetMat].forEach((m) => m.dispose());
      labelMats.forEach((m) => { m.map?.dispose(); m.dispose(); });
      paneMeshes.forEach((m) => { m.geometry.dispose(); (m.material as MeshBasicMaterial).map?.dispose(); (m.material as MeshBasicMaterial).dispose(); });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={host} className="hero-scene" aria-hidden="true" />;
}
