export const ARENA = 34;
export const RUN_SPEED = 7.4;
export const MAX_PARTICLES = 180;
export const MAX_SHOTS = 24;
export const MAX_SLASHES = 8;
export const MAX_SHOCKS = 4;
export const MAX_FLOATERS = 16;
export const MAX_ENEMIES = 8;

export type Phase = "menu" | "play" | "pause" | "win" | "lose";
export type Kind = "hound" | "wisp" | "warden";
export type EState = "chase" | "windup" | "strike" | "recover" | "stagger" | "dead";

export interface Enemy {
  id: number;
  kind: Kind;
  x: number;
  z: number;
  yaw: number;
  hp: number;
  maxHp: number;
  state: EState;
  timer: number;
  cool: number;
  flash: number;
  deadT: number;
  radius: number;
  speed: number;
  range: number;
  struck: boolean;
  special: number;
  hitSwing: number;
}

export interface Shot {
  alive: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vz: number;
  life: number;
  r: number;
  dmg: number;
}

export interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  max: number;
  size: number;
  r: number;
  g: number;
  b: number;
}

export interface Floater {
  alive: boolean;
  x: number;
  y: number;
  z: number;
  text: string;
  life: number;
  max: number;
  bad: boolean;
}

export interface Slash {
  alive: boolean;
  x: number;
  y: number;
  z: number;
  yaw: number;
  life: number;
  max: number;
  radius: number;
  kind: number;
}

export interface Shock {
  alive: boolean;
  x: number;
  z: number;
  r: number;
  life: number;
  max: number;
  hit: boolean;
}

export interface Mote {
  x: number;
  z: number;
  alive: boolean;
  t: number;
}

export interface Cues {
  slash: number;
  hit: number;
  dodge: number;
  perfect: number;
  skill: number;
  ult: number;
  hurt: number;
  die: number;
  win: number;
  lose: number;
  heal: number;
}

export interface Sim {
  phase: Phase;
  time: number;
  hitstop: number;
  player: {
    x: number;
    z: number;
    yaw: number;
    character: 0 | 1 | 2;
    speed: number;
    hp: number;
    maxHp: number;
    energy: number;
    invuln: number;
    parryT: number;
    parryCd: number;
    dodgeT: number;
    dodgeCd: number;
    dodgeYaw: number;
    attackT: number;
    combo: number;
    comboWindow: number;
    swingIndex: number;
    swingDur: number;
    bufferAttack: number;
    skillCd: number;
    ultT: number;
    hurt: number;
    swingId: number;
    stepT: number;
  };
  cam: { yaw: number; pitch: number; trauma: number; distKick: number };
  lookIdle: number;
  targetId: number | null;
  lookX: number;
  lookY: number;
  stickX: number;
  stickY: number;
  keys: Set<string>;
  injected: Set<string> | null;
  edge: { attack: boolean; dodge: boolean; skill: boolean; ult: boolean; parry: boolean };
  enemies: Enemy[];
  shots: Shot[];
  particles: Particle[];
  floaters: Floater[];
  slashes: Slash[];
  shocks: Shock[];
  motes: Mote[];
  wave: number;
  waveWait: number;
  score: number;
  comboHits: number;
  comboTimer: number;
  focus: number;
  best: number;
  kills: number;
  banner: string;
  bannerT: number;
  cues: Cues;
  shakeScale: number;
  nextId: number;
}

const WAVES: { kind: Kind; n: number }[][] = [
  [{ kind: "hound", n: 3 }],
  [
    { kind: "hound", n: 2 },
    { kind: "wisp", n: 2 },
  ],
  [
    { kind: "hound", n: 2 },
    { kind: "wisp", n: 2 },
    { kind: "warden", n: 1 },
  ],
  [
    { kind: "hound", n: 3 },
    { kind: "wisp", n: 2 },
    { kind: "warden", n: 1 },
  ],
  [
    { kind: "hound", n: 2 },
    { kind: "wisp", n: 3 },
    { kind: "warden", n: 1 },
  ],
  [
    { kind: "hound", n: 3 },
    { kind: "wisp", n: 2 },
    { kind: "warden", n: 2 },
  ],
];

export const WAVE_TOTAL = WAVES.length;

export type CharacterId = 0 | 1 | 2;

export const CHARACTERS = [
  { id: 0 as const, name: "سيرا", title: "نصل الصدى", role: "متوازنة", color: "#1ad6c0", maxHp: 120, speed: 1, attack: 1, dodge: 1, skillCooldown: 5.6, description: "مقاتلة متوازنة تعتمد على صدّ الهجمات وضربات النصل الواسعة." },
  { id: 1 as const, name: "كايل", title: "حارس الشق", role: "قوة ودفاع", color: "#ff875c", maxHp: 150, speed: 0.88, attack: 1.38, dodge: 0.82, skillCooldown: 7.2, description: "مقاتل ثقيل؛ أبطأ حركةً لكنه يوجه ضربات أقوى ويصمد أمام الضرر." },
  { id: 2 as const, name: "ليورا", title: "ناسجة الطاقة", role: "سرعة وطاقة", color: "#b58cff", maxHp: 105, speed: 1.18, attack: 0.82, dodge: 1.3, skillCooldown: 4.2, description: "سريعة ورشيقة، تطلق شظايا طاقة من مسافة وتستعيد موقعها بسرعة." },
] as const;

export function selectCharacter(sim: Sim, character: CharacterId) {
  const p = sim.player;
  const ratio = p.maxHp > 0 ? p.hp / p.maxHp : 1;
  p.character = character;
  p.maxHp = CHARACTERS[character].maxHp;
  p.hp = Math.max(1, Math.min(p.maxHp, Math.round(p.maxHp * ratio)));
  sim.banner = CHARACTERS[character].name + " · " + CHARACTERS[character].title;
  sim.bannerT = 1.8;
}

const SWINGS = [
  { dur: 0.32, from: 0.22, to: 0.08, range: 2.35, arc: 0.55, dmg: 14, kb: 0.28, stagger: 0, radius: 1.55 },
  { dur: 0.34, from: 0.24, to: 0.08, range: 2.5, arc: 0.42, dmg: 18, kb: 0.34, stagger: 0, radius: 1.7 },
  { dur: 0.46, from: 0.32, to: 0.1, range: 3.05, arc: 0.2, dmg: 34, kb: 0.85, stagger: 0.32, radius: 2.15 },
];

const SCORE: Record<Kind, number> = { hound: 120, wisp: 160, warden: 800 };

const TIDE = { r: 0.1, g: 0.84, b: 0.75 };
const SPARK = { r: 0.92, g: 0.98, b: 0.96 };
const RIFT = { r: 1, g: 0.36, b: 0.45 };

export function wrapAngle(a: number) {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

export function dampAngle(current: number, target: number, k: number, dt: number) {
  const diff = wrapAngle(target - current);
  return current + diff * (1 - Math.exp(-k * dt));
}

function emptyCues(): Cues {
  return {
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
  };
}

function readBest() {
  try {
    if (typeof localStorage === "undefined") return 0;
    const n = Number(localStorage.getItem("auralis-best-v1") || 0);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function saveBest(sim: Sim) {
  if (sim.score > sim.best) sim.best = sim.score;
  try {
    localStorage.setItem("auralis-best-v1", String(sim.best));
  } catch {
    /* ignore quota */
  }
}

export function createSim(): Sim {
  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  return {
    phase: "menu",
    time: 0,
    hitstop: 0,
    player: {
      x: 0,
      z: 7,
      yaw: 0,
      character: 0,
      speed: 0,
      hp: 120,
      maxHp: 120,
      energy: 25,
      invuln: 0,
      parryT: 0,
      parryCd: 0,
      dodgeT: 0,
      dodgeCd: 0,
      dodgeYaw: 0,
      attackT: 0,
      combo: 0,
      comboWindow: 0,
      swingIndex: 0,
      swingDur: SWINGS[0].dur,
      bufferAttack: 0,
      skillCd: 0,
      ultT: 0,
      hurt: 0,
      swingId: 0,
      stepT: 0,
    },
    cam: { yaw: 0.4, pitch: 0.46, trauma: 0, distKick: 0 },
    lookIdle: 2,
    targetId: null,
    lookX: 0,
    lookY: 0,
    stickX: 0,
    stickY: 0,
    keys: new Set(),
    injected: null,
    edge: { attack: false, dodge: false, skill: false, ult: false, parry: false },
    enemies: [],
    shots: Array.from({ length: MAX_SHOTS }, () => ({
      alive: false,
      x: 0,
      y: 0,
      z: 0,
      vx: 0,
      vz: 0,
      life: 0,
      r: 0.35,
      dmg: 0,
    })),
    particles: Array.from({ length: MAX_PARTICLES }, () => ({
      x: 0,
      y: 0,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      life: 0,
      max: 1,
      size: 0.12,
      r: 1,
      g: 1,
      b: 1,
    })),
    floaters: Array.from({ length: MAX_FLOATERS }, () => ({
      alive: false,
      x: 0,
      y: 0,
      z: 0,
      text: "",
      life: 0,
      max: 1,
      bad: false,
    })),
    slashes: Array.from({ length: MAX_SLASHES }, () => ({
      alive: false,
      x: 0,
      y: 1.1,
      z: 0,
      yaw: 0,
      life: 0,
      max: 0.3,
      radius: 1,
      kind: 0,
    })),
    shocks: Array.from({ length: MAX_SHOCKS }, () => ({
      alive: false,
      x: 0,
      z: 0,
      r: 0,
      life: 0,
      max: 0.7,
      hit: false,
    })),
    motes: [
      { x: -6.5, z: 1.5, alive: true, t: 0 },
      { x: 7.2, z: -1.2, alive: true, t: 0 },
      { x: -2.4, z: -8.5, alive: true, t: 0 },
    ],
    wave: 1,
    waveWait: -1,
    score: 0,
    comboHits: 0,
    comboTimer: 0,
    focus: 0,
    best: readBest(),
    kills: 0,
    banner: "",
    bannerT: 0,
    cues: emptyCues(),
    shakeScale: reduce ? 0 : 1,
    nextId: 1,
  };
}

function held(sim: Sim, code: string) {
  const src = sim.injected ?? sim.keys;
  return src.has(code);
}

function moveAxes(sim: Sim) {
  const yaw = sim.cam.yaw;
  const fx = -Math.sin(yaw);
  const fz = -Math.cos(yaw);
  const rx = Math.cos(yaw);
  const rz = -Math.sin(yaw);
  let ix = 0;
  let iz = 0;
  if (held(sim, "KeyW") || held(sim, "ArrowUp")) {
    ix += fx;
    iz += fz;
  }
  if (held(sim, "KeyS") || held(sim, "ArrowDown")) {
    ix -= fx;
    iz -= fz;
  }
  if (held(sim, "KeyD") || held(sim, "ArrowRight")) {
    ix += rx;
    iz += rz;
  }
  if (held(sim, "KeyA") || held(sim, "ArrowLeft")) {
    ix -= rx;
    iz -= rz;
  }
  if (!sim.injected) {
    ix += rx * sim.stickX + fx * sim.stickY;
    iz += rz * sim.stickX + fz * sim.stickY;
  }
  const len = Math.hypot(ix, iz);
  if (len > 1) {
    ix /= len;
    iz /= len;
  }
  return { ix, iz, moving: len > 0.12 };
}

function emit(
  sim: Sim,
  x: number,
  y: number,
  z: number,
  vx: number,
  vy: number,
  vz: number,
  life: number,
  size: number,
  r: number,
  g: number,
  b: number,
) {
  const p = sim.particles.find((q) => q.life <= 0);
  if (!p) return;
  p.x = x;
  p.y = y;
  p.z = z;
  p.vx = vx;
  p.vy = vy;
  p.vz = vz;
  p.life = life;
  p.max = life;
  p.size = size;
  p.r = r;
  p.g = g;
  p.b = b;
}

function burst(
  sim: Sim,
  x: number,
  y: number,
  z: number,
  n: number,
  color: { r: number; g: number; b: number },
  speed: number,
) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const up = 0.6 + Math.random() * 3.2;
    emit(
      sim,
      x,
      y,
      z,
      Math.cos(a) * speed * (0.4 + Math.random()),
      up,
      Math.sin(a) * speed * (0.4 + Math.random()),
      0.28 + Math.random() * 0.28,
      0.08 + Math.random() * 0.12,
      color.r,
      color.g,
      color.b,
    );
  }
}

function floatText(sim: Sim, x: number, y: number, z: number, text: string, bad: boolean) {
  const f = sim.floaters.find((q) => !q.alive);
  if (!f) return;
  f.alive = true;
  f.x = x;
  f.y = y;
  f.z = z;
  f.text = text;
  f.life = 0.7;
  f.max = 0.7;
  f.bad = bad;
}

function spawnSlash(sim: Sim, x: number, z: number, yaw: number, radius: number, kind: number, y = 1.15) {
  const s = sim.slashes.find((q) => !q.alive);
  if (!s) return;
  s.alive = true;
  const fx = -Math.sin(yaw);
  const fz = -Math.cos(yaw);
  s.x = x + fx * 0.7;
  s.z = z + fz * 0.7;
  s.y = y;
  s.yaw = yaw;
  s.life = kind === 0 ? 0.18 : 0.32;
  s.max = s.life;
  s.radius = radius;
  s.kind = kind;
}

function spawnShot(sim: Sim, x: number, z: number, tx: number, tz: number, dmg: number) {
  const s = sim.shots.find((q) => !q.alive);
  if (!s) return;
  const dx = tx - x;
  const dz = tz - z;
  const len = Math.hypot(dx, dz) || 1;
  s.alive = true;
  s.x = x;
  s.y = 1.15;
  s.z = z;
  s.vx = (dx / len) * 8.4;
  s.vz = (dz / len) * 8.4;
  s.life = 3.2;
  s.r = 0.34;
  s.dmg = dmg;
}

function spawnShock(sim: Sim, x: number, z: number) {
  const s = sim.shocks.find((q) => !q.alive);
  if (!s) return;
  s.alive = true;
  s.x = x;
  s.z = z;
  s.r = 0.4;
  s.life = 0.72;
  s.max = 0.72;
  s.hit = false;
}

function makeEnemy(kind: Kind, x: number, z: number, id: number): Enemy {
  const stats = {
    hound: { hp: 54, speed: 4.55, radius: 0.58, range: 1.9 },
    wisp: { hp: 36, speed: 3.35, radius: 0.5, range: 16 },
    warden: { hp: 300, speed: 2.7, radius: 0.92, range: 2.65 },
  }[kind];
  return {
    id,
    kind,
    x,
    z,
    yaw: Math.atan2(-x, -z),
    hp: stats.hp,
    maxHp: stats.hp,
    state: "chase",
    timer: 0,
    cool: 0.35 + Math.random() * 0.55,
    flash: 0,
    deadT: 0,
    radius: stats.radius,
    speed: stats.speed,
    range: stats.range,
    struck: false,
    special: 3 + Math.random(),
    hitSwing: -1,
  };
}

function spawnWave(sim: Sim) {
  const spec = WAVES[Math.min(WAVES.length, sim.wave) - 1] ?? WAVES[0];
  const list: Enemy[] = [];
  let n = 0;
  for (const group of spec) n += group.n;
  let i = 0;
  for (const group of spec) {
    for (let k = 0; k < group.n; k++) {
      const ang = (i / n) * Math.PI * 2 + sim.wave * 0.7;
      const rad = 11 + (i % 3) * 1.35;
      const rawX = sim.player.x + Math.cos(ang) * rad;
      const rawZ = sim.player.z + Math.sin(ang) * rad;
      const spot = clampArena(rawX, rawZ);
      const enemy = makeEnemy(group.kind, spot.x, spot.z, sim.nextId++);
      const scale = 1 + (sim.wave - 1) * 0.16;
      enemy.maxHp = Math.round(enemy.maxHp * scale);
      enemy.hp = enemy.maxHp;
      enemy.speed *= 1 + (sim.wave - 1) * 0.035;
      list.push(enemy);
      i++;
    }
  }
  sim.enemies = list;
}

function clampArena(x: number, z: number) {
  const d = Math.hypot(x, z);
  if (d > ARENA) {
    const s = ARENA / d;
    return { x: x * s, z: z * s };
  }
  return { x, z };
}

function ageJuice(sim: Sim, dt: number) {
  for (const p of sim.particles) {
    if (p.life <= 0) continue;
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.z += p.vz * dt;
    p.vy -= 9 * dt;
  }
  for (const f of sim.floaters) {
    if (!f.alive) continue;
    f.life -= dt;
    f.y += dt * 1.35;
    if (f.life <= 0) f.alive = false;
  }
  for (const s of sim.slashes) {
    if (!s.alive) continue;
    s.life -= dt;
    if (s.life <= 0) s.alive = false;
  }
  sim.cam.trauma = Math.max(0, sim.cam.trauma - dt * 1.7);
  sim.cam.distKick += (0 - sim.cam.distKick) * (1 - Math.exp(-6 * dt));
  if (sim.bannerT > 0) sim.bannerT = Math.max(0, sim.bannerT - dt);
}

function hurtPlayer(sim: Sim, dmg: number, fromX: number, fromZ: number) {
  const p = sim.player;
  if (p.hp <= 0 || sim.phase !== "play") return;
  if (p.parryT > 0) {
    const attacker = sim.enemies
      .filter((enemy) => enemy.state !== "dead" && Math.hypot(enemy.x - p.x, enemy.z - p.z) < 3.4)
      .sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z))[0];
    if (attacker) {
      attacker.state = "stagger";
      attacker.timer = 0.95;
      attacker.cool = Math.max(attacker.cool, 1.1);
      p.parryT = 0;
      p.energy = Math.min(100, p.energy + 22);
      sim.focus = Math.max(sim.focus, 0.62);
      sim.hitstop = Math.max(sim.hitstop, 0.1);
      sim.cam.trauma = Math.min(1, sim.cam.trauma + 0.38);
      sim.cues.perfect++;
      floatText(sim, p.x, 2.2, p.z, "صدّ مثالي", false);
      burst(sim, p.x, 1.1, p.z, 16, TIDE, 3.5);
      hurtEnemy(sim, attacker, 48, 1.2, 0.8);
      return;
    }
  }
  if (p.invuln > 0) {
    if (p.dodgeT > 0.02) {
      p.energy = Math.min(100, p.energy + 18);
      sim.focus = Math.max(sim.focus, 0.48);
      sim.hitstop = Math.max(sim.hitstop, 0.07);
      sim.cam.trauma = Math.min(1, sim.cam.trauma + 0.22);
      sim.cues.perfect++;
      floatText(sim, p.x, 2.05, p.z, "مثالي", false);
      burst(sim, p.x, 1.05, p.z, 10, TIDE, 3.1);
    }
    return;
  }
  p.hp = Math.max(0, p.hp - dmg);
  p.hurt = 0.28;
  p.invuln = Math.max(p.invuln, 0.42);
  sim.comboHits = 0;
  sim.comboTimer = 0;
  sim.cues.hurt++;
  sim.hitstop = Math.max(sim.hitstop, 0.05);
  sim.cam.trauma = Math.min(1, sim.cam.trauma + 0.48);
  sim.cam.distKick = Math.min(1.4, sim.cam.distKick + 0.45);
  const dx = p.x - fromX;
  const dz = p.z - fromZ;
  const len = Math.hypot(dx, dz) || 1;
  p.x += (dx / len) * 0.45;
  p.z += (dz / len) * 0.45;
  floatText(sim, p.x, 1.8, p.z, `-${dmg}`, true);
  burst(sim, p.x, 1.1, p.z, 8, RIFT, 2.4);
  if (p.hp <= 0) {
    p.hp = 0;
    sim.phase = "lose";
    sim.banner = "انقطع الصدى";
    sim.bannerT = 2;
    sim.cues.lose++;
    saveBest(sim);
  }
}

function hurtEnemy(sim: Sim, e: Enemy, dmg: number, kb: number, stagger: number) {
  if (e.state === "dead") return;
  e.hp -= dmg;
  e.flash = 0.14;
  e.hitSwing = sim.player.swingId;
  const dx = e.x - sim.player.x;
  const dz = e.z - sim.player.z;
  const len = Math.hypot(dx, dz) || 1;
  e.x += (dx / len) * kb;
  e.z += (dz / len) * kb;
  if (stagger > 0) {
    e.state = "stagger";
    e.timer = stagger;
  }
  sim.player.energy = Math.min(100, sim.player.energy + 7);
  sim.comboHits += 1;
  sim.comboTimer = 2.5;
  sim.score += Math.round(8 * (1 + Math.min(sim.comboHits, 12) * 0.05));
  sim.cues.hit++;
  sim.hitstop = Math.max(sim.hitstop, stagger > 0.4 ? 0.07 : 0.04);
  sim.cam.trauma = Math.min(1, sim.cam.trauma + (stagger > 0.4 ? 0.45 : 0.26));
  floatText(sim, e.x, e.kind === "warden" ? 2.4 : 1.5, e.z, String(dmg), false);
  burst(sim, e.x, 1, e.z, 7, SPARK, 2.2);
  if (e.hp <= 0) killEnemy(sim, e);
}

function killEnemy(sim: Sim, e: Enemy) {
  if (e.state === "dead") return;
  e.state = "dead";
  e.hp = 0;
  e.deadT = 0;
  sim.kills += 1;
  const bonus = Math.round(SCORE[e.kind] * (1 + Math.min(sim.comboHits, 16) * 0.08));
  sim.score += bonus;
  sim.player.energy = Math.min(100, sim.player.energy + (e.kind === "warden" ? 40 : 16));
  sim.cues.die++;
  burst(sim, e.x, 1, e.z, e.kind === "warden" ? 22 : 12, e.kind === "wisp" ? TIDE : SPARK, 3.4);
  floatText(sim, e.x, 2, e.z, `+${bonus}`, false);
  const any = sim.enemies.some((q) => q.state !== "dead");
  if (!any && sim.waveWait < 0 && sim.phase === "play") {
    if (sim.wave >= WAVES.length) {
      sim.phase = "win";
      sim.banner = "الجزيرة هدأت";
      sim.bannerT = 3;
      sim.cues.win++;
      saveBest(sim);
    } else {
      sim.waveWait = 2.15;
      sim.player.hp = Math.min(sim.player.maxHp, sim.player.hp + 28);
      sim.player.energy = Math.min(100, sim.player.energy + 20);
      sim.banner = "الشق يتراجع";
      sim.bannerT = 1.6;
    }
  }
}

function coneHit(
  px: number,
  pz: number,
  yaw: number,
  ex: number,
  ez: number,
  range: number,
  minDot: number,
) {
  const dx = ex - px;
  const dz = ez - pz;
  const dist = Math.hypot(dx, dz);
  if (dist > range) return false;
  const fx = -Math.sin(yaw);
  const fz = -Math.cos(yaw);
  const dot = (dx * fx + dz * fz) / Math.max(dist, 0.001);
  return dot > minDot;
}

function separate(sim: Sim) {
  const p = sim.player;
  for (const e of sim.enemies) {
    if (e.state === "dead") continue;
    let dx = e.x - p.x;
    let dz = e.z - p.z;
    let d = Math.hypot(dx, dz);
    const min = e.radius + 0.46;
    if (d < 0.0001) {
      dx = 1;
      dz = 0;
      d = 1;
    }
    if (d < min && p.dodgeT <= 0) {
      const push = min - d;
      e.x += (dx / d) * push * 0.72;
      e.z += (dz / d) * push * 0.72;
      p.x -= (dx / d) * push * 0.28;
      p.z -= (dz / d) * push * 0.28;
    }
  }
  const list = sim.enemies;
  for (let i = 0; i < list.length; i++) {
    const a = list[i];
    if (a.state === "dead") continue;
    for (let j = i + 1; j < list.length; j++) {
      const b = list[j];
      if (b.state === "dead") continue;
      let dx = b.x - a.x;
      let dz = b.z - a.z;
      let d = Math.hypot(dx, dz);
      const min = a.radius + b.radius;
      if (d < 0.0001) {
        dx = 1;
        dz = 0;
        d = 1;
      }
      if (d < min) {
        const push = (min - d) * 0.5;
        a.x -= (dx / d) * push;
        a.z -= (dz / d) * push;
        b.x += (dx / d) * push;
        b.z += (dz / d) * push;
      }
    }
  }
}

/** Toggle target lock. With no lock, selects the nearest living enemy;
 * while locked, advances to the next nearest enemy. */
export function cycleTarget(sim: Sim) {
  const alive = sim.enemies.filter((enemy) => enemy.state !== "dead" && enemy.hp > 0);
  if (!alive.length) {
    sim.targetId = null;
    return;
  }
  const p = sim.player;
  const ordered = alive.sort((a, b) =>
    Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z),
  );
  if (sim.targetId === null) {
    sim.targetId = ordered[0].id;
    return;
  }
  const current = ordered.findIndex((enemy) => enemy.id === sim.targetId);
  sim.targetId = current < 0 || current === ordered.length - 1 ? null : ordered[current + 1].id;
}

function startSwing(sim: Sim) {
  const p = sim.player;
  const idx = p.comboWindow > 0 ? p.combo : 0;
  const sw = SWINGS[idx];
  const duration = sw.dur / CHARACTERS[p.character].attack;
  p.attackT = duration;
  p.swingDur = duration;
  p.swingIndex = idx;
  p.combo = (idx + 1) % SWINGS.length;
  p.comboWindow = 0;
  p.bufferAttack = 0;
  p.swingId += 1;
  p.ultT = 0;
  sim.cues.slash++;
  spawnSlash(sim, p.x, p.z, p.yaw, sw.radius, 0, 1.05 + idx * 0.08);
}

function stepPlayer(sim: Sim, dt: number, first: boolean) {
  const p = sim.player;
  if (first && sim.edge.attack) {
    p.bufferAttack = 0.18;
    // Soft-lock the nearest nearby enemy on the first strike so touch combat
    // does not require a separate target-lock tap before every encounter.
    if (sim.targetId === null) {
      const nearest = sim.enemies
        .filter((enemy) => enemy.state !== "dead" && enemy.hp > 0)
        .map((enemy) => ({ enemy, distance: Math.hypot(enemy.x - p.x, enemy.z - p.z) }))
        .filter((entry) => entry.distance <= 8)
        .sort((a, b) => a.distance - b.distance)[0];
      if (nearest) sim.targetId = nearest.enemy.id;
    }
  }
  if (first && sim.edge.parry && p.parryCd <= 0 && p.hp > 0 && p.dodgeT <= 0) {
    p.parryT = 0.28;
    p.parryCd = 1.25;
    p.attackT = 0;
    p.bufferAttack = 0;
    burst(sim, p.x, 1.05, p.z, 5, TIDE, 1.4);
  }
  if (first && sim.edge.dodge && p.dodgeCd <= 0 && p.dodgeT <= 0 && p.hp > 0) {
    const axes = moveAxes(sim);
    const dodgeFactor = CHARACTERS[p.character].dodge;
    p.dodgeT = 0.28 * dodgeFactor;
    p.dodgeCd = 0.82 * dodgeFactor;
    p.dodgeYaw = axes.moving ? Math.atan2(-axes.ix, -axes.iz) : p.yaw;
    p.yaw = p.dodgeYaw;
    p.invuln = Math.max(p.invuln, 0.28);
    p.attackT = 0;
    p.bufferAttack = 0;
    sim.cues.dodge++;
    burst(sim, p.x, 0.3, p.z, 6, TIDE, 1.6);
  }
  if (first && sim.edge.skill && p.skillCd <= 0 && p.dodgeT <= 0 && p.hp > 0) {
    p.skillCd = 5.6;
    sim.cues.skill++;
    spawnSlash(sim, p.x, p.z, p.yaw, 2.4, 1, 0.9);
    spawnSlash(sim, p.x, p.z, p.yaw + Math.PI, 2.4, 1, 1.2);
    burst(sim, p.x, 1, p.z, 16, TIDE, 4);
    for (const e of sim.enemies) {
      if (e.state === "dead") continue;
      if (Math.hypot(e.x - p.x, e.z - p.z) < 4.8 + e.radius) hurtEnemy(sim, e, 36, 1.15, 0.5);
    }
    sim.cam.trauma = Math.min(1, sim.cam.trauma + 0.4);
  }
  if (first && sim.edge.ult && p.energy >= 100 && p.ultT <= 0 && p.hp > 0 && p.dodgeT <= 0) {
    p.energy = 0;
    p.ultT = 0.55;
    p.invuln = Math.max(p.invuln, 0.5);
    p.attackT = 0;
    sim.cues.ult++;
    spawnSlash(sim, p.x, p.z, p.yaw, 3.2, 2, 1.3);
    burst(sim, p.x, 1.2, p.z, 24, TIDE, 5);
    for (const e of sim.enemies) {
      if (e.state === "dead") continue;
      if (Math.hypot(e.x - p.x, e.z - p.z) < 7.2 + e.radius) hurtEnemy(sim, e, 92, 1.7, 0.85);
    }
    sim.cam.trauma = Math.min(1, sim.cam.trauma + 0.75);
    sim.cam.distKick = 1.1;
  }

  const axes = moveAxes(sim);
  if (p.dodgeT > 0) {
    p.dodgeT -= dt;
    const mx = -Math.sin(p.dodgeYaw);
    const mz = -Math.cos(p.dodgeYaw);
    p.speed = 17.5;
    p.x += mx * p.speed * dt;
    p.z += mz * p.speed * dt;
    p.yaw = p.dodgeYaw;
  } else {
    let desired = 0;
    if (axes.moving && p.hp > 0) {
      const slow = p.attackT > 0.05 ? 0.42 : 1;
      const ultSlow = p.ultT > 0 ? 0.3 : 1;
      desired = RUN_SPEED * CHARACTERS[p.character].speed * slow * ultSlow;
      const face = Math.atan2(-axes.ix, -axes.iz);
      p.yaw = dampAngle(p.yaw, face, 16, dt);
      p.x += axes.ix * desired * dt;
      p.z += axes.iz * desired * dt;
    }
    p.speed += (desired - p.speed) * (1 - Math.exp(-16 * dt));
  }

  const locked = sim.targetId === null
    ? undefined
    : sim.enemies.find((enemy) => enemy.id === sim.targetId && enemy.state !== "dead" && enemy.hp > 0);
  if (sim.targetId !== null && !locked) sim.targetId = null;
  if (locked && p.dodgeT <= 0) {
    const dx = locked.x - p.x;
    const dz = locked.z - p.z;
    if (Math.hypot(dx, dz) > 0.05) p.yaw = dampAngle(p.yaw, Math.atan2(-dx, -dz), axes.moving ? 10 : 18, dt);
  }

  const clamped = clampArena(p.x, p.z);
  p.x = clamped.x;
  p.z = clamped.z;

  if (p.bufferAttack > 0 && p.attackT <= 0 && p.dodgeT <= 0 && p.ultT <= 0 && p.hp > 0) {
    startSwing(sim);
  }
  if (p.attackT > 0) {
    const before = p.attackT;
    p.attackT = Math.max(0, p.attackT - dt);
    const sw = SWINGS[p.swingIndex];
    const wasActive = before <= sw.from && before >= sw.to;
    const nowActive = p.attackT <= sw.from && p.attackT >= sw.to;
    if (!wasActive && nowActive) {
      for (const e of sim.enemies) {
        if (e.state === "dead" || e.hitSwing === p.swingId) continue;
        if (coneHit(p.x, p.z, p.yaw, e.x, e.z, sw.range + e.radius, sw.arc)) {
          e.hitSwing = p.swingId;
          const hero = CHARACTERS[p.character];
          hurtEnemy(sim, e, Math.round(sw.dmg * hero.attack), sw.kb * (p.character === 1 ? 1.35 : 1), sw.stagger * (p.character === 1 ? 1.4 : 1));
        }
      }
    }
    if (p.attackT === 0) p.comboWindow = 0.48;
  } else if (p.comboWindow > 0) {
    p.comboWindow = Math.max(0, p.comboWindow - dt);
    if (p.comboWindow === 0) p.combo = 0;
  }

  p.bufferAttack = Math.max(0, p.bufferAttack - dt);
  p.dodgeCd = Math.max(0, p.dodgeCd - dt);
  p.parryT = Math.max(0, p.parryT - dt);
  p.parryCd = Math.max(0, p.parryCd - dt);
  p.skillCd = Math.max(0, p.skillCd - dt);
  p.invuln = Math.max(0, p.invuln - dt);
  p.hurt = Math.max(0, p.hurt - dt);
  p.ultT = Math.max(0, p.ultT - dt);
  if (sim.comboTimer > 0) {
    sim.comboTimer -= dt;
    if (sim.comboTimer <= 0) sim.comboHits = 0;
  }

  if (p.speed > 4) {
    p.stepT -= dt;
    if (p.stepT <= 0) {
      p.stepT = 0.22;
      emit(sim, p.x, 0.15, p.z, 0, 0.4, 0, 0.25, 0.1, 0.45, 0.5, 0.42);
    }
  }

  for (const m of sim.motes) {
    if (!m.alive) {
      m.t -= dt;
      if (m.t <= 0) m.alive = true;
      continue;
    }
    if (Math.hypot(m.x - p.x, m.z - p.z) < 1.15 && p.hp > 0 && p.hp < p.maxHp) {
      m.alive = false;
      m.t = 9;
      const gain = Math.min(26, p.maxHp - p.hp);
      p.hp += gain;
      p.energy = Math.min(100, p.energy + 12);
      sim.cues.heal++;
      floatText(sim, m.x, 1.4, m.z, `+${gain}`, false);
      burst(sim, m.x, 0.8, m.z, 8, TIDE, 1.8);
    } else if (Math.hypot(m.x - p.x, m.z - p.z) < 1.15 && p.hp > 0) {
      m.alive = false;
      m.t = 9;
      p.energy = Math.min(100, p.energy + 18);
      sim.cues.heal++;
      burst(sim, m.x, 0.8, m.z, 8, TIDE, 1.8);
    }
  }
}

function stepEnemy(sim: Sim, e: Enemy, dt: number) {
  if (e.state === "dead") {
    e.deadT += dt;
    return;
  }
  e.flash = Math.max(0, e.flash - dt);
  const p = sim.player;
  const dx = p.x - e.x;
  const dz = p.z - e.z;
  const dist = Math.hypot(dx, dz) || 0.0001;
  e.yaw = dampAngle(e.yaw, Math.atan2(-dx, -dz), e.kind === "wisp" ? 6 : 9, dt);
  e.cool = Math.max(0, e.cool - dt);

  if (e.state === "stagger") {
    e.timer -= dt;
    if (e.timer <= 0) e.state = "chase";
    return;
  }

  if (e.kind === "wisp") {
    const nx = dx / dist;
    const nz = dz / dist;
    let mx = 0;
    let mz = 0;
    if (dist < 6.2) {
      mx = -nx;
      mz = -nz;
    } else if (dist > 10.5) {
      mx = nx;
      mz = nz;
    } else {
      const side = e.id % 2 === 0 ? 1 : -1;
      mx = -nz * side;
      mz = nx * side;
    }
    e.x += mx * e.speed * dt;
    e.z += mz * e.speed * dt;
    if (e.cool <= 0 && dist < 18 && p.hp > 0) {
      e.cool = 2.25;
      spawnShot(sim, e.x, e.z, p.x, p.z, 9);
    }
    const c = clampArena(e.x, e.z);
    e.x = c.x;
    e.z = c.z;
    return;
  }

  if (e.kind === "warden") {
    e.special -= dt;
    if (e.special <= 0 && dist < 11 && e.state === "chase") {
      e.special = e.hp / e.maxHp < 0.5 ? 3.9 : 5.8;
      spawnShock(sim, e.x, e.z);
      sim.cam.trauma = Math.min(1, sim.cam.trauma + 0.2);
    }
  }

  if (e.state === "chase") {
    if (dist > e.range * 0.82) {
      e.x += (dx / dist) * e.speed * dt;
      e.z += (dz / dist) * e.speed * dt;
    }
    if (dist < e.range && e.cool <= 0 && p.hp > 0) {
      e.state = "windup";
      e.timer = e.kind === "warden" ? 0.64 : 0.4;
    }
  } else if (e.state === "windup") {
    e.timer -= dt;
    if (e.timer <= 0) {
      e.state = "strike";
      e.timer = e.kind === "warden" ? 0.18 : 0.14;
      e.struck = false;
    }
  } else if (e.state === "strike") {
    if (!e.struck) {
      e.struck = true;
      const reach = e.range + 0.35;
      if (dist < reach && coneHit(e.x, e.z, e.yaw, p.x, p.z, reach, 0.2)) {
        hurtPlayer(sim, e.kind === "warden" ? 18 : 11, e.x, e.z);
      }
    }
    e.timer -= dt;
    if (e.timer <= 0) {
      e.state = "recover";
      e.timer = e.kind === "warden" ? 0.78 : 0.52;
    }
  } else if (e.state === "recover") {
    e.timer -= dt;
    if (e.timer <= 0) {
      e.state = "chase";
      e.cool = e.kind === "warden" ? 0.7 : 0.38;
    }
  }
  const c = clampArena(e.x, e.z);
  e.x = c.x;
  e.z = c.z;
}

function stepHazards(sim: Sim, dt: number) {
  const p = sim.player;
  for (const s of sim.shots) {
    if (!s.alive) continue;
    s.x += s.vx * dt;
    s.z += s.vz * dt;
    s.life -= dt;
    if (Math.hypot(s.x - p.x, s.z - p.z) < s.r + 0.42) {
      s.alive = false;
      hurtPlayer(sim, s.dmg, s.x, s.z);
      continue;
    }
    if (s.life <= 0 || Math.hypot(s.x, s.z) > ARENA + 6) s.alive = false;
  }
  for (const s of sim.shocks) {
    if (!s.alive) continue;
    s.life -= dt;
    const t = 1 - s.life / s.max;
    s.r = 0.5 + t * 8.2;
    if (!s.hit && p.hp > 0) {
      const d = Math.hypot(p.x - s.x, p.z - s.z);
      if (Math.abs(d - s.r) < 0.7) {
        s.hit = true;
        hurtPlayer(sim, 14, s.x, s.z);
      }
    }
    if (s.life <= 0) s.alive = false;
  }
}

function step(sim: Sim, dt: number, first: boolean) {
  if (sim.hitstop > 0) {
    sim.hitstop = Math.max(0, sim.hitstop - dt);
    ageJuice(sim, dt);
    return;
  }
  sim.time += dt;
  if (held(sim, "KeyZ")) {
    sim.cam.yaw += 1.8 * dt;
    sim.lookIdle = 0;
  }
  if (held(sim, "KeyX")) {
    sim.cam.yaw -= 1.8 * dt;
    sim.lookIdle = 0;
  }
  const worldDt = sim.focus > 0 ? dt * 0.4 : dt;
  sim.focus = Math.max(0, sim.focus - dt);
  stepPlayer(sim, dt, first);
  for (const e of sim.enemies) stepEnemy(sim, e, worldDt);
  stepHazards(sim, worldDt);
  separate(sim);
  if (sim.waveWait > 0) {
    sim.waveWait -= dt;
    if (sim.waveWait <= 0 && sim.phase === "play") {
      sim.wave += 1;
      sim.waveWait = -1;
      const chapters = ["بوابة المدّ", "غابة البلّور", "أطلال الحراس", "ممرّ الصدى", "قلب العاصفة", "عرش الصدع"];
      sim.banner = chapters[sim.wave - 1] ?? "الحارس الأخير";
      sim.bannerT = 2;
      spawnWave(sim);
    }
  }
  ageJuice(sim, dt);
  if (first) {
    sim.edge.attack = false;
    sim.edge.dodge = false;
    sim.edge.skill = false;
    sim.edge.ult = false;
    sim.edge.parry = false;
  }
}

function applyLook(sim: Sim, dt: number) {
  if (Math.abs(sim.lookX) + Math.abs(sim.lookY) > 0.4) sim.lookIdle = 0;
  else sim.lookIdle += dt;
  sim.cam.yaw -= sim.lookX * 0.003;
  sim.cam.pitch = Math.min(1.02, Math.max(0.24, sim.cam.pitch + sim.lookY * 0.0022));
  sim.lookX = 0;
  sim.lookY = 0;
}

function softFollow(sim: Sim, dt: number) {
  if (sim.phase !== "play") return;
  if (sim.lookIdle < 0.42) return;
  if (sim.player.speed < 1.4 || sim.player.dodgeT > 0) return;
  const diff = wrapAngle(sim.player.yaw - sim.cam.yaw);
  sim.cam.yaw += diff * (1 - Math.exp(-3.1 * dt));
}

export function frame(sim: Sim, dt: number) {
  const capped = Math.min(Math.max(dt, 0), 0.05);
  applyLook(sim, capped);
  if (sim.phase === "menu") {
    sim.time += capped;
    sim.cam.yaw += capped * 0.16;
    ageJuice(sim, capped);
    return;
  }
  if (sim.phase !== "play") {
    ageJuice(sim, capped);
    return;
  }
  let left = capped;
  let first = true;
  while (left > 1e-4) {
    const h = Math.min(1 / 60, left);
    step(sim, h, first);
    first = false;
    left -= h;
  }
  softFollow(sim, capped);
}

export function beginRun(sim: Sim) {
  const best = sim.best;
  const character = sim.player.character;
  const cues = sim.cues;
  const keys = sim.keys;
  const injected = sim.injected;
  const fresh = createSim();
  Object.assign(sim, fresh);
  sim.best = Math.max(best, fresh.best);
  sim.player.character = character;
  sim.targetId = null;
  sim.cues = cues;
  sim.keys = keys;
  sim.injected = injected;
  sim.phase = "play";
  sim.player.x = 0;
  sim.player.z = 7;
  sim.player.yaw = 0;
  sim.player.hp = sim.player.maxHp;
  sim.player.energy = 25;
  sim.cam.yaw = 0;
  sim.cam.pitch = 0.46;
  sim.lookIdle = 1;
  sim.wave = 1;
  sim.waveWait = -1;
  sim.score = 0;
  sim.kills = 0;
  sim.banner = "الموجة 1";
  sim.bannerT = 2.2;
  sim.motes.forEach((m) => {
    m.alive = true;
    m.t = 0;
  });
  spawnWave(sim);
}

export function togglePause(sim: Sim) {
  if (sim.phase === "play") sim.phase = "pause";
  else if (sim.phase === "pause") sim.phase = "play";
}
