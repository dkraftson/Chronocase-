// Horological Micro-Acoustics Synthesis Engine
// High-Fidelity Web Audio simulation of mechanical escapements, ratcheting bezels, winding crowns, and cathedral gongs

class HorologyAudio {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.85;
  private isUnlocked: boolean = false;

  constructor() {
    if (typeof window !== "undefined") {
      // Auto-unlock AudioContext on first user interaction anywhere in the window
      const unlock = () => {
        this.unlockContext();
        window.removeEventListener("pointerdown", unlock);
        window.removeEventListener("keydown", unlock);
        window.removeEventListener("touchstart", unlock);
        window.removeEventListener("click", unlock);
      };

      window.addEventListener("pointerdown", unlock, { passive: true });
      window.addEventListener("keydown", unlock, { passive: true });
      window.addEventListener("touchstart", unlock, { passive: true });
      window.addEventListener("click", unlock, { passive: true });
    }
  }

  public unlockContext() {
    if (typeof window === "undefined") return;
    try {
      const ctx = this.getContext();
      if (ctx && ctx.state === "suspended") {
        ctx.resume().then(() => {
          this.isUnlocked = true;
        }).catch(() => {});
      } else if (ctx && ctx.state === "running") {
        this.isUnlocked = true;
      }
    } catch {}
  }

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(muted ? 0 : this.volume, now + 0.05);
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.ctx && this.masterGain && !this.isMuted) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.setValueAtTime(this.volume, now);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  // Generate a brief noise burst buffer for crisp metal-on-metal pallet jewel impact
  private createNoiseBuffer(ctx: AudioContext, durationSec = 0.02): AudioBuffer {
    const bufferSize = Math.floor(ctx.sampleRate * durationSec);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }
    return buffer;
  }

  /**
   * Authentic Swiss Lever Escapement Beat (Tick / Tock).
   * Simulates the 3 micro-acoustic phases:
   * 1. Pallet jewel strike on escape wheel tooth
   * 2. Impulse pin entering the balance roller notch
   * 3. Lever resting against banking pins
   */
  public playMechanicalTick(type: "tick" | "tock" = "tick", customVolume = 1.0) {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx || !this.masterGain) return;
      if (ctx.state === "suspended") ctx.resume();

      const now = ctx.currentTime;
      const isTick = type === "tick";

      // --- Layer 1: High-Frequency Pallet Jewel Metallic Click (Noise transient) ---
      const noiseNode = ctx.createBufferSource();
      noiseNode.buffer = this.createNoiseBuffer(ctx, 0.015);

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = "bandpass";
      noiseFilter.frequency.setValueAtTime(isTick ? 5200 : 4400, now);
      noiseFilter.Q.setValueAtTime(6.0, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.32 * customVolume, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.012);

      noiseNode.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.masterGain);

      noiseNode.start(now);
      noiseNode.stop(now + 0.015);

      // --- Layer 2: Main Escapement Resonant Impulse (Balance oscillation click) ---
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      const filter1 = ctx.createBiquadFilter();

      filter1.type = "bandpass";
      filter1.frequency.setValueAtTime(isTick ? 3400 : 2900, now);
      filter1.Q.setValueAtTime(8.0, now);

      osc1.type = "triangle";
      osc1.frequency.setValueAtTime(isTick ? 2400 : 2050, now);
      osc1.frequency.exponentialRampToValueAtTime(isTick ? 1400 : 1200, now + 0.018);

      gain1.gain.setValueAtTime(0.28 * customVolume, now);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.022);

      osc1.connect(filter1);
      filter1.connect(gain1);
      gain1.connect(this.masterGain);

      osc1.start(now);
      osc1.stop(now + 0.025);

      // --- Layer 3: Case & Movement Housing Resonance Body ---
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();

      osc2.type = "sine";
      osc2.frequency.setValueAtTime(isTick ? 880 : 740, now);
      osc2.frequency.exponentialRampToValueAtTime(320, now + 0.014);

      gain2.gain.setValueAtTime(0.16 * customVolume, now);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.016);

      osc2.connect(gain2);
      gain2.connect(this.masterGain);

      osc2.start(now);
      osc2.stop(now + 0.018);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  /**
   * Crisp Unidirectional Diver Bezel / GMT Ball-Bearing Ratchet Click
   */
  public playBezelClick() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx || !this.masterGain) return;
      if (ctx.state === "suspended") ctx.resume();

      const now = ctx.currentTime;

      // Crisp mechanical spring detention
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = "bandpass";
      filter.frequency.setValueAtTime(2800, now);
      filter.Q.setValueAtTime(4.0, now);

      osc.type = "triangle";
      osc.frequency.setValueAtTime(1800, now);
      osc.frequency.exponentialRampToValueAtTime(750, now + 0.025);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.035);

      // Metallic high ping
      const ping = ctx.createOscillator();
      const pingGain = ctx.createGain();

      ping.type = "sine";
      ping.frequency.setValueAtTime(3600, now);
      ping.frequency.exponentialRampToValueAtTime(2200, now + 0.015);

      pingGain.gain.setValueAtTime(0.2, now);
      pingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.018);

      ping.connect(pingGain);
      pingGain.connect(this.masterGain);

      ping.start(now);
      ping.stop(now + 0.02);
    } catch {}
  }

  /**
   * Crown Winding & Position Setting Click
   */
  public playCrownClick() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx || !this.masterGain) return;
      if (ctx.state === "suspended") ctx.resume();

      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = "highpass";
      filter.frequency.setValueAtTime(950, now);

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1250, now);
      osc.frequency.exponentialRampToValueAtTime(650, now + 0.02);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.024);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.028);
    } catch {}
  }

  /**
   * Chronograph Tactile Pusher Click (Column-wheel / Cam engagement)
   */
  public playPusherClick() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx || !this.masterGain) return;
      if (ctx.state === "suspended") ctx.resume();

      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(750, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.035);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.045);
    } catch {}
  }

  /**
   * Velvet-lined Luxury Presentation Box Lid Open / Close
   */
  public playCaseLid() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx || !this.masterGain) return;
      if (ctx.state === "suspended") ctx.resume();

      const now = ctx.currentTime;

      // Heavy wood / velvet sub resonance
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(220, now);

      osc.type = "sine";
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.18);

      gain.gain.setValueAtTime(0.42, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.22);

      // Velvet cushion latch click
      const latch = ctx.createOscillator();
      const latchGain = ctx.createGain();

      latch.type = "triangle";
      latch.frequency.setValueAtTime(980, now);
      latch.frequency.exponentialRampToValueAtTime(320, now + 0.03);

      latchGain.gain.setValueAtTime(0.18, now);
      latchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      latch.connect(latchGain);
      latchGain.connect(this.masterGain);

      latch.start(now);
      latch.stop(now + 0.04);
    } catch {}
  }

  /**
   * Manual Mainspring Crown Winding Ratchet Click
   * Simulates the click spring slipping over the ratchet wheel teeth as tension builds in the mainspring.
   */
  public playWindingRatchet(tensionLevel = 0.5) {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx || !this.masterGain) return;
      if (ctx.state === "suspended") ctx.resume();

      const now = ctx.currentTime;
      const basePitch = 1200 + tensionLevel * 400; // Pitch rises slightly as spring is wound tighter

      // Rapid mechanical ratchet click
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = "bandpass";
      filter.frequency.setValueAtTime(basePitch, now);
      filter.Q.setValueAtTime(5.0, now);

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(basePitch * 1.4, now);
      osc.frequency.exponentialRampToValueAtTime(basePitch * 0.6, now + 0.02);

      gain.gain.setValueAtTime(0.32, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.024);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.026);
    } catch {}
  }

  /**
   * Automatic Rotor Gyroscopic Spin / Free-Wobble (e.g. Valjoux 7750, high-speed ceramic ball-bearing rotor)
   */
  public playRotorWobble() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx || !this.masterGain) return;
      if (ctx.state === "suspended") ctx.resume();

      const now = ctx.currentTime;
      const duration = 0.45;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(420, now);
      filter.frequency.linearRampToValueAtTime(180, now + duration);

      osc.type = "triangle";
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.linearRampToValueAtTime(90, now + duration);

      gain.gain.setValueAtTime(0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + duration);
    } catch {}
  }

  /**
   * Chronograph Flyback / Heart-Cam Reset Snap
   */
  public playFlybackReset() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx || !this.masterGain) return;
      if (ctx.state === "suspended") ctx.resume();

      const now = ctx.currentTime;

      // Heavy hammer strike against heart cam
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(540, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.035);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.045);
    } catch {}
  }

  /**
   * Haute Horlogerie Cathedral Minute Repeater Gong Chime.
   * Striking steel gong wire wrapped around the movement.
   */
  public playMinuteRepeaterGong(pitch: "low" | "high" = "low", durationSec = 1.4) {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx || !this.masterGain) return;
      if (ctx.state === "suspended") ctx.resume();

      const now = ctx.currentTime;
      const baseFreq = pitch === "low" ? 554.37 : 830.61; // C#5 or G#5 cathedral gong

      // Fundamental gong chime
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(baseFreq, now);

      // Rich overtone
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(baseFreq * 2.76, now); // Non-integer metal rod harmonic

      gain1.gain.setValueAtTime(0.45, now);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

      gain2.gain.setValueAtTime(0.18, now);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + durationSec * 0.7);

      // Hammer strike transient click
      const strike = ctx.createOscillator();
      const strikeGain = ctx.createGain();
      strike.type = "triangle";
      strike.frequency.setValueAtTime(2400, now);
      strike.frequency.exponentialRampToValueAtTime(800, now + 0.015);
      strikeGain.gain.setValueAtTime(0.3, now);
      strikeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.018);

      osc1.connect(gain1);
      gain1.connect(this.masterGain);

      osc2.connect(gain2);
      gain2.connect(this.masterGain);

      strike.connect(strikeGain);
      strikeGain.connect(this.masterGain);

      osc1.start(now);
      osc2.start(now);
      strike.start(now);

      osc1.stop(now + durationSec);
      osc2.stop(now + durationSec);
      strike.stop(now + 0.02);
    } catch {}
  }
}

export const horologyAudio = new HorologyAudio();

