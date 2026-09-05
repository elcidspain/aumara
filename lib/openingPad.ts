/** Dusk pad under the opening film. Original, not a licensed track. */

export type PadHandle = {
  start: () => Promise<void>;
  stop: () => void;
  playing: () => boolean;
};

type Partial = [number, OscillatorType, number];

const PARTIALS: Partial[] = [
  [73.42, "sine", 0.12],
  [110, "sine", 0.09],
  [146.83, "triangle", 0.05],
  [174.61, "sine", 0.04],
  [220, "sine", 0.032],
  [349.23, "triangle", 0.018],
];

export function createOpeningPad(): PadHandle {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let playing = false;
  const nodes: AudioScheduledSourceNode[] = [];

  async function start() {
    if (playing) return;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
    if (ctx.state === "suspended") await ctx.resume();

    master = ctx.createGain();
    master.gain.value = 0;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 980;
    lp.Q.value = 0.45;
    master.connect(lp);
    lp.connect(ctx.destination);

    const now = ctx.currentTime;
    for (const [freq, type, amp] of PARTIALS) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const lfo = ctx.createOscillator();
      const lg = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      osc.detune.value = (Math.random() - 0.5) * 4;
      g.gain.value = amp;
      lfo.type = "sine";
      lfo.frequency.value = 0.07 + Math.random() * 0.05;
      lg.gain.value = amp * 0.18;
      lfo.connect(lg);
      lg.connect(g.gain);
      osc.connect(g);
      g.connect(master);
      osc.start();
      lfo.start();
      nodes.push(osc, lfo);
    }

    const seconds = 4;
    const noiseBuf = ctx.createBuffer(1, seconds * ctx.sampleRate, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.28;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;
    noise.loop = true;
    const ng = ctx.createGain();
    ng.gain.value = 0.018;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 620;
    bp.Q.value = 0.55;
    noise.connect(bp);
    bp.connect(ng);
    ng.connect(master);
    noise.start();
    nodes.push(noise);

    master.gain.linearRampToValueAtTime(0.22, now + 2.8);
    playing = true;
  }

  function stop() {
    if (!ctx || !master) {
      playing = false;
      return;
    }
    const c = ctx;
    const t = c.currentTime;
    try {
      master.gain.cancelScheduledValues(t);
      master.gain.linearRampToValueAtTime(0, t + 0.7);
    } catch {
      /* already closed */
    }
    window.setTimeout(() => {
      for (const n of nodes) {
        try {
          n.stop();
        } catch {
          /* already stopped */
        }
      }
      nodes.length = 0;
      c.close().catch(() => undefined);
    }, 780);
    ctx = null;
    master = null;
    playing = false;
  }

  return { start, stop, playing: () => playing };
}
