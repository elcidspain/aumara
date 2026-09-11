/** Dusk pad under the opening film. Original, not a licensed track. */

export type PadHandle = {
  start: () => Promise<void>;
  stop: () => void;
  playing: () => boolean;
};

type Partial = [number, OscillatorType, number];
type SoundState = "idle" | "starting" | "running" | "stopping" | "stopped" | "error";
type SoundTelemetry = { state: SoundState; contextState: AudioContextState | null; error: string | null };

const PARTIALS: Partial[] = [
  [73.42, "sine", 0.12],
  [110, "sine", 0.09],
  [146.83, "triangle", 0.055],
  [174.61, "sine", 0.045],
  [220, "sine", 0.035],
  [293.66, "triangle", 0.025],
  [349.23, "triangle", 0.02],
];

function telemetry(state: SoundState, ctx: AudioContext | null, error: string | null = null) {
  const target = window as unknown as { __AUMARA_SOUND?: SoundTelemetry };
  target.__AUMARA_SOUND = { state, contextState: ctx?.state ?? null, error };
}

export function createOpeningPad(): PadHandle {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let playing = false;
  const nodes: AudioScheduledSourceNode[] = [];
  telemetry("idle", null);

  async function start() {
    if (playing && ctx?.state === "running") return;
    telemetry("starting", ctx);
    try {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) throw new Error("web-audio-unavailable");

      ctx = new AC();
      if (ctx.state === "suspended") await ctx.resume();
      if (ctx.state !== "running") throw new Error(`audio-context-${ctx.state}`);

      master = ctx.createGain();
      master.gain.setValueAtTime(0.0001, ctx.currentTime);
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 1150;
      lp.Q.value = 0.4;
      master.connect(lp);
      lp.connect(ctx.destination);

      for (const [freq, type, amp] of PARTIALS) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        osc.detune.value = (Math.random() - 0.5) * 3;
        gain.gain.value = amp;
        lfo.type = "sine";
        lfo.frequency.value = 0.06 + Math.random() * 0.05;
        lfoGain.gain.value = amp * 0.16;
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);
        osc.connect(gain);
        gain.connect(master);
        osc.start();
        lfo.start();
        nodes.push(osc, lfo);
      }

      const seconds = 3;
      const noiseBuffer = ctx.createBuffer(1, seconds * ctx.sampleRate, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.22;
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = true;
      const noiseGain = ctx.createGain();
      noiseGain.gain.value = 0.024;
      const band = ctx.createBiquadFilter();
      band.type = "bandpass";
      band.frequency.value = 720;
      band.Q.value = 0.5;
      noise.connect(band);
      band.connect(noiseGain);
      noiseGain.connect(master);
      noise.start();
      nodes.push(noise);

      master.gain.linearRampToValueAtTime(0.42, ctx.currentTime + 0.65);
      playing = true;
      telemetry("running", ctx);
    } catch (error) {
      playing = false;
      const message = String(error instanceof Error ? error.message : error).slice(0, 120);
      telemetry("error", ctx, message);
      try { await ctx?.close(); } catch {}
      ctx = null;
      master = null;
      throw error;
    }
  }

  function stop() {
    if (!ctx || !master) {
      playing = false;
      telemetry("stopped", ctx);
      return;
    }
    const current = ctx;
    const currentMaster = master;
    telemetry("stopping", current);
    playing = false;
    const now = current.currentTime;
    try {
      currentMaster.gain.cancelScheduledValues(now);
      currentMaster.gain.setValueAtTime(Math.max(0.0001, currentMaster.gain.value), now);
      currentMaster.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    } catch {}

    window.setTimeout(() => {
      for (const node of nodes.splice(0)) {
        try { node.stop(); } catch {}
      }
      current.close().catch(() => undefined);
      telemetry("stopped", null);
    }, 420);
    ctx = null;
    master = null;
  }

  return { start, stop, playing: () => playing };
}
