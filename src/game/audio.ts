export class AudioBus {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private music: GainNode | null = null;
  private sfx: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private pad: { stop: () => void } | null = null;
  muted = false;

  unlock() {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    if (!this.ctx) {
      const ctx = new AC({ latencyHint: "interactive" });
      const master = ctx.createGain();
      const music = ctx.createGain();
      const sfx = ctx.createGain();
      master.gain.value = this.muted ? 0 : 0.9;
      music.gain.value = 0.16;
      sfx.gain.value = 0.75;
      music.connect(master);
      sfx.connect(master);
      master.connect(ctx.destination);
      this.ctx = ctx;
      this.master = master;
      this.music = music;
      this.sfx = sfx;
      const len = Math.floor(ctx.sampleRate * 0.25);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      this.noise = buf;
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    this.startPad();
  }

  resume() {
    if (this.ctx && this.ctx.state === "suspended") void this.ctx.resume();
  }

  setMuted(next: boolean) {
    this.muted = next;
    if (!this.ctx || !this.master) return;
    this.master.gain.setTargetAtTime(next ? 0 : 0.9, this.ctx.currentTime, 0.03);
  }

  private env(gain: GainNode, peak: number, dur: number) {
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, peak), t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }

  private tone(freq: number, dur: number, type: OscillatorType, peak: number, slide?: number) {
    if (!this.ctx || !this.sfx) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slide), ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(this.sfx);
    this.env(gain, peak, dur);
    osc.start();
    osc.stop(ctx.currentTime + dur + 0.02);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }

  private burst(freq: number, q: number, dur: number, peak: number) {
    if (!this.ctx || !this.sfx || !this.noise) return;
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = freq;
    filter.Q.value = q;
    const gain = ctx.createGain();
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfx);
    this.env(gain, peak, dur);
    src.start();
    src.stop(ctx.currentTime + dur + 0.02);
    src.onended = () => {
      src.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  }

  slash() {
    this.burst(1400, 0.7, 0.12, 0.22);
    this.tone(620 + Math.random() * 80, 0.09, "sawtooth", 0.05, 240);
  }

  hit() {
    this.burst(400, 1.2, 0.08, 0.28);
    this.tone(180 + Math.random() * 40, 0.07, "square", 0.06, 90);
  }

  dodge() {
    this.burst(900, 0.5, 0.16, 0.16);
  }

  perfect() {
    this.tone(880, 0.12, "sine", 0.08, 1320);
    this.tone(1320, 0.16, "triangle", 0.05);
  }

  skill() {
    this.burst(700, 0.6, 0.28, 0.24);
    this.tone(440, 0.22, "sawtooth", 0.05, 220);
    this.tone(660, 0.24, "triangle", 0.04);
  }

  ult() {
    this.burst(280, 0.4, 0.45, 0.32);
    this.tone(196, 0.4, "sawtooth", 0.07, 98);
    this.tone(392, 0.36, "triangle", 0.05, 784);
  }

  hurt() {
    this.tone(140, 0.16, "square", 0.07, 70);
    this.burst(200, 0.8, 0.12, 0.18);
  }

  die() {
    this.burst(500, 0.5, 0.2, 0.2);
    this.tone(520, 0.18, "triangle", 0.05, 180);
  }

  heal() {
    this.tone(660, 0.12, "sine", 0.06);
    this.tone(990, 0.16, "sine", 0.04);
  }

  win() {
    this.tone(523, 0.16, "triangle", 0.07);
    this.tone(659, 0.18, "triangle", 0.06);
    this.tone(784, 0.28, "sine", 0.06);
  }

  lose() {
    this.tone(311, 0.22, "triangle", 0.06, 164);
    this.tone(196, 0.32, "sine", 0.05);
  }

  private startPad() {
    if (!this.ctx || !this.music || this.pad) return;
    const ctx = this.ctx;
    const nodes: OscillatorNode[] = [];
    const gain = ctx.createGain();
    gain.gain.value = 0.22;
    const freqs = [98, 146.8, 196];
    for (const f of freqs) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;
      osc.connect(gain);
      osc.start();
      nodes.push(osc);
    }
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.06;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    lfo.start();
    gain.connect(this.music);
    this.pad = {
      stop: () => {
        for (const n of nodes) {
          n.stop();
          n.disconnect();
        }
        lfo.stop();
        lfo.disconnect();
        gain.disconnect();
      },
    };
  }
}
