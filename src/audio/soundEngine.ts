import type { SoundCue, UltimateKind } from '../data/types';

type AudioContextCtor = typeof AudioContext;

interface NavigatorWithAudioSession extends Navigator {
  audioSession?: {
    type: string;
  };
}

const HIGH_PRIORITY_CUES = new Set<SoundCue>([
  'evolve',
  'fever',
  'ultimate',
  'victory',
  'defeat',
  'upgrade',
  'promote',
  'crate_open',
  'ui_tap',
]);

const MAX_CONCURRENT_VOICES = 18;

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private whiteNoiseBuffer: AudioBuffer | null = null;
  private warmNoiseBuffer: AudioBuffer | null = null;
  private muted = false;
  private unlockedPulseSent = false;
  private activeVoices = 0;
  private lastCueTime = new Map<SoundCue, number>();
  private lastUltimateTime = -1000;

  constructor(initialMuted = false) {
    this.muted = initialMuted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public hasCompressor(): boolean {
    return this.compressor !== null;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.88, this.ctx.currentTime);
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    if (!this.muted) {
      this.unlock(true);
    }
    return this.muted;
  }

  /** Must be called inside user touch/pointer/click to unlock iOS Safari & PWA Web Audio */
  public unlock(playConfirmChime = false): void {
    if (typeof window === 'undefined') return;

    // On iOS 17+ Safari / Standalone PWA, Web Audio defaults to 'ambient' (silenced by hardware ringer switch).
    // Setting 'playback' lets game audio play cleanly even when the iPhone silent switch is engaged.
    try {
      const nav = navigator as NavigatorWithAudioSession;
      if (nav.audioSession && nav.audioSession.type !== 'playback') {
        nav.audioSession.type = 'playback';
      }
    } catch {
      // Ignore if browser restricts audioSession mutation
    }

    if (!this.ctx) {
      const Ctor: AudioContextCtor | undefined =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
      if (!Ctor) return;
      try {
        const ctx = new Ctor();
        this.ctx = ctx;
        this.setupMasterBus(ctx);
        this.whiteNoiseBuffer = this.createNoiseBuffer(ctx, false);
        this.warmNoiseBuffer = this.createNoiseBuffer(ctx, true);
      } catch {
        return;
      }
    }

    const ctx = this.ctx;

    const finishUnlock = () => {
      // One-sample silent buffer pulse wakes iOS CoreAudio hardware cleanly
      if (!this.unlockedPulseSent && ctx.state === 'running') {
        try {
          const buf = ctx.createBuffer(1, 1, 22050);
          const src = ctx.createBufferSource();
          src.buffer = buf;
          src.connect(ctx.destination);
          src.start(0);
          this.unlockedPulseSent = true;
        } catch {
          // Ignore
        }
      }
      if (playConfirmChime && !this.muted && ctx.state === 'running') {
        this.play('ui_tap');
      }
    };

    // Resume on BOTH 'suspended' AND iOS 'interrupted' states
    if (ctx.state !== 'running') {
      ctx
        .resume()
        .then(finishUnlock)
        .catch(() => undefined);
    } else {
      finishUnlock();
    }
  }

  private setupMasterBus(ctx: AudioContext): void {
    const master = ctx.createGain();
    master.gain.setValueAtTime(this.muted ? 0 : 0.88, ctx.currentTime);

    // Master dynamics compressor prevents clipping & harsh distortion during 2x 36-unit battles on iPhone speakers
    if (typeof ctx.createDynamicsCompressor === 'function') {
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.setValueAtTime(-12, ctx.currentTime);
      comp.knee.setValueAtTime(16, ctx.currentTime);
      comp.ratio.setValueAtTime(6, ctx.currentTime);
      comp.attack.setValueAtTime(0.004, ctx.currentTime);
      comp.release.setValueAtTime(0.14, ctx.currentTime);
      master.connect(comp);
      comp.connect(ctx.destination);
      this.compressor = comp;
    } else {
      master.connect(ctx.destination);
    }
    this.masterGain = master;
  }

  private getOutputNode(): AudioNode | null {
    return this.masterGain ?? this.ctx?.destination ?? null;
  }

  private jitter(spread = 0.05): number {
    return 1 + (Math.random() * 2 - 1) * spread;
  }

  public play(cue: SoundCue): void {
    if (this.muted || !this.ctx) return;
    if (this.ctx.state !== 'running') {
      this.ctx.resume().catch(() => undefined);
      return;
    }

    const highPriority = HIGH_PRIORITY_CUES.has(cue);
    if (!highPriority && this.activeVoices >= MAX_CONCURRENT_VOICES) {
      return;
    }

    const nowMs = this.ctx.currentTime * 1000;
    const minGap = this.getMinGapMs(cue);
    const prev = this.lastCueTime.get(cue) ?? -1000;
    if (nowMs - prev < minGap) return;
    this.lastCueTime.set(cue, nowMs);

    const t = this.ctx.currentTime;
    const j = this.jitter(0.055);

    switch (cue) {
      case 'melee_wood':
        // Hollow wooden crunch + meaty sub thump
        this.playTone(t, 'triangle', 175 * j, 58 * j, 0.095, 0.16, 0.004);
        this.playTone(t, 'sine', 96 * j, 42, 0.08, 0.12, 0.003);
        this.playNoise(t, 0.055, 1150 * j, 'bandpass', 0.1, 1.8, false);
        break;

      case 'melee_metal':
        // Crisp steel clash: inharmonic overtone pair + bright edge glint
        this.playTone(t, 'sawtooth', 920 * j, 360 * j, 0.075, 0.095, 0.003);
        this.playTone(t, 'triangle', 1680 * j, 820 * j, 0.085, 0.08, 0.002);
        this.playTone(t + 0.012, 'sine', 2420 * j, 1540 * j, 0.07, 0.045, 0.002);
        this.playNoise(t, 0.04, 3400, 'highpass', 0.06, 1.2, false);
        break;

      case 'melee_energy':
        // Plasma / Chrono blade slash: sweeping resonant hum + electric snap
        this.playTone(t, 'sawtooth', 1120 * j, 240 * j, 0.125, 0.12, 0.004);
        this.playTone(t, 'sine', 1860 * j, 480 * j, 0.11, 0.095, 0.003);
        this.playNoise(t, 0.075, 2200 * j, 'bandpass', 0.085, 2.4, false);
        break;

      case 'bow':
        // Taut bowstring pluck + airy shaft whistle
        this.playTone(t, 'triangle', 510 * j, 175 * j, 0.075, 0.09, 0.003);
        this.playNoise(t, 0.055, 2800 * j, 'bandpass', 0.07, 2.2, false);
        break;

      case 'gun':
        // Snappy firearm crack + tight low-mid punch
        this.playNoise(t, 0.065, 1900 * j, 'bandpass', 0.16, 1.1, false);
        this.playNoise(t, 0.022, 4200, 'highpass', 0.09, 0.9, false);
        this.playTone(t, 'square', 240 * j, 62, 0.055, 0.1, 0.002);
        break;

      case 'cannon':
        // Chest-thumping artillery boom + warm gunpowder roar
        this.playTone(t, 'sine', 130 * j, 30, 0.3, 0.27, 0.004);
        this.playTone(t, 'triangle', 220 * j, 52, 0.14, 0.13, 0.003);
        this.playNoise(t, 0.28, 480 * j, 'lowpass', 0.24, 0.8, true);
        break;

      case 'flame':
        // Roaring pressurized napalm jet
        this.playNoise(t, 0.15, 860 * j, 'bandpass', 0.13, 1.4, true);
        this.playNoise(t + 0.02, 0.12, 1650 * j, 'bandpass', 0.07, 1.8, false);
        break;

      case 'rocket':
        // Sharp ignition pop + rising missile thruster whoosh
        this.playTone(t, 'sawtooth', 290 * j, 130 * j, 0.19, 0.085, 0.006);
        this.playNoise(t, 0.24, 1450 * j, 'bandpass', 0.15, 1.6, false);
        break;

      case 'laser':
        // Crisp futuristic twin-detuned plasma chirp
        this.playTone(t, 'sawtooth', 1360 * j, 260 * j, 0.13, 0.115, 0.003);
        this.playTone(t, 'sine', 920 * j, 195 * j, 0.125, 0.09, 0.003);
        this.playTone(t, 'triangle', 2100 * j, 640 * j, 0.07, 0.05, 0.002);
        break;

      case 'railgun':
        // Hyper-velocity electromagnetic whip-crack + sub shock
        this.playTone(t, 'sawtooth', 2150 * j, 125, 0.25, 0.16, 0.002);
        this.playTone(t, 'sine', 165, 36, 0.22, 0.19, 0.003);
        this.playNoise(t, 0.15, 2900, 'highpass', 0.14, 1.0, false);
        break;

      case 'explosion':
        // Layered sub-bass blast + gritty mid crunch + warm tail rumble
        this.playTone(t, 'sine', 118 * j, 26, 0.38, 0.28, 0.004);
        this.playTone(t, 'sawtooth', 180 * j, 42, 0.18, 0.11, 0.003);
        this.playNoise(t, 0.36, 440 * j, 'lowpass', 0.25, 0.9, true);
        this.playNoise(t, 0.09, 1800, 'bandpass', 0.1, 1.2, false);
        break;

      case 'crit':
        // Punchy anime critical impact flash: bright metallic chime + sharp crack
        this.playTone(t, 'triangle', 1560 * j, 2340 * j, 0.065, 0.11, 0.002);
        this.playTone(t + 0.015, 'sine', 2093 * j, 1046 * j, 0.11, 0.09, 0.002);
        this.playNoise(t, 0.035, 3600, 'highpass', 0.085, 1.0, false);
        break;

      case 'shield_break':
        // Crystalline hexagonal energy barrier shatter
        this.playTone(t, 'sine', 1760, 720, 0.14, 0.1, 0.002);
        this.playTone(t + 0.025, 'triangle', 2489, 1180, 0.12, 0.085, 0.002);
        this.playTone(t + 0.05, 'sine', 3135, 1520, 0.1, 0.065, 0.002);
        this.playNoise(t, 0.08, 4200, 'highpass', 0.08, 1.5, false);
        break;

      case 'spawn':
        // Crisp rhythmic deploy blip
        this.playTone(t, 'triangle', 420 * j, 640 * j, 0.075, 0.09, 0.004);
        this.playTone(t + 0.03, 'sine', 660 * j, 880 * j, 0.06, 0.055, 0.004);
        break;

      case 'turret_build':
        // Mechanical clunk + hydraulic lock chime
        this.playTone(t, 'square', 210, 320, 0.075, 0.085, 0.004);
        this.playTone(t + 0.065, 'triangle', 392, 587.33, 0.11, 0.105, 0.005);
        this.playNoise(t, 0.04, 1500, 'bandpass', 0.07, 1.4, false);
        break;

      case 'upgrade':
        // Heroic anvil strike + ascending golden 3-note triad
        this.playTone(t, 'triangle', 523.25, 528, 0.1, 0.1, 0.003);
        this.playTone(t + 0.055, 'triangle', 659.25, 665, 0.12, 0.1, 0.003);
        this.playTone(t + 0.11, 'sine', 1046.5, 1054, 0.22, 0.115, 0.004);
        break;

      case 'sell':
        // Bright twin coin clink
        this.playTone(t, 'sine', 987.77, 1318.5, 0.075, 0.095, 0.002);
        this.playTone(t + 0.055, 'sine', 1318.5, 1760, 0.11, 0.095, 0.002);
        break;

      case 'crate_open':
        // Glittering Chrono supply chest arpeggio
        this.playTone(t, 'triangle', 587.33, 590, 0.11, 0.105, 0.003);
        this.playTone(t + 0.06, 'triangle', 783.99, 788, 0.12, 0.105, 0.003);
        this.playTone(t + 0.12, 'sine', 1174.66, 1182, 0.26, 0.12, 0.004);
        this.playTone(t + 0.17, 'sine', 1567.98, 1580, 0.24, 0.09, 0.004);
        break;

      case 'promote':
        // Crisp 2-note heroic veteran promotion brass sting
        this.playTone(t, 'sawtooth', 587.33, 587.33, 0.09, 0.07, 0.005);
        this.playTone(t + 0.075, 'triangle', 880, 886, 0.22, 0.11, 0.005);
        this.playTone(t + 0.075, 'sine', 1174.66, 1180, 0.2, 0.07, 0.005);
        break;

      case 'evolve':
        // Majestic civilization evolution fanfare + rising celestial sweep
        this.playChord(t, [392.0, 493.88, 587.33, 783.99], 0.45, 0.16);
        this.playChord(t + 0.16, [523.25, 659.25, 783.99, 1046.5], 0.65, 0.18);
        this.playTone(t + 0.1, 'triangle', 587.33, 1567.98, 0.52, 0.11, 0.02);
        break;

      case 'fever':
        // Blazing Chrono Fever overdrive fanfare!
        this.playTone(t, 'sawtooth', 440, 880, 0.18, 0.09, 0.008);
        this.playChord(t + 0.06, [587.33, 739.99, 880.0, 1174.66], 0.52, 0.17);
        this.playTone(t + 0.18, 'sine', 1174.66, 1760, 0.36, 0.11, 0.01);
        break;

      case 'ultimate':
        this.playTone(t, 'sawtooth', 180, 52, 0.62, 0.2, 0.01);
        this.playNoise(t, 0.5, 680, 'lowpass', 0.2, 0.9, true);
        this.playTone(t + 0.08, 'triangle', 520, 880, 0.36, 0.14, 0.01);
        break;

      case 'hit_base':
        // Heavy structural fortress impact thud + stone rattle
        this.playTone(t, 'sine', 115 * j, 38, 0.19, 0.2, 0.004);
        this.playTone(t, 'triangle', 170 * j, 58, 0.14, 0.12, 0.004);
        this.playNoise(t, 0.11, 520, 'lowpass', 0.14, 1.0, true);
        break;

      case 'ui_tap':
        // Ultra-clean subtle tactile micro-click
        this.playTone(t, 'sine', 680, 920, 0.036, 0.05, 0.002);
        break;

      case 'victory':
        // Triumphant 3-stage victory fanfare!
        this.playChord(t, [523.25, 659.25, 783.99], 0.24, 0.15);
        this.playChord(t + 0.19, [587.33, 739.99, 880.0], 0.24, 0.15);
        this.playChord(t + 0.38, [523.25, 659.25, 783.99, 1046.5], 0.85, 0.2);
        this.playTone(t + 0.38, 'sine', 1567.98, 2093.0, 0.65, 0.08, 0.03);
        break;

      case 'defeat':
        // Heavy dramatic minor brass descent
        this.playTone(t, 'sawtooth', 329.63, 293.66, 0.28, 0.12, 0.015);
        this.playTone(t + 0.24, 'sawtooth', 261.63, 196.0, 0.34, 0.13, 0.015);
        this.playTone(t + 0.48, 'sawtooth', 196.0, 130.81, 0.65, 0.14, 0.02);
        this.playTone(t + 0.48, 'sine', 98.0, 65.41, 0.65, 0.15, 0.02);
        break;
    }
  }

  /** Play a bespoke signature Web Audio soundscape for each of the 12 Era Ultimates! */
  public playUltimate(kind: UltimateKind): void {
    if (this.muted || !this.ctx) return;
    if (this.ctx.state !== 'running') {
      this.ctx.resume().catch(() => undefined);
      return;
    }

    const nowMs = this.ctx.currentTime * 1000;
    if (nowMs - this.lastUltimateTime < 140) return;
    this.lastUltimateTime = nowMs;

    const t = this.ctx.currentTime;
    switch (kind) {
      case 'meteor':
        // Descending whistling sky-rock + volcanic sub-rumble
        this.playTone(t, 'sawtooth', 720, 140, 0.55, 0.14, 0.015);
        this.playTone(t + 0.08, 'sine', 110, 32, 0.68, 0.24, 0.02);
        this.playNoise(t, 0.6, 560, 'lowpass', 0.22, 0.9, true);
        break;

      case 'solar_wrath':
        // Radiant golden desert temple harmonic swell + searing solar beam
        this.playChord(t, [440, 554.37, 659.25, 880], 0.72, 0.18);
        this.playTone(t + 0.12, 'sawtooth', 340, 1320, 0.5, 0.12, 0.03);
        this.playNoise(t + 0.15, 0.42, 2200, 'bandpass', 0.12, 1.5, false);
        break;

      case 'lightning':
        // Olympian thunderclap snap + rolling low storm roar
        this.playNoise(t, 0.12, 3400, 'highpass', 0.22, 0.8, false);
        this.playTone(t, 'sawtooth', 1600, 90, 0.26, 0.16, 0.002);
        this.playNoise(t + 0.06, 0.62, 320, 'lowpass', 0.25, 0.8, true);
        this.playTone(t + 0.06, 'sine', 95, 28, 0.55, 0.24, 0.01);
        break;

      case 'dragon_barrage':
        // Imperial bronze war-gong + rising firework hwacha whistles
        this.playTone(t, 'triangle', 196, 178, 0.75, 0.2, 0.005);
        this.playTone(t, 'sine', 294, 272, 0.65, 0.13, 0.005);
        this.playTone(t + 0.08, 'sine', 980, 2100, 0.24, 0.09, 0.01);
        this.playTone(t + 0.18, 'sine', 1120, 2400, 0.24, 0.08, 0.01);
        this.playNoise(t + 0.06, 0.45, 2400, 'bandpass', 0.12, 2.0, false);
        break;

      case 'fire_arrows':
        // War-horn call + dense rushing flame-arrow storm wind
        this.playTone(t, 'sawtooth', 220, 329.63, 0.42, 0.13, 0.03);
        this.playNoise(t + 0.08, 0.55, 1600, 'bandpass', 0.18, 1.4, false);
        this.playNoise(t + 0.16, 0.45, 920, 'bandpass', 0.14, 1.2, true);
        break;

      case 'naval_barrage':
        // Deep ship horn + cascading broadside cannon battery
        this.playTone(t, 'sawtooth', 146.83, 138, 0.52, 0.15, 0.03);
        this.playTone(t + 0.1, 'sine', 125, 32, 0.34, 0.24, 0.004);
        this.playTone(t + 0.24, 'sine', 118, 30, 0.34, 0.22, 0.004);
        this.playNoise(t + 0.1, 0.42, 460, 'lowpass', 0.24, 0.8, true);
        break;

      case 'zeppelin_raid':
        // Steampunk brass klaxon airhorn + pressurized steam hiss
        this.playTone(t, 'sawtooth', 185, 165, 0.48, 0.15, 0.025);
        this.playTone(t, 'sawtooth', 233, 208, 0.48, 0.12, 0.025);
        this.playNoise(t + 0.08, 0.48, 1900, 'bandpass', 0.14, 1.5, false);
        break;

      case 'carpet_bomb':
        // Wartime air-raid siren sweep + heavy prop-bomber rumble
        this.playTone(t, 'sawtooth', 420, 820, 0.35, 0.11, 0.02);
        this.playTone(t + 0.32, 'sawtooth', 820, 380, 0.35, 0.1, 0.02);
        this.playNoise(t, 0.65, 290, 'lowpass', 0.22, 0.9, true);
        break;

      case 'tactical_missiles':
        // Rapid military radar lock-on chirps + supersonic afterburner roar
        this.playTone(t, 'square', 1320, 1320, 0.055, 0.08, 0.002);
        this.playTone(t + 0.08, 'square', 1320, 1320, 0.055, 0.08, 0.002);
        this.playTone(t + 0.16, 'square', 1760, 1760, 0.09, 0.1, 0.002);
        this.playNoise(t + 0.14, 0.48, 1400, 'bandpass', 0.18, 1.2, false);
        break;

      case 'orbital_laser':
        // Sci-fi orbital turbine spin-up + colossal plasma beam drop
        this.playTone(t, 'sawtooth', 190, 1520, 0.36, 0.13, 0.02);
        this.playTone(t + 0.28, 'sine', 140, 34, 0.52, 0.26, 0.008);
        this.playTone(t + 0.28, 'sawtooth', 1240, 260, 0.48, 0.14, 0.005);
        this.playNoise(t + 0.26, 0.44, 2400, 'bandpass', 0.15, 1.1, false);
        break;

      case 'black_hole':
        // Eerie downward gravitational time-warp + cosmic sub-implosion
        this.playTone(t, 'sine', 640, 38, 0.68, 0.22, 0.03);
        this.playTone(t, 'sawtooth', 420, 54, 0.64, 0.13, 0.04);
        this.playTone(t + 0.12, 'triangle', 1080, 180, 0.52, 0.09, 0.02);
        this.playNoise(t, 0.62, 420, 'lowpass', 0.18, 1.4, true);
        break;

      case 'chrono_nova':
        // Transcendental celestial clock bell + radiant prismatic supernova chord!
        this.playTone(t, 'sine', 1046.5, 1042, 0.55, 0.13, 0.003);
        this.playTone(t, 'triangle', 2093.0, 2085, 0.42, 0.08, 0.003);
        this.playChord(t + 0.08, [523.25, 659.25, 783.99, 1046.5, 1318.5], 0.78, 0.2);
        this.playTone(t + 0.14, 'sine', 130, 30, 0.6, 0.25, 0.01);
        this.playNoise(t + 0.12, 0.48, 1800, 'bandpass', 0.14, 1.2, false);
        break;
    }
  }

  private getMinGapMs(cue: SoundCue): number {
    switch (cue) {
      case 'evolve':
      case 'fever':
      case 'ultimate':
      case 'victory':
      case 'defeat':
        return 110;
      case 'explosion':
      case 'cannon':
      case 'hit_base':
        return 72;
      case 'crit':
      case 'shield_break':
      case 'promote':
      case 'upgrade':
        return 65;
      case 'ui_tap':
        return 35;
      default:
        return 52;
    }
  }

  private createNoiseBuffer(ctx: AudioContext, warm: boolean): AudioBuffer {
    const length = Math.floor(ctx.sampleRate * 0.7);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    if (!warm) {
      for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    } else {
      // Pink/warm 1-pole filtered noise for richer explosions, cannons & thunder
      let prev = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        prev = prev * 0.72 + white * 0.28;
        data[i] = Math.max(-1, Math.min(1, prev * 2.2));
      }
    }
    return buffer;
  }

  private trackVoice(node: AudioScheduledSourceNode): void {
    this.activeVoices++;
    node.onended = () => {
      this.activeVoices = Math.max(0, this.activeVoices - 1);
    };
  }

  private playTone(
    startTime: number,
    type: OscillatorType,
    freqStart: number,
    freqEnd: number,
    duration: number,
    peakGain: number,
    attackSec = 0.008,
  ): void {
    const out = this.getOutputNode();
    if (!this.ctx || !out) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, freqStart), startTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), startTime + duration);

    const safeAtk = Math.min(attackSec, duration * 0.45);
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(peakGain, startTime + safeAtk);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(out);
    this.trackVoice(osc);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.025);
  }

  private playNoise(
    startTime: number,
    duration: number,
    filterFreq: number,
    filterType: BiquadFilterType,
    peakGain: number,
    q = 1.0,
    warm = false,
  ): void {
    const out = this.getOutputNode();
    const buffer = warm ? this.warmNoiseBuffer : this.whiteNoiseBuffer;
    if (!this.ctx || !out || !buffer) return;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(filterFreq, startTime);
    if (filter.Q) {
      filter.Q.setValueAtTime(q, startTime);
    }

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(out);
    this.trackVoice(src);
    src.start(startTime);
    src.stop(startTime + duration + 0.025);
  }

  private playChord(startTime: number, freqs: number[], duration: number, gainTotal: number): void {
    const perVoice = (gainTotal / Math.max(1, freqs.length)) * 1.45;
    for (const f of freqs) {
      this.playTone(startTime, 'triangle', f, f * 1.004, duration, perVoice, 0.015);
    }
  }
}
