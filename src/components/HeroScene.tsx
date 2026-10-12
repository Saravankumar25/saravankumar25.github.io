import { useEffect, useRef } from "react";
import {
  AdditiveBlending, BufferAttribute, BufferGeometry, Group, LineBasicMaterial, LineSegments, PerspectiveCamera,
  Points, Scene, ShaderMaterial, Vector2, WebGLRenderer,
} from "three";

// A 3D neural network: seven layers shaped like a lens, every neuron wired to its nearest neighbours
// in the next layer. Comets of signal run along the wires and neurons flare as waves reach them.
// The shape is mirror-symmetric; the camera sweeps slowly so the depth reads.

const FOV = 40, CAM_Z = 11, NET_Y = 0.3; // NET_Y: network centre as a fraction of height from the top
const COUNTS = [9, 16, 24, 30, 24, 16, 9];
const SPACING = 1.25, FAN = 3;

const GLSL_COLOR = /* glsl */ `
  vec3 palette(float x) {                       // x in 0..1 along the network
    vec3 blue = vec3(0.22, 0.45, 1.0), violet = vec3(0.68, 0.38, 1.0), cyan = vec3(0.35, 0.92, 1.0);
    vec3 c = mix(blue, violet, smoothstep(0.0, 0.5, x));
    return mix(c, cyan, smoothstep(0.5, 1.0, x));
  }
`;

const nodeVertex = /* glsl */ `
  attribute float aL;
  attribute float aPh;
  uniform float uTime, uPR;
  varying float vAct; varying float vX;
  void main() {
    vAct = pow(0.5 + 0.5 * sin(uTime * 1.5 - aL * 1.05 + aPh * 5.0), 5.0);
    vX = aL / 6.0;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (20.0 + 26.0 * vAct) * uPR * (10.0 / -mv.z);
  }
`;
const nodeFragment = /* glsl */ `
  varying float vAct; varying float vX;
  ${GLSL_COLOR}
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float halo = exp(-d * d * 15.0) * (0.25 + 0.75 * vAct);
    float core = exp(-d * d * 140.0) * (0.55 + 0.45 * vAct);
    vec3 c = palette(vX);
    gl_FragColor = vec4(c * (halo + 0.35) + vec3(core), halo * 0.85 + core);
  }
`;

// Comet: a line segment whose head runs along an edge and whose tail fades behind it.
const cometVertex = /* glsl */ `
  attribute vec3 aB;
  attribute vec3 aP;                   // x phase, y speed, z end flag (0 head, 1 tail)
  uniform float uTime;
  varying float vA; varying float vX;
  void main() {
    float f = fract(aP.x + uTime * aP.y);
    float ft = max(f - 0.2 * aP.z, 0.0);
    vec3 p = mix(position, aB, ft);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    vA = (1.0 - aP.z) * sin(f * 3.14159) * 1.25;
    vX = (p.x / 7.5) + 0.5;
  }
`;
const cometFragment = /* glsl */ `
  varying float vA; varying float vX;
  ${GLSL_COLOR}
  void main() { gl_FragColor = vec4(mix(palette(vX), vec3(0.85, 1.0, 1.0), vA * 0.5), vA); }
`;
const headVertex = /* glsl */ `
  attribute vec3 aB;
  attribute vec3 aP;
  uniform float uTime, uPR;
  varying float vA; varying float vX;
  void main() {
    float f = fract(aP.x + uTime * aP.y);
    vec3 p = mix(position, aB, f);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    vA = sin(f * 3.14159);
    vX = (p.x / 7.5) + 0.5;
    gl_PointSize = 9.0 * uPR * (10.0 / -mv.z) * (0.5 + 0.5 * vA);
  }
`;
const headFragment = /* glsl */ `
  varying float vA; varying float vX;
  ${GLSL_COLOR}
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float g = exp(-d * d * 22.0);
    gl_FragColor = vec4(mix(palette(vX), vec3(1.0), 0.55) * g, g * vA);
  }
`;
const dustVertex = /* glsl */ `
  attribute float aR;
  uniform float uTime, uPR;
  varying float vA;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    vA = (0.1 + 0.4 * aR) * (0.6 + 0.4 * sin(uTime * (0.4 + aR) + aR * 50.0));
    gl_PointSize = (1.0 + aR * 1.6) * uPR * (10.0 / -mv.z);
  }
`;
const dustFragment = /* glsl */ `
  varying float vA;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    gl_FragColor = vec4(0.65, 0.75, 1.0, smoothstep(0.5, 0.0, d) * vA);
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
    const net = new Group();
    scene.add(net);

    // Neurons: each layer is a golden-angle disc whose radius follows a lens profile.
    const mid = (COUNTS.length - 1) / 2;
    const nodes: number[][] = [], nodeLayer: number[] = [], nodePhase: number[] = [], layerStart: number[] = [];
    COUNTS.forEach((n, l) => {
      layerStart.push(nodes.length);
      const radius = 0.4 + 1.25 * Math.sin((Math.PI * (l + 0.5)) / COUNTS.length);
      for (let i = 0; i < n; i++) {
        const r = radius * Math.sqrt((i + 0.5) / n), a = i * 2.39996 + l * 0.7;
        nodes.push([(l - mid) * SPACING, r * Math.sin(a), r * Math.cos(a)]);
        nodeLayer.push(l);
        nodePhase.push(((i * 7919 + l * 104729) % 1000) / 1000);
      }
    });
    layerStart.push(nodes.length);

    // Wires: each neuron to its FAN nearest neurons in the next layer.
    const edgeA: number[][] = [], edgeB: number[][] = [];
    for (let l = 0; l < COUNTS.length - 1; l++)
      for (let i = layerStart[l]; i < layerStart[l + 1]; i++) {
        const near: [number, number][] = [];
        for (let j = layerStart[l + 1]; j < layerStart[l + 2]; j++) {
          const dy = nodes[i][1] - nodes[j][1], dz = nodes[i][2] - nodes[j][2];
          near.push([dy * dy + dz * dz, j]);
        }
        near.sort((a, b) => a[0] - b[0]);
        for (const [, j] of near.slice(0, FAN)) { edgeA.push(nodes[i]); edgeB.push(nodes[j]); }
      }
    const edges = edgeA.length;

    const wireGeo = new BufferGeometry();
    wireGeo.setAttribute("position", new BufferAttribute(new Float32Array(edgeA.flatMap((a, e) => [...a, ...edgeB[e]])), 3));
    const wireMat = new LineBasicMaterial({ color: 0x6f86ff, transparent: true, opacity: small ? 0.1 : 0.14, blending: AdditiveBlending, depthWrite: false });
    net.add(new LineSegments(wireGeo, wireMat));

    const nodeGeo = new BufferGeometry();
    nodeGeo.setAttribute("position", new BufferAttribute(new Float32Array(nodes.flat()), 3));
    nodeGeo.setAttribute("aL", new BufferAttribute(new Float32Array(nodeLayer), 1));
    nodeGeo.setAttribute("aPh", new BufferAttribute(new Float32Array(nodePhase), 1));
    const nodeMat = new ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uPR: { value: pr } }, vertexShader: nodeVertex, fragmentShader: nodeFragment,
      transparent: true, depthWrite: false, blending: AdditiveBlending,
    });
    net.add(new Points(nodeGeo, nodeMat));

    // Signal comets: `per` of them on every wire.
    const per = small ? 2 : 4;
    const cometPos = new Float32Array(edges * per * 2 * 3), cometB = new Float32Array(edges * per * 2 * 3), cometP = new Float32Array(edges * per * 2 * 3);
    const headPos = new Float32Array(edges * per * 3), headB = new Float32Array(edges * per * 3), headP = new Float32Array(edges * per * 3);
    for (let e = 0; e < edges; e++)
      for (let k = 0; k < per; k++) {
        const id = e * per + k;
        const phase = (k + ((Math.sin(e * 12.9898) * 43758.5453) % 1 + 1) % 1) / per;
        const speed = 0.16 + (((e * 7919) % 100) / 100) * 0.14;
        for (let end = 0; end < 2; end++) {
          const v = (id * 2 + end) * 3;
          cometPos.set(edgeA[e], v); cometB.set(edgeB[e], v); cometP.set([phase, speed, end], v);
        }
        headPos.set(edgeA[e], id * 3); headB.set(edgeB[e], id * 3); headP.set([phase, speed, 0], id * 3);
      }
    const cometGeo = new BufferGeometry();
    cometGeo.setAttribute("position", new BufferAttribute(cometPos, 3));
    cometGeo.setAttribute("aB", new BufferAttribute(cometB, 3));
    cometGeo.setAttribute("aP", new BufferAttribute(cometP, 3));
    const cometMat = new ShaderMaterial({
      uniforms: { uTime: { value: 0 } }, vertexShader: cometVertex, fragmentShader: cometFragment,
      transparent: true, depthWrite: false, blending: AdditiveBlending,
    });
    const comets = new LineSegments(cometGeo, cometMat);
    comets.frustumCulled = false;
    net.add(comets);

    const headGeo = new BufferGeometry();
    headGeo.setAttribute("position", new BufferAttribute(headPos, 3));
    headGeo.setAttribute("aB", new BufferAttribute(headB, 3));
    headGeo.setAttribute("aP", new BufferAttribute(headP, 3));
    const headMat = new ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uPR: { value: pr } }, vertexShader: headVertex, fragmentShader: headFragment,
      transparent: true, depthWrite: false, blending: AdditiveBlending,
    });
    const heads = new Points(headGeo, headMat);
    heads.frustumCulled = false;
    net.add(heads);

    // Faint dust around the network for depth.
    const dc = small ? 400 : 1100, dp = new Float32Array(dc * 3), dr = new Float32Array(dc);
    for (let i = 0; i < dc; i++) {
      const a = Math.random() * 6.2832, c = Math.random() * 2 - 1, s = Math.sqrt(1 - c * c), r = 1 + Math.random() * 0.9;
      dp.set([Math.cos(a) * s * 5.2 * r, c * 2.6 * r, Math.sin(a) * s * 3.4 * r], i * 3);
      dr[i] = Math.random();
    }
    const dustGeo = new BufferGeometry();
    dustGeo.setAttribute("position", new BufferAttribute(dp, 3));
    dustGeo.setAttribute("aR", new BufferAttribute(dr, 1));
    const dustMat = new ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uPR: { value: pr } }, vertexShader: dustVertex, fragmentShader: dustFragment,
      transparent: true, depthWrite: false, blending: AdditiveBlending,
    });
    const dust = new Points(dustGeo, dustMat);
    dust.frustumCulled = false;
    net.add(dust);

    let yNet = 0;
    const layout = () => {
      const w = el.clientWidth, h = el.clientHeight, aspect = w / h;
      renderer.setSize(w, h);
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      const tan = Math.tan((FOV * Math.PI) / 360);
      yNet = (0.5 - NET_Y) * 2 * tan * CAM_Z;
      // The network is ~8 wide and ~3.2 tall: fit the narrower of the two.
      const s = Math.min(1.05, (tan * CAM_Z * aspect * 2 * 0.86) / 8.4);
      net.scale.setScalar(s);
      net.position.y = yNet;
      if (still) draw(0);
    };

    const mouse = new Vector2(), target = new Vector2();
    const area = el.parentElement ?? el;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      target.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
    };
    if (!still) area.addEventListener("pointermove", move);

    let t = still ? 9 : 0;
    const draw = (dt: number) => {
      t += dt;
      for (const m of [nodeMat, cometMat, headMat, dustMat]) m.uniforms.uTime.value = t;
      mouse.lerp(target, 1 - Math.pow(0.01, dt || 0.016));
      const p = still ? 0 : Math.min(window.scrollY / Math.max(el.clientHeight, 1), 1);
      const intro = 1 - Math.pow(1 - Math.min(t / 2.4, 1), 4);
      net.rotation.y = Math.sin(t * 0.2) * 0.62 + mouse.x * 0.35;
      net.rotation.x = -0.1 + mouse.y * 0.14;
      camera.position.z = CAM_Z + (1 - intro) * 6 - p * 3;
      el.style.opacity = String(Math.min(1, intro * 1.4) * (1 - p * 0.9));
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
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(el);
    if (!still) raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      area.removeEventListener("pointermove", move);
      [wireGeo, nodeGeo, cometGeo, headGeo, dustGeo].forEach((g) => g.dispose());
      [wireMat, nodeMat, cometMat, headMat, dustMat].forEach((m) => m.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={host} className="hero-scene" aria-hidden="true" />;
}
