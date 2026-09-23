/** Original AUMARA ambient score for the opening film. */

export type PadHandle = {
  start: () => Promise<void>;
  stop: () => void;
  playing: () => boolean;
};

type SoundState = "idle" | "starting" | "running" | "stopping" | "stopped" | "error";
type SoundTelemetry = { state: SoundState; contextState: AudioContextState | null; error: string | null };

const CHORDS = [
  [38, 45, 50, 53, 57, 64], // Dm9
  [34, 41, 46, 50, 53, 57], // Bbmaj7
  [41, 48, 53, 57, 60, 67], // Fadd9
  [36, 43, 48, 52, 57, 62], // C6/9
] as const;
const MELODY = [74, 77, 81, 76, 72, 77, 69, 74] as const;
const BAR_SECONDS = 7.6;
const midiToHz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

function telemetry(state: SoundState, ctx: AudioContext | null, error: string | null = null) {
  const target = window as unknown as { __AUMARA_SOUND?: SoundTelemetry };
  target.__AUMARA_SOUND = { state, contextState: ctx?.state ?? null, error };
}

export function createOpeningPad(): PadHandle {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let playing = false;
  let timer: number | null = null;
  let chordIndex = 0;
  const nodes: AudioScheduledSourceNode[] = [];
  telemetry("idle", null);

  function removeNode(node: AudioScheduledSourceNode) {
    const index = nodes.indexOf(node);
    if (index >= 0) nodes.splice(index, 1);
  }

  function voice(
    midi: number,
    when: number,
    length: number,
    amount: number,
    type: OscillatorType,
    detune = 0,
  ) {
    if (!ctx || !master) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(midiToHz(midi), when);
    osc.detune.value = detune;
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(amount, when + Math.min(1.6, length * 0.28));
    gain.gain.setValueAtTime(amount, Math.max(when + 0.2, when + length - 1.4));
    gain.gain.exponentialRampToValueAtTime(0.0001, when + length);
    osc.connect(gain);
    gain.connect(master);
    osc.onended = () => removeNode(osc);
    nodes.push(osc);
    osc.start(when);
    osc.stop(when + length + 0.05);
  }

  function scheduleBar() {
    if (!ctx || !master || !playing) return;
    const startAt = ctx.currentTime + 0.08;
    const chord = CHORDS[chordIndex % CHORDS.length];
    chord.forEach((note, index) => {
      voice(
        note,
        startAt + index * 0.035,
        BAR_SECONDS + 1.2,
        index < 2 ? 0.027 : 0.015,
        index % 3 === 0 ? "triangle" : "sine",
        (index - 2.5) * 1.2,
      );
    });
    for (let beat = 0; beat < 4; beat += 1) {
      const note = MELODY[(chordIndex * 2 + beat) % MELODY.length];
      voice(note, startAt + 1.05 + beat * 1.55, 2.1, 0.0105, "sine", beat % 2 ? 2.5 : -2.5);
    }
    chordIndex = (chordIndex + 1) % CHORDS.length;
  }

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

      const warm = ctx.createBiquadFilter();
      warm.type = "lowpass";
      warm.frequency.value = 1500;
      warm.Q.value = 0.28;

      const delay = ctx.createDelay(1.2);
      delay.delayTime.value = 0.37;
      const feedback = ctx.createGain();
      feedback.gain.value = 0.14;
      const wet = ctx.createGain();
      wet.gain.value = 0.12;

      master.connect(warm);
      warm.connect(ctx.destination);
      warm.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(wet);
      wet.connect(ctx.destination);

      playing = true;
      chordIndex = 0;
      scheduleBar();
      timer = window.setInterval(scheduleBar, BAR_SECONDS * 1000);
      master.gain.linearRampToValueAtTime(0.16, ctx.currentTime + 1.15);
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
    if (timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
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
      currentMaster.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);
    } catch {}

    window.setTimeout(() => {
      for (const node of nodes.splice(0)) {
        try { node.stop(); } catch {}
      }
      current.close().catch(() => undefined);
      telemetry("stopped", null);
    }, 720);
    ctx = null;
    master = null;
  }

  return { start, stop, playing: () => playing };
}
