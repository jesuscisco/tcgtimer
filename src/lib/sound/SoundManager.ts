export type SfxKind = "start" | "pause" | "finish" | "warning";

/**
 * Minimal WebAudio sound engine. No binary assets — every sound is a small
 * synthesized envelope, so it ships with zero files and works offline.
 * The AudioContext is created lazily on the first user gesture (autoplay
 * policies), call `ensure()` from the pointer/keydown handler.
 */
class SoundManager {
  private ctx: AudioContext | null = null;
  private ready = false;

  ensure(): void {
    if (this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      this.ready = true;
      return;
    }
    try {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.ready = true;
    } catch {
      this.ready = false;
    }
  }

  play(kind: SfxKind, volume: number): void {
    if (!this.ready || !this.ctx) return;
    if (this.ctx.state !== "running") void this.ctx.resume();
    const host = this.ctx;

    const safe = Math.min(1, Math.max(0, volume));

    switch (kind) {
      case "start":
        this.tone(host, 660, 0.14, safe, "square");
        break;
      case "pause":
        this.tone(host, 440, 0.08, safe * 0.8, "sine");
        this.tone(host, 330, 0.1, safe * 0.8, "sine", 0.09);
        break;
      case "warning":
        this.tone(host, 520, 0.16, safe * 0.85, "sine");
        break;
      case "finish": {
        this.tone(host, 740, 0.22, safe, "square");
        this.tone(host, 880, 0.3, safe, "square", 0.24);
        this.tone(host, 1108, 0.5, safe * 0.9, "square", 0.56);
        break;
      }
    }
  }

  private tone(
    host: AudioContext,
    freq: number,
    seconds: number,
    gain: number,
    type: OscillatorType,
    delay = 0
  ): void {
    const osc = host.createOscillator();
    const amp = host.createGain();
    const t0 = host.currentTime + delay;

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);

    amp.gain.setValueAtTime(0.0001, t0);
    amp.gain.linearRampToValueAtTime(gain, t0 + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);

    osc.connect(amp);
    amp.connect(host.destination);
    osc.start(t0);
    osc.stop(t0 + seconds + 0.05);
  }
}

export const soundManager = new SoundManager();