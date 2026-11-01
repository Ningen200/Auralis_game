import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import type { RefObject } from "react";
import * as THREE from "three";
import type { AudioBus } from "@/game/audio";
import { readSnap, type HudSnap } from "@/game/Hud";
import {
  ARENA,
  frame,
  MAX_FLOATERS,
  MAX_PARTICLES,
  MAX_SHOTS,
  MAX_SHOCKS,
  MAX_SLASHES,
  type Sim,
} from "@/game/sim";

const dummy = new THREE.Object3D();
const tint = new THREE.Color();
const lookAt = new THREE.Vector3();
const camDesired = new THREE.Vector3();

const PILLARS = Array.from({ length: 10 }, (_, i) => {
  const a = (i / 10) * Math.PI * 2 + 0.35;
  const r = 23.5 + (i % 2) * 3.2;
  return { x: Math.cos(a) * r, z: Math.sin(a) * r, h: 2.2 + (i % 4) * 1.15, broken: i % 3 === 0, ry: a };
});

const MONOLITHS = [
  { x: 48, z: -18, h: 11, w: 2.2 },
  { x: -42, z: -36, h: 16, w: 3 },
  { x: 18, z: 52, h: 9, w: 2.4 },
  { x: -28, z: 46, h: 13, w: 1.8 },
  { x: 55, z: 24, h: 8, w: 2 },
];

function makeStoneTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const g = canvas.getContext("2d");
  if (!g) return null;
  g.fillStyle = "#121c22";
  g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "#1b3036";
  g.lineWidth = 3;
  for (let i = 1; i <= 7; i++) {
    g.beginPath();
    g.arc(256, 256, i * 34, 0, Math.PI * 2);
    g.stroke();
  }
  g.strokeStyle = "rgba(26,214,192,0.38)";
  g.lineWidth = 1.4;
  for (let i = 0; i < 16; i++) {
    let x = Math.random() * 512;
    let y = Math.random() * 512;
    g.beginPath();
    g.moveTo(x, y);
    for (let k = 0; k < 4; k++) {
      x += (Math.random() - 0.5) * 90;
      y += (Math.random() - 0.5) * 90;
      g.lineTo(x, y);
    }
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function Scene({
  simRef,
  audioRef,
  onSnap,
  floaterRoot,
  hurtRef,
  focusRef,
}: {
  simRef: RefObject<Sim | null>;
  audioRef: RefObject<AudioBus | null>;
  onSnap: (snap: HudSnap) => void;
  floaterRoot: RefObject<HTMLDivElement | null>;
  hurtRef: RefObject<HTMLDivElement | null>;
  focusRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <>
      <color attach="background" args={["#071018"]} />
      <fog attach="fog" args={["#071018", 18, 64]} />
      <SimDriver
        simRef={simRef}
        audioRef={audioRef}
        onSnap={onSnap}
        floaterRoot={floaterRoot}
        hurtRef={hurtRef}
        focusRef={focusRef}
      />
      <CameraRig simRef={simRef} />
      <hemisphereLight args={["#245058", "#0c1418", 0.62]} />
      <directionalLight
        position={[16, 24, 10]}
        intensity={1.45}
        color="#e7f4f1"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={2}
        shadow-camera-far={70}
        shadow-camera-left={-28}
        shadow-camera-right={28}
        shadow-camera-top={28}
        shadow-camera-bottom={-28}
        shadow-bias={-0.00035}
      />
      <directionalLight position={[-14, 10, -18]} intensity={0.75} color="#1ad6c0" />
      <Island />
      <Stars />
      <Hero simRef={simRef} />
      <Enemies simRef={simRef} />
      <Motes simRef={simRef} />
      <Slashes simRef={simRef} />
      <Shocks simRef={simRef} />
      <Shots simRef={simRef} />
      <Particles simRef={simRef} />
    </>
  );
}

function SimDriver({
  simRef,
  audioRef,
  onSnap,
  floaterRoot,
  hurtRef,
  focusRef,
}: {
  simRef: RefObject<Sim | null>;
  audioRef: RefObject<AudioBus | null>;
  onSnap: (snap: HudSnap) => void;
  floaterRoot: RefObject<HTMLDivElement | null>;
  hurtRef: RefObject<HTMLDivElement | null>;
  focusRef: RefObject<HTMLDivElement | null>;
}) {
  const seen = useRef(false);
  const prev = useRef({
    slash: 0,
    hit: 0,
    dodge: 0,
    perfect: 0,
    skill: 0,
    ult: 0,
    hurt: 0,
    die: 0,
    win: 0,
    lose: 0,
    heal: 0,
  });
  const acc = useRef(0);
  const sig = useRef("");
  const pool = useRef<HTMLDivElement[]>([]);
  const proj = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const root = floaterRoot.current;
    if (!root) return;
    const els: HTMLDivElement[] = [];
    for (let i = 0; i < MAX_FLOATERS; i++) {
      const el = document.createElement("div");
      el.className = "floater";
      el.style.display = "none";
      root.appendChild(el);
      els.push(el);
    }
    pool.current = els;
    return () => {
      for (const el of els) el.remove();
      pool.current = [];
    };
  }, [floaterRoot]);

  useFrame(({ camera, size }, dt) => {
    const sim = simRef.current;
    if (!sim) return;
    frame(sim, dt);
    const audio = audioRef.current;
    const c = sim.cues;
    if (!seen.current) {
      Object.assign(prev.current, c);
      seen.current = true;
    } else if (audio) {
      const p = prev.current;
      if (c.slash !== p.slash) audio.slash();
      if (c.hit !== p.hit) audio.hit();
      if (c.dodge !== p.dodge) audio.dodge();
      if (c.perfect !== p.perfect) audio.perfect();
      if (c.skill !== p.skill) audio.skill();
      if (c.ult !== p.ult) audio.ult();
      if (c.hurt !== p.hurt) audio.hurt();
      if (c.die !== p.die) audio.die();
      if (c.win !== p.win) audio.win();
      if (c.lose !== p.lose) audio.lose();
      if (c.heal !== p.heal) audio.heal();
      Object.assign(p, c);
    }
    if (hurtRef.current) hurtRef.current.style.opacity = sim.player.hurt > 0 ? "0.9" : "0";
    if (focusRef.current) focusRef.current.style.opacity = sim.focus > 0 ? "1" : "0";

    acc.current += dt;
    if (acc.current >= 0.08) {
      acc.current = 0;
      const snap = readSnap(sim);
      const next = `${snap.phase}|${snap.hp}|${snap.energy}|${snap.score}|${snap.best}|${snap.comboHits}|${snap.wave}|${snap.banner}|${snap.bannerOn}|${snap.skillCd.toFixed(1)}|${snap.dodgeCd.toFixed(1)}|${snap.kills}`;
      if (next !== sig.current) {
        sig.current = next;
        onSnap(snap);
      }
    }

    const els = pool.current;
    if (els.length === 0) return;
    for (let i = 0; i < MAX_FLOATERS; i++) {
      const f = sim.floaters[i];
      const el = els[i];
      if (!el) continue;
      if (!f?.alive) {
        el.style.display = "none";
        continue;
      }
      proj.set(f.x, f.y, f.z).project(camera);
      if (proj.z > 1) {
        el.style.display = "none";
        continue;
      }
      const x = (proj.x * 0.5 + 0.5) * size.width;
      const y = (-proj.y * 0.5 + 0.5) * size.height;
      el.style.display = "block";
      el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -120%)`;
      el.style.opacity = String(Math.max(0, f.life / f.max));
      el.style.color = f.bad ? "var(--color-rift)" : "var(--color-tide)";
      el.textContent = f.text;
    }
  });

  return null;
}

function CameraRig({ simRef }: { simRef: RefObject<Sim | null> }) {
  const camera = useThree((s) => s.camera);
  const smooth = useMemo(() => new THREE.Vector3(0, 6, 18), []);
  const armed = useRef(false);
  useFrame((_, dt) => {
    const sim = simRef.current;
    if (!sim) return;
    const p = sim.player;
    const yaw = sim.cam.yaw;
    const pitch = sim.cam.pitch;
    const dist = 6.15 + sim.cam.distKick * 1.6;
    const horiz = Math.cos(pitch) * dist;
    const vert = Math.sin(pitch) * dist + 1.05;
    const fx = -Math.sin(yaw);
    const fz = -Math.cos(yaw);
    let x = p.x - fx * horiz;
    let z = p.z - fz * horiz;
    let y = vert;
    const shake = sim.cam.trauma * sim.cam.trauma * sim.shakeScale;
    if (shake > 0) {
      x += (Math.random() - 0.5) * shake * 0.42;
      y += (Math.random() - 0.5) * shake * 0.25;
      z += (Math.random() - 0.5) * shake * 0.42;
    }
    camDesired.set(x, y, z);
    const k = armed.current ? 1 - Math.exp(-8 * Math.min(dt, 0.05)) : 1;
    armed.current = true;
    smooth.lerp(camDesired, k);
    camera.position.copy(smooth);
    const target = sim.targetId === null
      ? undefined
      : sim.enemies.find((enemy) => enemy.id === sim.targetId && enemy.state !== "dead");
    if (target) {
      // Keep the locked enemy inside the camera's focal area without snapping the camera.
      lookAt.set(p.x * 0.42 + target.x * 0.58, 1.18, p.z * 0.42 + target.z * 0.58);
    } else {
      lookAt.set(p.x + fx * 0.85, 1.22, p.z + fz * 0.85);
    }
    camera.lookAt(lookAt);
  });
  return null;
}

function Island() {
  const tex = useMemo(() => makeStoneTexture(), []);
  useEffect(() => () => tex?.dispose(), [tex]);
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.45, 0]}>
        <circleGeometry args={[78, 64]} />
        <meshStandardMaterial color="#08262c" roughness={0.18} metalness={0.45} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.2, 0]}>
        <ringGeometry args={[ARENA - 0.4, ARENA + 2.4, 72]} />
        <meshBasicMaterial color="#1ad6c0" transparent opacity={0.28} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[ARENA + 0.4, 72]} />
        <meshStandardMaterial color="#162830" map={tex ?? undefined} roughness={0.92} metalness={0.04} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.04, 0]}>
        <ringGeometry args={[4.2, 5.1, 48]} />
        <meshBasicMaterial color="#1ad6c0" transparent opacity={0.45} />
      </mesh>
      <mesh position={[0, 0.08, 0]} receiveShadow>
        <cylinderGeometry args={[5, 5.4, 0.16, 32]} />
        <meshStandardMaterial color="#1a3038" roughness={0.8} />
      </mesh>
      <mesh position={[32, 14, -24]}>
        <sphereGeometry args={[3.1, 24, 16]} />
        <meshBasicMaterial color="#e7f4f1" />
      </mesh>
      {PILLARS.map((p, i) => (
        <group key={i} position={[p.x, 0, p.z]} rotation={[p.broken ? 0.18 : 0, p.ry, p.broken ? 0.35 : 0]}>
          <mesh position={[0, p.h / 2, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.46, 0.72, p.h, 6]} />
            <meshStandardMaterial color="#1c2c34" roughness={0.94} />
          </mesh>
          <mesh position={[0, p.h + 0.12, 0]}>
            <boxGeometry args={[1.15, 0.28, 1.15]} />
            <meshStandardMaterial color="#243842" roughness={0.8} />
          </mesh>
        </group>
      ))}
      {MONOLITHS.map((m, i) => (
        <mesh key={i} position={[m.x, m.h / 2 - 1, m.z]} castShadow>
          <boxGeometry args={[m.w, m.h, m.w * 0.7]} />
          <meshStandardMaterial color="#102028" roughness={1} />
        </mesh>
      ))}
      <Reeds />
      <IslandLandmarks />
    </group>
  );
}

function IslandLandmarks() {
  const crystalRef = useRef<THREE.InstancedMesh>(null);
  const rockRef = useRef<THREE.InstancedMesh>(null);
  const treeRef = useRef<THREE.InstancedMesh>(null);
  const crystalGeo = useMemo(() => new THREE.OctahedronGeometry(0.62, 0), []);
  const rockGeo = useMemo(() => new THREE.DodecahedronGeometry(0.8, 0), []);
  const treeGeo = useMemo(() => new THREE.ConeGeometry(0.72, 3.8, 5), []);
  const crystalMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#48e8d4", emissive: "#159b91", emissiveIntensity: 1.15, roughness: 0.24, metalness: 0.3 }), []);
  const rockMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#263a42", roughness: 0.96 }), []);
  const treeMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#123b35", roughness: 0.9 }), []);
  useLayoutEffect(() => {
    const crystals = crystalRef.current;
    const rocks = rockRef.current;
    const trees = treeRef.current;
    if (!crystals || !rocks || !trees) return;
    for (let i = 0; i < 22; i++) {
      const a = i * 2.399;
      const r = 12 + (i % 5) * 4.1;
      dummy.position.set(Math.cos(a) * r, 0.55 + (i % 3) * 0.22, Math.sin(a) * r);
      dummy.rotation.set(0.12 * (i % 3), a, 0.18 * (i % 2));
      dummy.scale.set(0.65 + (i % 3) * 0.18, 0.8 + (i % 4) * 0.3, 0.65 + (i % 2) * 0.2);
      dummy.updateMatrix(); crystals.setMatrixAt(i, dummy.matrix);
      dummy.position.set(Math.cos(a + 0.4) * (r + 1.5), 0.1, Math.sin(a + 0.4) * (r + 1.5));
      dummy.rotation.set(i * 0.2, a, i * 0.13);
      dummy.scale.set(0.7 + (i % 4) * 0.25, 0.45 + (i % 3) * 0.22, 0.65 + (i % 2) * 0.2);
      dummy.updateMatrix(); rocks.setMatrixAt(i, dummy.matrix);
    }
    for (let i = 0; i < 14; i++) {
      const a = i * 2.4 + 0.6;
      const r = 22 + (i % 3) * 2.4;
      dummy.position.set(Math.cos(a) * r, 1.65, Math.sin(a) * r);
      dummy.rotation.set(0, a, 0);
      dummy.scale.set(0.9 + (i % 3) * 0.18, 0.8 + (i % 4) * 0.22, 0.9 + (i % 2) * 0.16);
      dummy.updateMatrix(); trees.setMatrixAt(i, dummy.matrix);
    }
    crystals.instanceMatrix.needsUpdate = true; rocks.instanceMatrix.needsUpdate = true; trees.instanceMatrix.needsUpdate = true;
  }, []);
  useEffect(() => () => { crystalGeo.dispose(); rockGeo.dispose(); treeGeo.dispose(); crystalMat.dispose(); rockMat.dispose(); treeMat.dispose(); }, []);
  return <>
    <instancedMesh ref={rockRef} args={[rockGeo, rockMat, 22]} castShadow receiveShadow />
    <instancedMesh ref={treeRef} args={[treeGeo, treeMat, 14]} castShadow />
    <instancedMesh ref={crystalRef} args={[crystalGeo, crystalMat, 22]} />
    {[-1, 1].map((side) => <group key={side} position={[side * 13, 0, -13]}>
      <mesh position={[0, 1.2, 0]}><cylinderGeometry args={[0.12, 0.18, 2.4, 7]} /><meshStandardMaterial color="#263d43" /></mesh>
      <pointLight position={[0, 2.3, 0]} color="#39e4d0" intensity={2.2} distance={7} />
      <mesh position={[0, 2.35, 0]}><octahedronGeometry args={[0.3, 0]} /><meshBasicMaterial color="#65fff0" /></mesh>
    </group>)}
  </>;
}

function Reeds() {
  const geo = useMemo(() => new THREE.ConeGeometry(0.14, 0.95, 4), []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#1a4638", roughness: 0.86 }), []);
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2 + 0.15;
      const r = 19.5 + (i % 4) * 1.15;
      dummy.position.set(Math.cos(a) * r, 0.45, Math.sin(a) * r);
      dummy.rotation.set(0, a, 0);
      dummy.scale.set(1, 0.7 + (i % 3) * 0.25, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, []);
  useEffect(() => () => {
    geo.dispose();
    mat.dispose();
  }, [geo, mat]);
  return <instancedMesh ref={ref} args={[geo, mat, 28]} frustumCulled={false} />;
}

function Stars() {
  const positions = useMemo(() => {
    const arr = new Float32Array(240 * 3);
    for (let i = 0; i < 240; i++) {
      const r = 60 + Math.random() * 30;
      const a = Math.random() * Math.PI * 2;
      arr[i * 3] = Math.cos(a) * r * (0.4 + Math.random());
      arr[i * 3 + 1] = 8 + Math.random() * 36;
      arr[i * 3 + 2] = Math.sin(a) * r;
    }
    return arr;
  }, []);
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#e7f4f1" size={0.12} sizeAttenuation />
    </points>
  );
}

function Hero({ simRef }: { simRef: RefObject<Sim | null> }) {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const coat = useRef<THREE.Group>(null);
  const sink = useRef(0);
  const ghosts = useRef([
    { x: 0, z: 0, yaw: 0, life: 0 },
    { x: 0, z: 0, yaw: 0, life: 0 },
    { x: 0, z: 0, yaw: 0, life: 0 },
  ]);
  const ghostRefs = useRef<(THREE.Group | null)[]>([]);
  const sample = useRef(0);
  const hurtMat = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((_, dt) => {
    const sim = simRef.current;
    const g = root.current;
    if (!sim || !g || !body.current) return;
    const p = sim.player;
    const capped = Math.min(dt, 0.05);
    if (sim.phase === "lose") sink.current = Math.min(1.3, sink.current + capped);
    else sink.current = 0;
    g.position.set(p.x, -sink.current * 0.8, p.z);
    g.rotation.y = p.yaw + Math.PI;
    const run = Math.min(1, p.speed / 7.4);
    const cycle = sim.time * (7 + run * 8);
    const attacking = p.attackT > 0;
    const attackU = attacking ? 1 - p.attackT / Math.max(0.01, p.swingDur) : 0;
    const arc = attacking ? Math.sin(attackU * Math.PI) : 0;
    if (legL.current && legR.current) {
      const swing = p.dodgeT > 0 || attacking ? 0 : Math.sin(cycle) * 0.7 * run;
      legL.current.rotation.x = swing;
      legR.current.rotation.x = -swing;
    }
    if (p.dodgeT > 0) {
      body.current.rotation.x = 0.95;
      body.current.position.y = -0.15;
      body.current.position.z = 0.2;
    } else {
      body.current.rotation.x = attacking ? -0.12 : 0;
      body.current.position.y = Math.sin(sim.time * 2.2) * 0.025;
      body.current.position.z = arc * 0.38;
    }
    if (armR.current) {
      const side = p.swingIndex === 1 ? -1 : 1;
      armR.current.rotation.x = attacking ? -0.4 - arc * 1.15 : -0.25 + Math.sin(sim.time * 1.6) * 0.05;
      armR.current.rotation.z = attacking ? side * arc * 0.9 : 0.15;
      armR.current.rotation.y = attacking ? side * arc * 0.8 : 0.2;
    }
    if (armL.current) {
      armL.current.rotation.x = -0.4 - run * 0.2;
      armL.current.rotation.z = attacking ? -0.4 : -0.2;
    }
    if (coat.current) coat.current.rotation.x = -run * 0.25 + (p.dodgeT > 0 ? -0.6 : 0);
    if (hurtMat.current) {
      const flash = p.hurt > 0 || p.ultT > 0;
      hurtMat.current.emissive.set(p.hurt > 0 ? "#ff5d73" : "#1ad6c0");
      hurtMat.current.emissiveIntensity = flash ? 0.85 : 0.18;
    }
    sample.current -= capped;
    if (p.dodgeT > 0 && sample.current <= 0) {
      sample.current = 0.045;
      const slot = ghosts.current;
      slot[2] = slot[1];
      slot[1] = slot[0];
      slot[0] = { x: p.x, z: p.z, yaw: p.yaw, life: 0.22 };
    }
    ghosts.current.forEach((ghost, i) => {
      const node = ghostRefs.current[i];
      if (!node) return;
      ghost.life -= capped;
      node.visible = ghost.life > 0;
      if (ghost.life <= 0) return;
      node.position.set(ghost.x, 0.9, ghost.z);
      node.rotation.y = ghost.yaw + Math.PI;
      const mat = (node.children[0] as THREE.Mesh).material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, ghost.life / 0.22) * 0.35;
    });
  });

  return (
    <group>
      <group ref={root} position={[0, 0, 7]}>
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, 0]}>
          <circleGeometry args={[0.48, 16]} />
          <meshBasicMaterial color="#05080c" transparent opacity={0.4} depthWrite={false} />
        </mesh>
        <group ref={legL} position={[-0.16, 0.78, 0]}>
          <mesh position={[0, -0.38, 0]} castShadow>
            <capsuleGeometry args={[0.09, 0.42, 4, 6]} />
            <meshStandardMaterial color="#142830" roughness={0.7} />
          </mesh>
        </group>
        <group ref={legR} position={[0.16, 0.78, 0]}>
          <mesh position={[0, -0.38, 0]} castShadow>
            <capsuleGeometry args={[0.09, 0.42, 4, 6]} />
            <meshStandardMaterial color="#142830" roughness={0.7} />
          </mesh>
        </group>
        <group ref={body}>
          <mesh position={[0, 1.12, 0]} castShadow>
            <capsuleGeometry args={[0.22, 0.42, 4, 8]} />
            <meshStandardMaterial ref={hurtMat} color="#16343c" roughness={0.55} metalness={0.12} emissive="#1ad6c0" />
          </mesh>
          <mesh position={[0, 1.58, 0]} castShadow>
            <sphereGeometry args={[0.18, 16, 12]} />
            <meshStandardMaterial color="#f0d0b8" roughness={0.62} />
          </mesh>
          <mesh position={[0, 1.66, -0.06]} rotation={[0.4, 0, 0]}>
            <boxGeometry args={[0.28, 0.16, 0.22]} />
            <meshStandardMaterial color="#102028" roughness={0.5} />
          </mesh>
          <mesh position={[0, 1.59, -0.12]} rotation={[0.22, 0, 0]}>
            <sphereGeometry args={[0.235, 12, 8]} />
            <meshStandardMaterial color="#102b35" roughness={0.78} />
          </mesh>
          <mesh position={[0, 1.22, 0.215]}>
            <octahedronGeometry args={[0.105, 0]} />
            <meshStandardMaterial color="#6dfff0" emissive="#1ad6c0" emissiveIntensity={1.5} metalness={0.45} />
          </mesh>
          <mesh position={[-0.25, 1.42, 0]} rotation={[0, 0, -0.22]}>
            <boxGeometry args={[0.22, 0.14, 0.28]} />
            <meshStandardMaterial color="#31515a" metalness={0.62} roughness={0.3} />
          </mesh>
          <mesh position={[0.25, 1.42, 0]} rotation={[0, 0, 0.22]}>
            <boxGeometry args={[0.22, 0.14, 0.28]} />
            <meshStandardMaterial color="#31515a" metalness={0.62} roughness={0.3} />
          </mesh>
          <mesh position={[0, 1.78, -0.02]} rotation={[0.5, 0, 0.2]}>
            <coneGeometry args={[0.08, 0.28, 4]} />
            <meshStandardMaterial color="#1ad6c0" emissive="#1ad6c0" emissiveIntensity={0.7} />
          </mesh>
          <mesh position={[-0.28, 1.28, 0]}>
            <boxGeometry args={[0.16, 0.1, 0.22]} />
            <meshStandardMaterial color="#102830" metalness={0.4} roughness={0.35} />
          </mesh>
          <group ref={armL} position={[0.28, 1.32, 0]}>
            <mesh position={[0.02, -0.22, 0.05]} castShadow>
              <capsuleGeometry args={[0.06, 0.28, 3, 6]} />
              <meshStandardMaterial color="#d8b79a" roughness={0.6} />
            </mesh>
          </group>
          <group ref={armR} position={[-0.3, 1.34, 0.04]}>
            <mesh position={[0, -0.16, 0.04]}>
              <capsuleGeometry args={[0.065, 0.26, 3, 6]} />
              <meshStandardMaterial color="#d8b79a" roughness={0.6} />
            </mesh>
            <group position={[0, -0.34, 0.08]} rotation={[0.15, 0, 0]}>
              <mesh position={[0, 0.5, 0]} castShadow>
                <boxGeometry args={[0.085, 1.22, 0.19]} />
                <meshStandardMaterial
                  color="#f4fffb"
                  metalness={0.72}
                  roughness={0.22}
                  emissive="#1ad6c0"
                  emissiveIntensity={0.55}
                />
              </mesh>
              <mesh position={[0, 0.02, 0]}>
                <boxGeometry args={[0.3, 0.07, 0.25]} />
                <meshStandardMaterial color="#0e1c22" metalness={0.5} roughness={0.4} />
              </mesh>
              <mesh position={[0, 0.13, 0]}>
                <boxGeometry args={[0.28, 0.06, 0.08]} />
                <meshStandardMaterial color="#d8fff9" emissive="#1ad6c0" emissiveIntensity={0.9} />
              </mesh>
            </group>
          </group>
          <group ref={coat} position={[0, 1.05, -0.12]}>
            <mesh position={[-0.12, -0.28, 0]} rotation={[0.25, 0, 0.08]}>
              <boxGeometry args={[0.16, 0.55, 0.05]} />
              <meshStandardMaterial color="#0f242c" roughness={0.7} />
            </mesh>
            <mesh position={[0.12, -0.3, 0.02]} rotation={[0.3, 0, -0.1]}>
              <boxGeometry args={[0.16, 0.6, 0.05]} />
              <meshStandardMaterial color="#0f242c" roughness={0.7} />
            </mesh>
          </group>
        </group>
        {/* Auralis protagonist redesign: layered silver hair, tailored coat, face and relic details */}
        <group position={[0, 0, 0]}>
          {/* Face details */}
          <mesh position={[-0.075, 1.585, 0.164]}><sphereGeometry args={[0.018, 10, 8]} /><meshBasicMaterial color="#17242b" /></mesh>
          <mesh position={[0.075, 1.585, 0.164]}><sphereGeometry args={[0.018, 10, 8]} /><meshBasicMaterial color="#17242b" /></mesh>
          <mesh position={[0, 1.535, 0.17]}><sphereGeometry args={[0.014, 8, 6]} /><meshStandardMaterial color="#b97872" roughness={0.8} /></mesh>
          {/* Sculpted pale-silver hairstyle */}
          <mesh position={[0, 1.755, -0.005]} scale={[1.08, 0.72, 0.98]}><sphereGeometry args={[0.205, 18, 14]} /><meshStandardMaterial color="#d9e4e5" roughness={0.42} metalness={0.12} /></mesh>
          {[-1, -0.52, 0, 0.52, 1].map((v, i) => (
            <mesh key={`fringe-${i}`} position={[v * 0.115, 1.68 - Math.abs(v) * 0.018, 0.12]} rotation={[0.12, 0, v * -0.28]}>
              <coneGeometry args={[0.075, 0.25 + (i % 2) * 0.045, 7]} />
              <meshStandardMaterial color={i === 2 ? "#f1f5ef" : "#c4d5d8"} roughness={0.38} metalness={0.1} />
            </mesh>
          ))}
          {[ -1, 1 ].map((side) => (
            <mesh key={`tail-${side}`} position={[side * 0.17, 1.48, -0.12]} rotation={[0.1, 0, side * -0.12]}>
              <capsuleGeometry args={[0.055, 0.42, 4, 7]} />
              <meshStandardMaterial color="#aebfc5" roughness={0.48} />
            </mesh>
          ))}
          {/* High collar, layered coat tails and silver trim */}
          <mesh position={[0, 1.37, 0.01]} rotation={[0.12, 0, 0]}><torusGeometry args={[0.205, 0.035, 6, 16]} /><meshStandardMaterial color="#dce9e7" metalness={0.38} roughness={0.3} /></mesh>
          <mesh position={[-0.12, 0.79, -0.16]} rotation={[0.12, 0, 0.08]}><boxGeometry args={[0.2, 0.78, 0.075]} /><meshStandardMaterial color="#172d39" roughness={0.5} /></mesh>
          <mesh position={[0.12, 0.78, -0.16]} rotation={[0.12, 0, -0.08]}><boxGeometry args={[0.2, 0.78, 0.075]} /><meshStandardMaterial color="#172d39" roughness={0.5} /></mesh>
          <mesh position={[0, 1.02, 0.224]}><boxGeometry args={[0.28, 0.055, 0.025]} /><meshStandardMaterial color="#d4e2df" metalness={0.7} roughness={0.28} /></mesh>
          <mesh position={[0, 0.94, 0.24]}><octahedronGeometry args={[0.055, 0]} /><meshStandardMaterial color="#70fff0" emissive="#1ad6c0" emissiveIntensity={1.8} metalness={0.55} /></mesh>
          {/* Asymmetric shoulder armor and forearm guards */}
          <mesh position={[-0.3, 1.43, -0.015]} rotation={[0.1, 0, -0.18]}><sphereGeometry args={[0.16, 12, 9]} /><meshStandardMaterial color="#a8c2c5" metalness={0.72} roughness={0.26} /></mesh>
          <mesh position={[-0.3, 1.45, 0.12]} rotation={[0, 0, -0.18]}><boxGeometry args={[0.19, 0.055, 0.035]} /><meshStandardMaterial color="#e5f0e9" metalness={0.7} roughness={0.24} /></mesh>
          <mesh position={[0.31, 1.12, 0.1]} rotation={[0, 0, 0.12]}><boxGeometry args={[0.13, 0.22, 0.13]} /><meshStandardMaterial color="#9eb9bb" metalness={0.72} roughness={0.25} /></mesh>
          {/* Waist sash and hanging charm */}
          <mesh position={[0, 0.91, 0.015]}><torusGeometry args={[0.205, 0.035, 6, 18]} /><meshStandardMaterial color="#b8c8c5" metalness={0.7} roughness={0.3} /></mesh>
          <mesh position={[0.19, 0.72, 0.12]} rotation={[0, 0, -0.3]}><boxGeometry args={[0.045, 0.32, 0.035]} /><meshStandardMaterial color="#6bded2" emissive="#1ad6c0" emissiveIntensity={0.35} /></mesh>
          {/* Boots */}
          {[-1, 1].map((side) => <group key={`boot-${side}`} position={[side * 0.16, 0.13, 0.055]}>
            <mesh position={[0, 0, 0.035]}><boxGeometry args={[0.19, 0.16, 0.31]} /><meshStandardMaterial color="#0b1821" roughness={0.62} /></mesh>
            <mesh position={[0, 0.095, -0.015]}><cylinderGeometry args={[0.095, 0.11, 0.12, 8]} /><meshStandardMaterial color="#91aaad" metalness={0.65} roughness={0.3} /></mesh>
          </group>)}
        </group>
        <pointLight position={[0, 1.4, 0.2]} color="#1ad6c0" intensity={7} distance={11} decay={2} />
      </group>
      {[0, 1, 2].map((i) => (
        <group key={i} ref={(n) => { ghostRefs.current[i] = n; }} visible={false}>
          <mesh>
            <capsuleGeometry args={[0.2, 0.7, 3, 6]} />
            <meshBasicMaterial color="#1ad6c0" transparent opacity={0.3} depthWrite={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Enemies({ simRef }: { simRef: RefObject<Sim | null> }) {
  return (
    <group>
      {Array.from({ length: 8 }, (_, i) => (
        <EnemySlot key={i} index={i} simRef={simRef} />
      ))}
    </group>
  );
}

function EnemySlot({ index, simRef }: { index: number; simRef: RefObject<Sim | null> }) {
  const root = useRef<THREE.Group>(null);
  const hound = useRef<THREE.Group>(null);
  const wisp = useRef<THREE.Group>(null);
  const warden = useRef<THREE.Group>(null);
  const legs = useRef<(THREE.Group | null)[]>([]);
  const bar = useRef<THREE.Group>(null);
  const fill = useRef<THREE.Mesh>(null);
  const tel = useRef<THREE.Mesh>(null);
  const flash = useRef<THREE.MeshBasicMaterial>(null);
  const shards = useRef<THREE.Group>(null);
  const camera = useThree((s) => s.camera);

  useFrame(() => {
    const sim = simRef.current;
    const g = root.current;
    if (!sim || !g) return;
    const e = sim.enemies[index];
    const alive = !!e && e.deadT < 1.05;
    g.visible = alive;
    if (!e || !alive) return;
    const bob = e.state === "chase" ? Math.sin(sim.time * 9 + e.id) * 0.05 : 0;
    g.position.set(e.x, bob - Math.min(e.deadT, 0.8) * 0.55, e.z);
    g.rotation.y = e.yaw + Math.PI;
    let lean = 0;
    if (e.state === "windup") lean = -0.35;
    if (e.state === "strike") lean = 0.5;
    if (e.state === "stagger") lean = Math.sin(e.timer * 28) * 0.35;
    if (e.state === "dead") lean = 1.1;
    g.rotation.x = lean;
    if (hound.current) hound.current.visible = e.kind === "hound";
    if (wisp.current) wisp.current.visible = e.kind === "wisp";
    if (warden.current) warden.current.visible = e.kind === "warden";
    if (e.kind === "hound") {
      const swing = e.state === "chase" ? Math.sin(sim.time * 12 + e.id) * 0.6 : 0;
      legs.current.forEach((leg, i) => {
        if (leg) leg.rotation.x = i % 2 === 0 ? swing : -swing;
      });
    }
    if (shards.current && e.kind === "wisp") shards.current.rotation.y = sim.time * 1.8 + e.id;
    if (tel.current) {
      const show = e.kind !== "wisp" && (e.state === "windup" || e.state === "strike");
      tel.current.visible = show;
      tel.current.scale.setScalar(e.kind === "warden" ? 1.7 : 1);
      const mat = tel.current.material as THREE.MeshBasicMaterial;
      mat.opacity = e.state === "strike" ? 0.5 : 0.22 + Math.sin(sim.time * 22) * 0.08;
    }
    if (flash.current) flash.current.opacity = Math.min(0.7, e.flash * 5);
    if (bar.current && fill.current) {
      const showBar = e.state !== "dead" && e.hp < e.maxHp;
      bar.current.visible = showBar;
      if (showBar) {
        bar.current.position.y = e.kind === "warden" ? 2.55 : e.kind === "wisp" ? 1.85 : 1.25;
        bar.current.lookAt(camera.position);
        const ratio = Math.max(0, e.hp / e.maxHp);
        fill.current.scale.x = Math.max(0.04, ratio);
        fill.current.position.x = (ratio - 1) * 0.42;
        const mat = fill.current.material as THREE.MeshBasicMaterial;
        mat.color.set(ratio < 0.35 ? "#ff5d73" : "#1ad6c0");
      }
    }
  });

  return (
    <group ref={root} visible={false}>
      <mesh ref={tel} position={[0, 0.05, 1.15]} rotation-x={-Math.PI / 2} visible={false}>
        <circleGeometry args={[0.95, 20]} />
        <meshBasicMaterial color="#ff5d73" transparent opacity={0.3} depthWrite={false} />
      </mesh>
      <group ref={hound}>
        <mesh position={[0, 0.48, 0.05]} castShadow>
          <capsuleGeometry args={[0.22, 0.55, 4, 8]} />
          <meshStandardMaterial color="#2a161c" roughness={0.72} />
        </mesh>
        <mesh position={[0, 0.62, 0.48]} castShadow>
          <sphereGeometry args={[0.2, 12, 10]} />
          <meshStandardMaterial color="#3a1c24" roughness={0.6} />
        </mesh>
        <mesh position={[0.08, 0.7, 0.62]}>
          <sphereGeometry args={[0.035, 8, 6]} />
          <meshBasicMaterial color="#ff5d73" />
        </mesh>
        <mesh position={[-0.08, 0.7, 0.62]}>
          <sphereGeometry args={[0.035, 8, 6]} />
          <meshBasicMaterial color="#ff5d73" />
        </mesh>
        {[
          [-0.18, 0.32, 0.28],
          [0.18, 0.32, 0.28],
          [-0.18, 0.32, -0.28],
          [0.18, 0.32, -0.28],
        ].map((pos, i) => (
          <group key={i} ref={(n) => { legs.current[i] = n; }} position={pos as [number, number, number]}>
            <mesh position={[0, -0.16, 0]}>
              <capsuleGeometry args={[0.05, 0.18, 3, 4]} />
              <meshStandardMaterial color="#1a1014" roughness={0.8} />
            </mesh>
          </group>
        ))}
      </group>
      <group ref={wisp}>
        <mesh position={[0, 1.25, 0]}>
          <icosahedronGeometry args={[0.38, 0]} />
          <meshStandardMaterial color="#14383c" emissive="#1ad6c0" emissiveIntensity={0.85} roughness={0.28} metalness={0.2} />
        </mesh>
        <group ref={shards} position={[0, 1.25, 0]}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[Math.cos((i / 3) * Math.PI * 2) * 0.62, Math.sin(i) * 0.12, Math.sin((i / 3) * Math.PI * 2) * 0.62]}>
              <octahedronGeometry args={[0.1, 0]} />
              <meshBasicMaterial color="#ff5d73" />
            </mesh>
          ))}
        </group>
      </group>
      <group ref={warden}>
        <mesh position={[0, 1.05, 0]} castShadow>
          <capsuleGeometry args={[0.42, 0.7, 4, 8]} />
          <meshStandardMaterial color="#243038" roughness={0.58} metalness={0.28} />
        </mesh>
        <mesh position={[0, 1.15, 0.32]}>
          <sphereGeometry args={[0.16, 12, 10]} />
          <meshStandardMaterial color="#ff5d73" emissive="#ff5d73" emissiveIntensity={0.9} />
        </mesh>
        <mesh position={[0, 1.95, 0]} castShadow>
          <boxGeometry args={[0.46, 0.4, 0.42]} />
          <meshStandardMaterial color="#1a242c" roughness={0.5} metalness={0.35} />
        </mesh>
        <mesh position={[-0.55, 1.55, 0]}>
          <boxGeometry args={[0.38, 0.22, 0.38]} />
          <meshStandardMaterial color="#121c22" metalness={0.4} roughness={0.4} />
        </mesh>
        <mesh position={[0.55, 1.55, 0]}>
          <boxGeometry args={[0.38, 0.22, 0.38]} />
          <meshStandardMaterial color="#121c22" metalness={0.4} roughness={0.4} />
        </mesh>
        <mesh position={[-0.72, 1.15, 0.1]} rotation={[0, 0, 0.4]}>
          <boxGeometry args={[0.16, 0.7, 0.16]} />
          <meshStandardMaterial color="#2a3840" metalness={0.35} roughness={0.45} />
        </mesh>
        <mesh position={[0.72, 1.15, 0.1]} rotation={[0, 0, -0.4]}>
          <boxGeometry args={[0.16, 0.7, 0.16]} />
          <meshStandardMaterial color="#2a3840" metalness={0.35} roughness={0.45} />
        </mesh>
      </group>
      <mesh>
        <sphereGeometry args={[0.7, 10, 8]} />
        <meshBasicMaterial ref={flash} color="#f4fffb" transparent opacity={0} depthWrite={false} />
      </mesh>
      <group ref={bar} visible={false}>
        <mesh>
          <planeGeometry args={[0.92, 0.08]} />
          <meshBasicMaterial color="#101a22" />
        </mesh>
        <mesh ref={fill} position={[0, 0, 0.01]}>
          <planeGeometry args={[0.84, 0.045]} />
          <meshBasicMaterial color="#1ad6c0" />
        </mesh>
      </group>
    </group>
  );
}

function Motes({ simRef }: { simRef: RefObject<Sim | null> }) {
  const refs = useRef<(THREE.Group | null)[]>([]);
  useFrame(() => {
    const sim = simRef.current;
    if (!sim) return;
    sim.motes.forEach((m, i) => {
      const g = refs.current[i];
      if (!g) return;
      g.visible = m.alive;
      if (!m.alive) return;
      g.position.set(m.x, 0.85 + Math.sin(sim.time * 2.4 + i) * 0.12, m.z);
      g.rotation.y = sim.time * 0.8 + i;
    });
  });
  return (
    <group>
      {Array.from({ length: 3 }, (_, i) => (
        <group key={i} ref={(n) => { refs.current[i] = n; }} position={[[-6.5, 7.2, -2.4][i], 0.85, [1.5, -1.2, -8.5][i]]}>
          <mesh>
            <octahedronGeometry args={[0.26, 0]} />
            <meshStandardMaterial color="#d9fff8" emissive="#1ad6c0" emissiveIntensity={0.9} roughness={0.2} />
          </mesh>
          <pointLight color="#1ad6c0" intensity={3} distance={5} decay={2} />
        </group>
      ))}
    </group>
  );
}

function Slashes({ simRef }: { simRef: RefObject<Sim | null> }) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(() => {
    const sim = simRef.current;
    if (!sim) return;
    for (let i = 0; i < MAX_SLASHES; i++) {
      const mesh = refs.current[i];
      const s = sim.slashes[i];
      if (!mesh || !s) continue;
      mesh.visible = s.alive;
      if (!s.alive) continue;
      mesh.position.set(s.x, s.y, s.z);
      mesh.rotation.set(s.kind === 1 ? 1.05 : 0.15, s.yaw + Math.PI, s.kind === 2 ? 0.4 : 0.35);
      const k = Math.max(0, s.life / s.max);
      const scl = s.radius * (0.75 + (1 - k) * 0.5);
      mesh.scale.set(scl, scl * (s.kind === 1 ? 0.55 : 0.8), 1);
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.12 + k * 0.8;
      mat.color.set(s.kind === 0 ? "#e7f4f1" : "#1ad6c0");
    }
  });
  return (
    <group>
      {Array.from({ length: MAX_SLASHES }, (_, i) => (
        <mesh key={i} ref={(n) => { refs.current[i] = n; }} visible={false}>
          <torusGeometry args={[1, 0.075, 6, 20, Math.PI * 1.2]} />
          <meshBasicMaterial color="#1ad6c0" transparent opacity={0.8} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function Shocks({ simRef }: { simRef: RefObject<Sim | null> }) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(() => {
    const sim = simRef.current;
    if (!sim) return;
    for (let i = 0; i < MAX_SHOCKS; i++) {
      const mesh = refs.current[i];
      const s = sim.shocks[i];
      if (!mesh || !s) continue;
      mesh.visible = s.alive;
      if (!s.alive) continue;
      mesh.position.set(s.x, 0.08, s.z);
      mesh.scale.setScalar(Math.max(0.2, s.r));
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, s.life / s.max) * 0.75;
    }
  });
  return (
    <group>
      {Array.from({ length: MAX_SHOCKS }, (_, i) => (
        <mesh key={i} ref={(n) => { refs.current[i] = n; }} rotation-x={-Math.PI / 2} visible={false}>
          <ringGeometry args={[0.82, 1, 32]} />
          <meshBasicMaterial color="#ff5d73" transparent opacity={0.7} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function Shots({ simRef }: { simRef: RefObject<Sim | null> }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.SphereGeometry(0.18, 8, 6), []);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ff5d73" }), []);
  useEffect(() => () => {
    geo.dispose();
    mat.dispose();
  }, [geo, mat]);
  useLayoutEffect(() => {
    if (ref.current) ref.current.count = 0;
  }, []);
  useFrame(() => {
    const sim = simRef.current;
    const mesh = ref.current;
    if (!sim || !mesh) return;
    let n = 0;
    for (const s of sim.shots) {
      if (!s.alive) continue;
      dummy.position.set(s.x, s.y, s.z);
      dummy.scale.setScalar(1);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(n, dummy.matrix);
      n++;
    }
    mesh.count = n;
    mesh.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[geo, mat, MAX_SHOTS]} frustumCulled={false} />;
}

function Particles({ simRef }: { simRef: RefObject<Sim | null> }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.SphereGeometry(1, 5, 4), []);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false }), []);
  useEffect(() => () => {
    geo.dispose();
    mat.dispose();
  }, [geo, mat]);
  useLayoutEffect(() => {
    if (ref.current) ref.current.count = 0;
  }, []);
  useFrame(() => {
    const sim = simRef.current;
    const mesh = ref.current;
    if (!sim || !mesh) return;
    let n = 0;
    for (const p of sim.particles) {
      if (p.life <= 0) continue;
      dummy.position.set(p.x, Math.max(0.04, p.y), p.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(p.size * Math.max(0.2, p.life / p.max));
      dummy.updateMatrix();
      mesh.setMatrixAt(n, dummy.matrix);
      tint.setRGB(p.r, p.g, p.b);
      mesh.setColorAt(n, tint);
      n++;
      if (n >= MAX_PARTICLES) break;
    }
    mesh.count = n;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[geo, mat, MAX_PARTICLES]} frustumCulled={false} />;
}
