import {
  AdditiveBlending, BufferGeometry, Color, Float32BufferAttribute, Group,
  Mesh, PerspectiveCamera, PlaneGeometry, Points, PointsMaterial, Scene,
  ShaderMaterial, Vector2, Vector3, Raycaster, SphereGeometry, MeshBasicMaterial, WebGLRenderer,
} from "three";
import { createTreeGeometry } from "./tree-geometry";
import { groundFragment, groundVertex, particleFragment, particleVertex } from "./tree-shaders";

export type SceneController = { setPaused: (paused: boolean) => void; hitTest: (x: number, y: number) => boolean; dispose: () => void };

export function mountTreeScene(canvas: HTMLCanvasElement, onFailure: () => void): SceneController {
  const compact = window.innerWidth < 768;
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: "high-performance" });
  const tokens = getComputedStyle(document.documentElement);
  const colorToken = (name: string) => new Color(tokens.getPropertyValue(name).trim());
  renderer.setClearColor(colorToken("--forest-950"), 0);
  const scene = new Scene();
  const camera = new PerspectiveCamera(40, 1, .1, 80);
  const tree = new Group();
  scene.add(tree);
  const uniforms = {
    uTime: { value: 0 }, uPixelRatio: { value: 1 }, uState: { value: 0 },
    uTownship: { value: 0 }, uLedger: { value: 0 }, uReveal: { value: 0 },
    uPointer: { value: new Vector2() }, uHover: { value: 0 },
    uHoverRadius: { value: .3 }, uAspect: { value: 1 },
    uEmerald: { value: colorToken("--mint-400") },
    uCanopy: { value: colorToken("--canopy-200") },
    uProof: { value: colorToken("--proof-400") },
  };
  const geometry = createTreeGeometry(compact);
  const material = new ShaderMaterial({ uniforms, vertexShader: particleVertex, fragmentShader: particleFragment, transparent: true, depthWrite: false, blending: AdditiveBlending });
  const particles = new Points(geometry, material);
  particles.frustumCulled = false;
  tree.add(particles);
  // A low-poly picking volume avoids raycasting tens of thousands of particles.
  const pickGeometry = new SphereGeometry(1, 12, 8);
  const pickMaterial = new MeshBasicMaterial({ visible: false });
  const crown = new Mesh(pickGeometry, pickMaterial);
  crown.position.set(0, 3.65, 0);
  crown.scale.set(3.1, 1.7, 3.1);
  const trunkPick = new Mesh(pickGeometry, pickMaterial);
  trunkPick.position.y = 1.2;
  trunkPick.scale.set(.35, 1.25, .35);
  tree.add(crown, trunkPick);
  const raycaster = new Raycaster();
  const pickPointer = new Vector2();
  const groundGeometry = new PlaneGeometry(10, 10);
  const groundMaterial = new ShaderMaterial({ uniforms, vertexShader: groundVertex, fragmentShader: groundFragment, transparent: true, depthWrite: false, blending: AdditiveBlending });
  const ground = new Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -.08;
  tree.add(ground);

  let seed = 111;
  const random = () => ((seed = seed * 16807 % 2147483647) - 1) / 2147483646;
  const atmospherePositions = new Float32Array((compact ? 260 : 700) * 3);
  for (let i = 0; i < atmospherePositions.length; i += 3) {
    atmospherePositions[i] = (random() - .5) * 22;
    atmospherePositions[i + 1] = random() * 12 - 3;
    atmospherePositions[i + 2] = (random() - .5) * 16;
  }
  const atmosphereGeometry = new BufferGeometry();
  atmosphereGeometry.setAttribute("position", new Float32BufferAttribute(atmospherePositions, 3));
  const atmosphereMaterial = new PointsMaterial({ color: colorToken("--sage-400"), size: .014, transparent: true, opacity: .3, depthWrite: false, blending: AdditiveBlending });
  const atmosphere = new Points(atmosphereGeometry, atmosphereMaterial);
  scene.add(atmosphere);

  const root = canvas.closest<HTMLElement>(".cinematic-story");
  if (!root) throw new Error("The scene requires a cinematic-story container.");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const pointer = { x: 0, y: 0 };
  const follow = { x: 0, y: 0 };
  const hover = { active: false, target: new Vector2() };
  const lookAt = new Vector3(0, 2.15, 0);
  let paused = false;
  let visible = true;
  let disposed = false;
  let failed = false;
  let frame = 0;
  let previous = 0;
  let elapsed = 0;
  let progress = 0;
  let targetProgress = 0;
  let viewportWidth = 0;
  let viewportHeight = 0;
  let rootTop = 0;
  let scrollRange = 1;
  let ledgerStart = .75;
  let ledgerEnd = .9;
  const smoothstep = (a: number, b: number, value: number) => {
    const t = Math.max(0, Math.min(1, (value - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };

  const readScroll = () => {
    hover.active = false;
    targetProgress = Math.max(0, Math.min(1, (window.scrollY - rootTop) / scrollRange));
    root.style.setProperty("--story-progress", String(targetProgress));
  };
  const draw = (now: number) => {
    frame = 0;
    if (disposed || failed || !visible || document.hidden) return;
    const dt = Math.min((now - previous) / 1000 || .016, .05);
    previous = now;
    const still = paused || reducedMotion.matches;
    if (!still) {
      elapsed += dt;
      const ease = 1 - Math.exp(-dt * 4.8);
      follow.x += (pointer.x - follow.x) * ease;
      follow.y += (pointer.y - follow.y) * ease;
      progress += (targetProgress - progress) * ease;
      // Frame-rate independent easing, without CPU-side particle updates.
      uniforms.uPointer.value.lerp(hover.target, 1 - Math.exp(-dt * 18));
      uniforms.uHover.value += ((hover.active ? 1 : 0) - uniforms.uHover.value) * (1 - Math.exp(-dt * 9));
    }
    const p = reducedMotion.matches ? 0 : progress;
    const township = smoothstep(.4, .6, p) * (1 - smoothstep(.76, .94, p));
    const ledger = smoothstep(ledgerStart, ledgerEnd, p);
    const phone = viewportWidth < 768;
    const angle = (.12 + p * 1.05) * (1 - ledger) + .42 * ledger + follow.x * .1;
    // Fit the whole crown on portrait screens instead of cropping a desktop camera.
    const portraitDistance = Math.max(14, 6.8 / (2 * Math.tan(Math.PI / 9) * camera.aspect));
    const distance = (phone ? portraitDistance * (1 + ledger * .2) : 12) - Math.sin(p * Math.PI) * .6;
    camera.position.set(Math.sin(angle) * distance, 4.2 + township * 5 + follow.y * .4, Math.cos(angle) * distance);
    lookAt.set(0, 2.9 - township * 2.1, 0);
    camera.lookAt(lookAt);
    // Composition moves from right of the hero to left of the first chapter.
    const chapter = Math.min(2, Math.floor(p * 3));
    const stops = [.16, -.17, .16, -.17];
    const shift = phone ? 0 : stops[chapter] + (stops[chapter + 1] - stops[chapter]) * smoothstep(0, 1, p * 3 - chapter);
    camera.setViewOffset(viewportWidth, viewportHeight, -shift * viewportWidth, phone ? viewportHeight * .075 : 0, viewportWidth, viewportHeight);
    uniforms.uTime.value = elapsed;
    uniforms.uState.value = Math.sin(p * Math.PI);
    uniforms.uTownship.value = township;
    uniforms.uLedger.value = ledger;
    uniforms.uReveal.value = reducedMotion.matches ? 1 : smoothstep(0, 1.8, elapsed);
    tree.rotation.y = follow.x * .08;
    tree.rotation.z = -follow.x * .012;
    tree.position.y = .12 + Math.sin(elapsed * .55) * .025;
    atmosphere.rotation.y = elapsed * .007;
    atmosphereMaterial.opacity = (.2 + Math.sin(p * Math.PI) * .1) * uniforms.uReveal.value;
    renderer.render(scene, camera);
    canvas.dataset.progress = p.toFixed(3);
    canvas.dataset.township = township.toFixed(3);
    canvas.dataset.ledger = ledger.toFixed(3);
    if (!still) frame = requestAnimationFrame(draw);
  };
  const schedule = () => { if (!frame && !disposed && !failed && visible && !document.hidden) frame = requestAnimationFrame(draw); };
  const resize = () => {
    const bounds = canvas.getBoundingClientRect();
    viewportWidth = Math.max(1, bounds.width);
    viewportHeight = Math.max(1, bounds.height);
    const ratio = Math.min(window.devicePixelRatio || 1, viewportWidth < 768 ? 1.25 : 1.7);
    renderer.setPixelRatio(ratio);
    renderer.setSize(viewportWidth, viewportHeight, false);
    uniforms.uPixelRatio.value = ratio;
    camera.aspect = viewportWidth / viewportHeight;
    uniforms.uAspect.value = camera.aspect;
    uniforms.uHoverRadius.value = Math.min(.45, 280 / viewportHeight);
    camera.updateProjectionMatrix();
    rootTop = root.getBoundingClientRect().top + window.scrollY;
    scrollRange = Math.max(1, root.offsetHeight - window.innerHeight);
    const proof = root.querySelector<HTMLElement>("#lifecycle");
    if (proof) {
      const proofTop = proof.getBoundingClientRect().top + window.scrollY - rootTop;
      // Measure the actual chapter so mobile's taller story panels stay in sync.
      ledgerStart = Math.max(0, (proofTop - viewportHeight * .8) / scrollRange);
      ledgerEnd = Math.max(ledgerStart + .01, (proofTop - viewportHeight * .12) / scrollRange);
    }
    readScroll();
    schedule();
  };
  const hitTest = (x: number, y: number) => {
    if (disposed || failed || uniforms.uTownship.value > .25 || uniforms.uLedger.value > .25) return false;
    const bounds = canvas.getBoundingClientRect();
    pickPointer.set((x - bounds.left) / bounds.width * 2 - 1, -(y - bounds.top) / bounds.height * 2 + 1);
    raycaster.setFromCamera(pickPointer, camera);
    return raycaster.intersectObjects([crown, trunkPick], false).length > 0;
  };
  const pointerMove = (event: PointerEvent) => {
    if (event.target === canvas && event.pointerType !== "touch") canvas.style.cursor = hitTest(event.clientX, event.clientY) ? "pointer" : "default";
    if (event.pointerType === "touch") { hover.active = false; return; }
    if (paused || reducedMotion.matches) return;
    hover.active = event.target === canvas;
    if (hover.active) {
      const bounds = canvas.getBoundingClientRect();
      hover.target.set((event.clientX - bounds.left) / bounds.width * 2 - 1, -(event.clientY - bounds.top) / bounds.height * 2 + 1);
      // Enter at the actual cursor, then ease subsequent movement.
      if (uniforms.uHover.value < .001) uniforms.uPointer.value.copy(hover.target);
    }
    pointer.x = event.clientX / window.innerWidth * 2 - 1;
    pointer.y = event.clientY / window.innerHeight * 2 - 1;
  };
  const resetPointer = () => { pointer.x = 0; pointer.y = 0; hover.active = false; };
  const visibility = () => {
    if (document.hidden) { resetPointer(); uniforms.uHover.value = 0; cancelAnimationFrame(frame); frame = 0; }
    else { previous = performance.now(); schedule(); }
  };
  const motionChange = () => { follow.x = 0; follow.y = 0; resetPointer(); schedule(); };
  const contextLost = (event: Event) => {
    event.preventDefault(); failed = true; cancelAnimationFrame(frame); frame = 0; onFailure();
  };
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) { previous = performance.now(); schedule(); }
    else { cancelAnimationFrame(frame); frame = 0; }
  });
  intersection.observe(root);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  window.addEventListener("scroll", readScroll, { passive: true });
  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", pointerMove, { passive: true });
  window.addEventListener("blur", resetPointer);
  document.documentElement.addEventListener("pointerleave", resetPointer);
  document.addEventListener("visibilitychange", visibility);
  canvas.addEventListener("webglcontextlost", contextLost);
  reducedMotion.addEventListener("change", motionChange);
  canvas.dataset.engine = "three-webgl";
  canvas.dataset.particles = String(geometry.getAttribute("position").count);
  resize();

  return {
    hitTest,
    setPaused(value) {
      paused = value;
      if (value) { hover.active = false; uniforms.uHover.value = 0; }
      previous = performance.now(); schedule();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      intersection.disconnect(); resizeObserver.disconnect();
      window.removeEventListener("scroll", readScroll);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", pointerMove);
      window.removeEventListener("blur", resetPointer);
      document.documentElement.removeEventListener("pointerleave", resetPointer);
      document.removeEventListener("visibilitychange", visibility);
      canvas.removeEventListener("webglcontextlost", contextLost);
      reducedMotion.removeEventListener("change", motionChange);
      geometry.dispose(); material.dispose(); groundGeometry.dispose(); groundMaterial.dispose();
      pickGeometry.dispose(); pickMaterial.dispose();
      atmosphereGeometry.dispose(); atmosphereMaterial.dispose(); renderer.dispose();
      canvas.style.removeProperty("cursor");
      root.style.removeProperty("--story-progress");
    },
  };
}
