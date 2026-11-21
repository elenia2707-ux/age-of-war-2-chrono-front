import type { SoundCue } from '../data/types';

type AudioContextCtor = typeof AudioContext;

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private muted = false;
  private lastCueTime = new Map<SoundCue, number>();

  constructor(initialMuted = false) {
    this.muted = initialMuted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  /** Must be called on first user touch/click to unlock iOS Safari Web Audio */
  public unlock(): void {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const Ctor: AudioContextCtor | undefined =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
      if (!Ctor) return;
      try {
        this.ctx = new Ctor();
        this.noiseBuffer = this.createNoiseBuffer(this.ctx);
      } catch {
        return;
      }
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => undefined);
    }
  }

  public play(cue: SoundCue): void {
    if (this.muted || !this.ctx || this.ctx.state !== 'running') return;

    const nowMs = performance.now();
    const minGap = this.getMinGapMs(cue);
    const prev = this.lastCueTime.get(cue) ?? 0;
    if (nowMs - prev < minGap) return;
    this.lastCueTime.set(cue, nowMs);

    const t = this.ctx.currentTime;
    switch (cue) {
      case 'melee_wood':
        this.playTone(t, 'triangle', 155, 62, 0.09, 0.14);
        this.playNoise(t, 0.05, 900, 'lowpass', 0.08);
        break;
      case 'melee_metal':
        this.playTone(t, 'sawtooth', 780, 320, 0.08, 0.09);
        this.playTone(t, 'triangle', 1420, 660, 0.07, 0.07);
        break;
      case 'melee_energy':
        this.playTone(t, 'sawtooth', 980, 260, 0.11, 0.12);
        this.playTone(t, 'sine', 1600, 520, 0.09, 0.09);
        break;
      case 'bow':
        this.playTone(t, 'triangle', 460, 190, 0.08, 0.08);
        this.playNoise(t, 0.04, 2400, 'bandpass', 0.06);
        break;
      case 'gun':
        this.playNoise(t, 0.07, 1700, 'bandpass', 0.14);
        this.playTone(t, 'square', 220, 75, 0.06, 0.09);
        break;
      case 'cannon':
        this.playTone(t, 'sine', 135, 36, 0.28, 0.24);
        this.playNoise(t, 0.24, 520, 'lowpass', 0.22);
        break;
      case 'flame':
        this.playNoise(t, 0.12, 950, 'bandpass', 0.12);
        break;
      case 'rocket':
        this.playNoise(t, 0.22, 1300, 'bandpass', 0.14);
        this.playTone(t, 'sawtooth', 260, 120, 0.18, 0.08);
        break;
      case 'laser':
        this.playTone(t, 'sawtooth', 1240, 290, 0.12, 0.12);
        this.playTone(t, 'sine', 820, 210, 0.12, 0.08);
        break;
      case 'railgun':
        this.playTone(t, 'sawtooth', 1800, 140, 0.24, 0.18);
        this.playNoise(t, 0.14, 2600, 'highpass', 0.15);
        break;
      case 'explosion':
        this.playTone(t, 'sine', 110, 28, 0.34, 0.26);
        this.playNoise(t, 0.32, 420, 'lowpass', 0.24);
        break;
      case 'spawn':
        this.playTone(t, 'triangle', 440, 660, 0.09, 0.09);
        break;
      case 'turret_build':
        this.playTone(t, 'square', 240, 360, 0.08, 0.09);
        this.playTone(t + 0.07, 'triangle', 380, 560, 0.1, 0.1);
        break;
      case 'sell':
        this.playTone(t, 'sine', 880, 1180, 0.08, 0.09);
        this.playTone(t + 0.06, 'sine', 1180, 1520, 0.1, 0.09);
        break;
      case 'evolve':
        this.playChord(t, [392, 493.88, 587.33, 783.99], 0.55, 0.14);
        this.playTone(t + 0.12, 'triangle', 587.33, 1174.66, 0.45, 0.13);
        break;
      case 'ultimate':
        this.playTone(t, 'sawtooth', 180, 55, 0.6, 0.2);
        this.playNoise(t, 0.5, 680, 'lowpass', 0.2);
        this.playTone(t + 0.08, 'triangle', 520, 880, 0.35, 0.14);
        break;
      case 'hit_base':
        this.playTone(t, 'triangle', 120, 48, 0.16, 0.16);
        break;
      case 'victory':
        this.playChord(t, [523.25, 659.25, 783.99], 0.32, 0.14);
        this.playChord(t + 0.24, [659.25, 783.99, 1046.5], 0.65, 0.16);
        break;
      case 'defeat':
        this.playTone(t, 'sawtooth', 330, 260, 0.28, 0.14);
        this.playTone(t + 0.25, 'sawtooth', 260, 146, 0.55, 0.15);
        break;
    }
  }

  private getMinGapMs(cue: SoundCue): number {
    switch (cue) {
      case 'evolve':
      case 'ultimate':
      case 'victory':
      case 'defeat':
        return 100;
      case 'explosion':
      case 'cannon':
        return 75;
      default:
        return 55;
    }
  }

  private createNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const length = Math.floor(ctx.sampleRate * 0.6);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  private playTone(
    startTime: number,
    type: OscillatorType,
    freqStart: number,
    freqEnd: number,
    duration: number,
    peakGain: number,
  ): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, freqStart), startTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), startTime + duration);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }

  private playNoise(
    startTime: number,
    duration: number,
    filterFreq: number,
    filterType: BiquadFilterType,
    peakGain: number,
  ): void {
    if (!this.ctx || !this.noiseBuffer) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(filterFreq, startTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(peakGain, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    src.start(startTime);
    src.stop(startTime + duration + 0.02);
  }

  private playChord(startTime: number, freqs: number[], duration: number, gainEach: number): void {
    for (const f of freqs) {
      this.playTone(startTime, 'triangle', f, f * 1.005, duration, gainEach / freqs.length * 1.8);
    }
  }
}
