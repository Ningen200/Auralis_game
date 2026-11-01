import { Canvas } from "@react-three/fiber";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import * as THREE from "three";
import { AudioBus } from "@/game/audio";
import { Hud, readSnap, type HudSnap } from "@/game/Hud";
import { createSim, cycleTarget, togglePause, type Sim } from "@/game/sim";
import { Scene } from "@/game/World";

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      setKeys?: (codes: string[]) => void;
    };
  }
}

function sameSnap(a: HudSnap, b: HudSnap) {
  return (
    a.phase === b.phase &&
    a.hp === b.hp &&
    a.maxHp === b.maxHp &&
    a.energy === b.energy &&
    a.score === b.score &&
    a.best === b.best &&
    a.comboHits === b.comboHits &&
    a.wave === b.wave &&
    a.banner === b.banner &&
    a.bannerOn === b.bannerOn &&
    a.skillCd.toFixed(1) === b.skillCd.toFixed(1) &&
    a.dodgeCd.toFixed(1) === b.dodgeCd.toFixed(1) &&
    a.kills === b.kills &&
    a.targetName === b.targetName &&
    Math.ceil(a.targetHp) === Math.ceil(b.targetHp) &&
    Math.ceil(a.targetMaxHp) === Math.ceil(b.targetMaxHp)
  );
}

export function GameApp() {
  const simRef = useRef<Sim | null>(null);
  if (!simRef.current) simRef.current = createSim();
  const audioRef = useRef<AudioBus | null>(null);
  if (!audioRef.current) audioRef.current = new AudioBus();
  const [snap, setSnap] = useState<HudSnap>(() => readSnap(simRef.current as Sim));
  const [muted, setMuted] = useState(false);
  const floaterRoot = useRef<HTMLDivElement>(null);
  const hurtRef = useRef<HTMLDivElement>(null);
  const focusRef = useRef<HTMLDivElement>(null);
  const drag = useRef<number | null>(null);
  const last = useRef({ x: 0, y: 0 });

  const publish = useCallback(() => {
    const sim = simRef.current;
    if (!sim) return;
    setSnap((prev) => {
      const next = readSnap(sim);
      return sameSnap(prev, next) ? prev : next;
    });
  }, []);

  const onSnap = useCallback((next: HudSnap) => {
    setSnap((prev) => (sameSnap(prev, next) ? prev : next));
  }, []);

  useEffect(() => {
    try {
      if (localStorage.getItem("auralis-mute") === "1") {
        setMuted(true);
        audioRef.current?.setMuted(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const sim = simRef.current;
    const audio = audioRef.current;
    if (!sim || !audio) return;
    window.__controlsTest = {
      getYaw: () => sim.player.yaw,
      getSpeed: () => sim.player.speed,
      setKeys: (codes: string[]) => {
        sim.injected = codes.length ? new Set(codes) : null;
      },
    };
    const down = (e: KeyboardEvent) => {
      audio.unlock();
      if (e.code === "Space") e.preventDefault();
      sim.keys.add(e.code);
      if (e.repeat) return;
      if (e.code === "Escape" && (sim.phase === "play" || sim.phase === "pause")) {
        togglePause(sim);
        setSnap(readSnap(sim));
        return;
      }
      if (sim.phase !== "play") return;
      if (e.code === "KeyJ" || e.code === "KeyF") sim.edge.attack = true;
      if (e.code === "ShiftLeft" || e.code === "ShiftRight" || e.code === "Space" || e.code === "KeyK") {
        sim.edge.dodge = true;
      }
      if (e.code === "KeyE") sim.edge.skill = true;
      if (e.code === "KeyQ" || e.code === "Tab") { e.preventDefault(); cycleTarget(sim); setSnap(readSnap(sim)); }
      if (e.code === "KeyR") sim.edge.ult = true;
    };
    const up = (e: KeyboardEvent) => {
      sim.keys.delete(e.code);
    };
    const blur = () => sim.keys.clear();
    const vis = () => {
      if (document.hidden) sim.keys.clear();
      audio.resume();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    document.addEventListener("visibilitychange", vis);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      document.removeEventListener("visibilitychange", vis);
      delete window.__controlsTest;
    };
  }, []);

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("[data-ui]")) return;
    audioRef.current?.unlock();
    const sim = simRef.current;
    if (!sim) return;
    if (e.button === 2 || e.button === 1) {
      drag.current = e.pointerId;
      last.current = { x: e.clientX, y: e.clientY };
    } else if (e.button === 0 && sim.phase === "play") {
      sim.edge.attack = true;
    }
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const sim = simRef.current;
    if (!sim || drag.current !== e.pointerId) return;
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };
    sim.lookX += dx * 1.65;
    sim.lookY += dy * 1.3;
  }

  function onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    if (drag.current === e.pointerId) drag.current = null;
  }

  return (
    <div
      className="relative h-full w-full touch-none select-none"
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <Canvas
        className="h-full w-full"
        shadows={typeof window === "undefined" || window.innerWidth >= 700}
        dpr={typeof window !== "undefined" && window.innerWidth < 700 ? [0.75, 1.1] : [1, 1.5]}
        camera={{ fov: 42, near: 0.12, far: 220, position: [0, 5, 16] }}
        gl={{ antialias: true, powerPreference: "high-performance", stencil: false }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.12;
        }}
      >
        <Scene
          simRef={simRef}
          audioRef={audioRef}
          onSnap={onSnap}
          floaterRoot={floaterRoot}
          hurtRef={hurtRef}
          focusRef={focusRef}
        />
      </Canvas>
      <div ref={hurtRef} className="hurt-veil pointer-events-none absolute inset-0 opacity-0" />
      <div ref={focusRef} className="focus-veil pointer-events-none absolute inset-0 opacity-0" />
      <div ref={floaterRoot} className="pointer-events-none absolute inset-0 overflow-hidden" />
      <Hud
        snap={snap}
        simRef={simRef}
        audio={audioRef.current}
        muted={muted}
        onMute={() => {
          const next = !audioRef.current?.muted;
          audioRef.current?.setMuted(next);
          setMuted(next);
          try {
            localStorage.setItem("auralis-mute", next ? "1" : "0");
          } catch {
            /* ignore */
          }
        }}
        onChange={publish}
      />
    </div>
  );
}
