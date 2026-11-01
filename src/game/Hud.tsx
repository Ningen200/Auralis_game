import { useState, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { Pause, Play, Volume2, VolumeX, Sword, Shield, Zap, Footprints, Sparkles, Crosshair, Settings, BookOpen, X } from "lucide-react";
import type { AudioBus } from "@/game/audio";
import { beginRun, CHARACTERS, cycleTarget, selectCharacter, togglePause, WAVE_TOTAL, type CharacterId, type Phase, type Sim } from "@/game/sim";

export interface HudSnap {
  phase: Phase;
  hp: number;
  maxHp: number;
  energy: number;
  score: number;
  best: number;
  comboHits: number;
  wave: number;
  banner: string;
  bannerOn: boolean;
  skillCd: number;
  dodgeCd: number;
  parryCd: number;
  kills: number;
  targetName: string | null;
  targetHp: number;
  targetMaxHp: number;
  character: 0 | 1 | 2;
}

export function readSnap(sim: Sim): HudSnap {
  return {
    phase: sim.phase,
    hp: sim.player.hp,
    maxHp: sim.player.maxHp,
    energy: sim.player.energy,
    score: sim.score,
    best: sim.best,
    comboHits: sim.comboHits,
    wave: sim.wave,
    banner: sim.banner,
    bannerOn: sim.bannerT > 0,
    skillCd: sim.player.skillCd,
    dodgeCd: sim.player.dodgeCd,
    parryCd: sim.player.parryCd,
    kills: sim.kills,
    targetName: sim.targetId === null ? null : (() => {
      const target = sim.enemies.find((enemy) => enemy.id === sim.targetId && enemy.state !== "dead");
      return target ? (target.kind === "hound" ? "كلب الصدع" : target.kind === "wisp" ? "طيف" : "حارس الصدع") : null;
    })(),
    targetHp: sim.targetId === null ? 0 : (sim.enemies.find((enemy) => enemy.id === sim.targetId)?.hp ?? 0),
    targetMaxHp: sim.targetId === null ? 0 : (sim.enemies.find((enemy) => enemy.id === sim.targetId)?.maxHp ?? 0),
    character: sim.player.character,
  };
}

const SKILL_MAX = 5.6;
const DODGE_MAX = 0.82;

export function Hud({
  snap,
  simRef,
  audio,
  muted,
  onMute,
  onChange,
}: {
  snap: HudSnap;
  simRef: RefObject<Sim | null>;
  audio: AudioBus;
  muted: boolean;
  onMute: () => void;
  onChange: () => void;
}) {
  const sim = simRef.current;
  const [optionsOpen, setOptionsOpen] = useState(false);

  function gesture() {
    audio.unlock();
  }

  function edge(kind: "attack" | "dodge" | "skill" | "ult" | "parry") {
    gesture();
    const live = simRef.current;
    if (!live || live.phase !== "play") return;
    live.edge[kind] = true;
    onChange();
  }

  function start() {
    gesture();
    const live = simRef.current;
    if (!live) return;
    audio.unlock();
    beginRun(live);
    onChange();
  }

  function pause() {
    gesture();
    const live = simRef.current;
    if (!live) return;
    togglePause(live);
    onChange();
  }

  const playing = snap.phase === "play";
  const hpPct = Math.max(0, Math.min(100, (snap.hp / snap.maxHp) * 100));
  const low = snap.hp / snap.maxHp < 0.35;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col p-3 md:p-5">
      <div className="relative z-20 flex items-start justify-between gap-3">
        <div className={playing || snap.phase === "pause" ? "w-56 max-w-[70%]" : "w-56 opacity-0"}>
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-display text-sm text-foam">{["سيرا · SERA", "كايل · KAEL", "ليورا · LYRA"][snap.character]}</p>
            <p className="text-xs text-mist">
              {Math.ceil(snap.hp)} / {snap.maxHp}
            </p>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-ink-2">
            <div className={low ? "h-full bg-rift" : "h-full bg-tide"} style={{ width: `${hpPct}%` }} />
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-2">
            <div className="h-full bg-foam" style={{ width: `${snap.energy}%` }} />
          </div>
          <p className="mt-1 text-xs text-mist">الطاقة {Math.floor(snap.energy)}</p>
        </div>
        <div className="flex gap-2">
          {playing && (
            <button
              type="button"
              data-ui
              className="press pointer-events-auto rounded-full border border-tide/50 bg-panel px-3 text-xs font-semibold text-tide"
              onClick={() => {
                const live = simRef.current;
                if (!live) return;
                live.player.character = ((live.player.character + 1) % 3) as 0 | 1 | 2;
                live.player.hp = Math.min(live.player.maxHp, live.player.hp + 8);
                live.banner = ["سيرا · نصل الصدى", "كايل · حارس الشق", "ليورا · ناسجة الطاقة"][live.player.character];
                live.bannerT = 1.5;
                onChange();
              }}
              aria-label="تبديل الشخصية"
            >{["SERA", "KAEL", "LYRA"][(snap.character + 1) % 3]} ↻</button>
          )}
          <button
            type="button"
            data-ui
            className="press pointer-events-auto grid h-11 w-11 place-items-center rounded-full border border-line bg-panel text-foam"
            onClick={onMute}
            aria-label={muted ? "تشغيل الصوت" : "كتم الصوت"}
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          {playing && (
            <button
              type="button"
              data-ui
              className={`press pointer-events-auto rounded-full border px-3 h-11 text-xs font-semibold ${snap.targetName ? "border-tide bg-tide/20 text-tide" : "border-line bg-panel text-foam"}`}
              onClick={() => {
                const live = simRef.current;
                if (!live) return;
                cycleTarget(live);
                onChange();
              }}
              aria-label="قفل الهدف أو التبديل بين الأعداء"
            >{snap.targetName ? "تبديل الهدف" : "قفل الهدف"}</button>
          )}
          {(playing || snap.phase === "pause") && (
            <button
              type="button"
              data-ui
              className="press pointer-events-auto grid h-11 w-11 place-items-center rounded-full border border-line bg-panel text-foam"
              onClick={pause}
              aria-label={snap.phase === "pause" ? "متابعة" : "إيقاف"}
            >
              {snap.phase === "pause" ? <Play size={18} /> : <Pause size={18} />}
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-col items-center">
        {(playing || snap.phase === "pause") && (
          <p className="font-display text-sm tracking-wide text-mist">
            الموجة {snap.wave} / {WAVE_TOTAL}
            <span className="mx-2 text-line">·</span>
            {snap.score}
          </p>
        )}
        {snap.bannerOn && snap.banner && (
          <p className="rise mt-2 font-display text-2xl text-foam md:text-3xl">{snap.banner}</p>
        )}
        {playing && snap.comboHits > 1 && (
          <p className="mt-1 font-display text-xl text-tide">{snap.comboHits} سلسلة</p>
        )}
        {playing && snap.targetName && (
          <div className="mt-2 w-48 rounded-xl border border-tide/40 bg-ink/80 px-3 py-2 text-center shadow-lg">
            <div className="flex items-center justify-between text-xs text-foam">
              <span>{snap.targetName}</span><span>{Math.ceil(snap.targetHp)} / {snap.targetMaxHp}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-rift transition-[width]" style={{ width: `${Math.max(0, (snap.targetHp / Math.max(1, snap.targetMaxHp)) * 100)}%` }} />
            </div>
          </div>
        )}
      </div>

        {playing && (
          <div
            data-ui
            className="mobile-look-zone pointer-events-auto absolute top-20 right-0 bottom-28 z-0 w-1/2"
            onPointerDown={(e) => beginLook(e, sim)}
            onPointerMove={(e) => moveLook(e, sim)}
            onPointerUp={(e) => endLook(e)}
            onPointerCancel={(e) => endLook(e)}
            onLostPointerCapture={(e) => endLook(e)}
          />
        )}

        <div className="mobile-control-dock mt-auto flex items-end justify-between gap-3">
          {playing && (
            <div
              data-ui
              className="mobile-stick pointer-events-auto relative z-20 h-28 w-28 touch-none rounded-full border border-tide/50 bg-ink"
              onPointerDown={(e) => {
                gesture();
                const el = e.currentTarget;
                el.setPointerCapture(e.pointerId);
                moveStick(e, sim);
              }}
              onLostPointerCapture={(e) => releaseStick(e.currentTarget, sim)}
              onPointerMove={(e) => {
                if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
                moveStick(e, sim);
              }}
              onPointerUp={(e) => releaseStick(e.currentTarget, sim)}
              onPointerCancel={(e) => releaseStick(e.currentTarget, sim)}
            >
              <span className="nub absolute top-1/2 left-1/2 h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full bg-tide" />
            </div>
          )}

          <div className={playing ? "mobile-action-grid relative z-20 ms-auto grid grid-cols-2 gap-2" : "hidden"}>
          <Ability label="تهرّب" hint="Shift" ready={snap.dodgeCd <= 0} cd={snap.dodgeCd} max={DODGE_MAX} onPress={() => edge("dodge")} />
          <Ability label="صدّ" hint="L" ready={snap.parryCd <= 0} cd={snap.parryCd} max={1.25} onPress={() => edge("parry")} />
          <Ability label="مهارة" hint="E" ready={snap.skillCd <= 0} cd={snap.skillCd} max={SKILL_MAX} onPress={() => edge("skill")} />
          <Ability label="ضرب" hint="J" ready onPress={() => edge("attack")} />
          <Ability
            label="تحرير"
            hint="R"
            ready={snap.energy >= 100}
            onPress={() => edge("ult")}
            accent={snap.energy >= 100}
          />
        </div>
      </div>

      {snap.phase === "menu" && (
        <Menu mainMenu optionsOpen={optionsOpen} onOptions={() => setOptionsOpen((v) => !v)} onStart={start} best={snap.best} title="أوراليس" kicker="صدى النصل · AURALIS" body="حين انكسر ضوء القمر، استيقظ الصدع في قلب الجزيرة. اختر بطلك، ثم ابدأ رحلتك." action="ابدأ اللعب · START" selectedCharacter={snap.character} onSelectCharacter={(id) => { const live = simRef.current; if (live) { selectCharacter(live, id); onChange(); } }} />
      )}
      {snap.phase === "pause" && sim && (
        <Menu
          onStart={pause}
          best={snap.best}
          title="توقّف"
          kicker={`النتيجة ${snap.score}`}
          body="المشهد التالي: تعود المنارات إلى النبض، ويستيقظ حارس الصدع في عمق الجزيرة. التهرّب المثالي يبطئ الزمن ويمنحك فرصة للهجوم."
          action="متابعة"
        />
      )}
      {snap.phase === "win" && (
        <Menu
          onStart={start}
          best={Math.max(snap.best, snap.score)}
          title="الجزيرة هدأت"
          kicker={`${snap.kills} هزيمة · ${snap.score}`}
          body="عاد النبض إلى المنارات، لكن أصداء الصدع ما زالت تتردد خلف البحر. هذه ليست سوى بداية رحلة سيرا."
          action="مرة أخرى Start"
        />
      )}
      {snap.phase === "lose" && (
        <Menu
          onStart={start}
          best={snap.best}
          title="انقطع الصدى"
          kicker={`${snap.score} · الأفضل ${snap.best}`}
          body="الموجة لم تكتمل. اجمع بلّورات المد قبل أن يضيق الحصار."
          action="إعادة Start"
        />
      )}

      {snap.phase === "menu" && <Controls />}
    </div>
  );
}

function Ability({
  label, hint, ready, cd, max, onPress, accent,
}: {
  label: string; hint: string; ready: boolean; cd?: number; max?: number; onPress: () => void; accent?: boolean;
}) {
  const cooling = cd != null && max != null && cd > 0;
  const Icon = label === "ضرب" ? Sword : label === "صدّ" ? Shield : label === "تهرّب" ? Footprints : label === "مهارة" ? Zap : Sparkles;
  return (
    <button type="button" data-ui aria-label={label} title={label}
      className={accent ? "press pointer-events-auto relative grid h-14 w-14 place-items-center rounded-xl border border-tide bg-ink text-tide" : "press pointer-events-auto relative grid h-14 w-14 place-items-center overflow-hidden rounded-xl border border-tide/40 bg-ink text-foam"}
      onPointerDown={(e) => { e.stopPropagation(); onPress(); }}>
      {cooling && <span className="absolute inset-x-0 bottom-0 bg-ink" style={{ height: `${Math.min(100, (cd / max) * 100)}%` }} />}
      <span className="relative grid place-items-center gap-0.5"><Icon size={21} strokeWidth={2.1}/><span className="text-[9px] leading-none">{cooling ? cd.toFixed(1) : label}</span></span>
      <span className="sr-only">{label}{ready ? "" : " غير جاهزة"}</span>
    </button>
  );
}

function Menu({
  onStart, best, title, kicker, body, action, mainMenu = false, optionsOpen = false, onOptions, selectedCharacter, onSelectCharacter,
}: {
  onStart: () => void; best: number; title: string; kicker: string; body: string; action: string;
  mainMenu?: boolean; optionsOpen?: boolean; onOptions?: () => void; selectedCharacter?: CharacterId; onSelectCharacter?: (id: CharacterId) => void;
}) {
  return (
    <div className={mainMenu ? "auralis-main-menu pointer-events-auto absolute inset-0 z-30 flex items-center p-4 md:p-10" : "pointer-events-none absolute inset-0 flex items-end p-3 md:items-center md:p-8"}>
      <div className={mainMenu ? "auralis-menu-card rise pointer-events-auto w-full max-w-lg rounded-2xl p-5 md:p-8" : "rise pointer-events-auto w-full max-w-md rounded-xl border border-line bg-panel p-4 md:p-5"}>
        {mainMenu && <div className="auralis-mark"><span>✦</span></div>}
        <p className="font-display text-sm tracking-[.22em] text-tide">{kicker}</p>
        <h1 className="mt-2 font-display text-5xl font-semibold tracking-wide text-foam md:text-7xl">{title}</h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-mist md:text-base">{body}</p>
        {mainMenu && selectedCharacter !== undefined && onSelectCharacter && (
          <div className="mt-5 grid grid-cols-3 gap-2">
            {CHARACTERS.map((hero) => (
              <button key={hero.id} type="button" data-ui onClick={() => onSelectCharacter(hero.id)}
                className="rounded-xl border bg-black/20 p-2 text-left"
                style={{ borderColor: selectedCharacter === hero.id ? hero.color : "rgba(255,255,255,.12)", background: selectedCharacter === hero.id ? hero.color + "18" : "rgba(0,0,0,.2)" }}>
                <span className="mb-2 block h-1 rounded-full" style={{ background: hero.color }} />
                <span className="block font-display text-sm text-foam">{hero.name}</span>
                <span className="mt-1 block text-[10px] text-mist">{hero.role}</span>
                <span className="mt-2 block text-[10px] leading-relaxed text-mist">{hero.title}</span>
                {selectedCharacter === hero.id && <span className="mt-2 block text-[10px]" style={{ color: hero.color }}>✓ مختار</span>}
              </button>
            ))}
            <p className="col-span-3 text-xs leading-relaxed text-mist">{CHARACTERS[selectedCharacter].description}</p>
          </div>
        )}
        <div className="mt-6 grid gap-2">
          <button type="button" data-ui className="auralis-primary press flex h-14 w-full items-center justify-center gap-3 rounded-xl font-display text-base font-bold" onClick={onStart}><Play size={19} fill="currentColor"/> {action}</button>
          {mainMenu && <>
            <button type="button" data-ui className="auralis-secondary press flex h-12 w-full items-center justify-center gap-2 rounded-xl" onClick={onOptions}>{optionsOpen ? <X size={17}/> : <Settings size={17}/>} {optionsOpen ? "إغلاق الخيارات" : "Options · الخيارات"}</button>
            <div className={optionsOpen ? "auralis-options grid grid-cols-2 gap-2" : "hidden"}>
              <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm"><Volume2 size={17} className="mb-2 text-tide"/>الصوت والتحكم<br/><span className="text-xs text-mist">كتم الصوت من زر السماعة أثناء اللعب</span></div>
              <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm"><Crosshair size={17} className="mb-2 text-tide"/>الكاميرا<br/><span className="text-xs text-mist">اسحب يمين الشاشة لتدوير الكاميرا</span></div>
            </div>
          </>}
        </div>
        <p className="mt-4 text-xs text-mist">أفضل نتيجة <span className="text-foam">{best}</span></p>
      </div>
    </div>
  );
}

function Controls() {
  const rows = [
    ["WASD", "تحرك مع الكاميرا"],
    ["J أو نقرة", "سلسلة من ثلاث ضربات"],
    ["Q أو Tab", "قفل الهدف / تبديل العدو"],
    ["Shift", "تهرّب"],
    ["L", "صدّ مثالي / Counter"],
    ["E", "مهارة الصدى"],
    ["R", "تحرير عند امتلاء الطاقة"],
    ["سحب أيمن", "تدوير الكاميرا · Z / X"],
  ];
  return (
    <ul className="pointer-events-none absolute top-20 left-3 hidden gap-1 md:grid">
      {rows.map(([key, label]) => (
        <li key={key} className="text-xs text-mist">
          <span className="text-foam">{key}</span>
          <span className="mx-1 text-line">·</span>
          {label}
        </li>
      ))}
    </ul>
  );
}

function moveStick(e: ReactPointerEvent<HTMLDivElement>, sim: Sim | null) {
  if (!sim) return;
  const rect = e.currentTarget.getBoundingClientRect();
  const max = rect.width * 0.36;
  let dx = e.clientX - (rect.left + rect.width / 2);
  let dy = e.clientY - (rect.top + rect.height / 2);
  const len = Math.hypot(dx, dy) || 1;
  const clamped = Math.min(len, max);
  dx = (dx / len) * clamped;
  dy = (dy / len) * clamped;
  sim.stickX = dx / max;
  sim.stickY = -dy / max;
  const nub = e.currentTarget.querySelector(".nub");
  if (nub instanceof HTMLElement) nub.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
}

function releaseStick(el: HTMLDivElement, sim: Sim | null) {
  if (sim) {
    sim.stickX = 0;
    sim.stickY = 0;
  }
  const nub = el.querySelector(".nub");
  if (nub instanceof HTMLElement) nub.style.transform = "";
}

const look = { id: -1, x: 0, y: 0 };

function beginLook(e: ReactPointerEvent<HTMLDivElement>, sim: Sim | null) {
  if (!sim) return;
  if ((e.target as HTMLElement).closest("button")) return;
  look.id = e.pointerId;
  look.x = e.clientX;
  look.y = e.clientY;
  e.currentTarget.setPointerCapture(e.pointerId);
}

function moveLook(e: ReactPointerEvent<HTMLDivElement>, sim: Sim | null) {
  if (!sim || look.id !== e.pointerId) return;
  // Slightly lower touch sensitivity makes fine aiming easier on phones.
  const sensitivity = window.matchMedia("(orientation: landscape)").matches ? 1.35 : 1.2;
  sim.lookX += Math.max(-90, Math.min(90, e.clientX - look.x)) * sensitivity;
  sim.lookY += Math.max(-90, Math.min(90, e.clientY - look.y)) * sensitivity * 0.82;
  look.x = e.clientX;
  look.y = e.clientY;
}

function endLook(e: ReactPointerEvent<HTMLDivElement>) {
  if (look.id === e.pointerId) look.id = -1;
}
