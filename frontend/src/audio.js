/*
 * All sound is synthesized with the Web Audio API: an original 1940s-style
 * military march for background music, plus Morse code beeps. No audio files.
 * Browsers only allow audio after a user gesture, so nothing plays until the
 * user presses a button.
 */

let ctx = null;
let master = null;
let marchBus = null; // all band instruments go through here so the march can be ducked
let noiseBuffer = null;

function audio() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
    marchBus = ctx.createGain();
    marchBus.connect(master);
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);

function envGain(t, peak, attack, release, dest = marchBus) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + release);
  g.connect(dest);
  return g;
}

// ---- instruments -----------------------------------------------------------

function brass(midi, t, dur) {
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(900, t);
  lp.frequency.linearRampToValueAtTime(2400, t + 0.04);
  lp.connect(envGain(t, 0.16, 0.02, dur * 0.95));
  for (const detune of [-8, 8]) {
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.value = hz(midi);
    o.detune.value = detune;
    o.connect(lp);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
}

function tuba(midi, t, dur) {
  const o = ctx.createOscillator();
  o.type = "triangle";
  o.frequency.value = hz(midi);
  o.connect(envGain(t, 0.45, 0.01, dur));
  o.start(t);
  o.stop(t + dur + 0.05);
}

function snare(t, peak = 0.35) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 1200;
  src.connect(hp);
  hp.connect(envGain(t, peak, 0.002, 0.12));
  src.start(t);
  src.stop(t + 0.2);
}

function bassDrum(t) {
  const o = ctx.createOscillator();
  o.frequency.setValueAtTime(110, t);
  o.frequency.exponentialRampToValueAtTime(40, t + 0.15);
  o.connect(envGain(t, 0.8, 0.003, 0.25));
  o.start(t);
  o.stop(t + 0.3);
}

// ---- the score (original): 8 bars of 2/4, in sixteenth-note steps -----------

const BPM = 116;
const STEP = 60 / BPM / 4; // one sixteenth
const BAR = 8; // sixteenths per 2/4 bar
const R = null; // rest

// [midi, length in sixteenths]
const MELODY = [
  [65, 3], [65, 1], [70, 4],
  [74, 3], [72, 1], [70, 2], [69, 2],
  [67, 4], [75, 4],
  [74, 6], [R, 2],
  [72, 3], [72, 1], [74, 2], [72, 2],
  [70, 2], [69, 2], [67, 2], [69, 2],
  [70, 2], [65, 2], [62, 2], [65, 2],
  [70, 6], [R, 2],
];
const BASS_ROOTS = [46, 46, 39, 46, 41, 41, 46, 46]; // Bb Bb Eb Bb F F Bb Bb
const TOTAL_STEPS = BASS_ROOTS.length * BAR;

// step index -> [midi, steps]
const MELODY_AT = (() => {
  const m = new Map();
  let s = 0;
  for (const [note, len] of MELODY) {
    if (note !== R) m.set(s, [note, len]);
    s += len;
  }
  return m;
})();

function scheduleStep(step, t) {
  const bar = Math.floor(step / BAR);
  const inBar = step % BAR;

  const mel = MELODY_AT.get(step);
  if (mel) brass(mel[0], t, mel[1] * STEP * 0.9);

  // oom-pah
  if (inBar === 0) tuba(BASS_ROOTS[bar], t, STEP * 3);
  if (inBar === 4) tuba(BASS_ROOTS[bar] + 7, t, STEP * 3);

  if (inBar === 0) bassDrum(t);
  if (inBar === 4) snare(t);
  if (inBar === 6) snare(t, 0.15);
  // snare roll fill at the end of every 4th bar
  if (bar % 4 === 3 && inBar >= 4) {
    snare(t, 0.2);
    snare(t + STEP / 2, 0.25);
  }
}

// ---- transport ---------------------------------------------------------------

let timer = null;
let nextStep = 0;
let nextTime = 0;

export function startMarch() {
  audio();
  if (timer) return;
  nextStep = 0;
  nextTime = ctx.currentTime + 0.1;
  timer = setInterval(() => {
    while (nextTime < ctx.currentTime + 0.15) {
      scheduleStep(nextStep, nextTime);
      nextStep = (nextStep + 1) % TOTAL_STEPS;
      nextTime += STEP;
    }
  }, 25);
}

export function stopMarch() {
  clearInterval(timer);
  timer = null;
}

// ---- Morse playback ----------------------------------------------------------

const DOT = 0.07; // seconds per dot unit
const DUCK_LEVEL = 0.75; // march volume while Morse is tapping (75%)
const DUCK_FADE = 0.15;

let current = null; // the playback in progress, if any

/** Current audio clock time in seconds (for syncing visuals to playback). */
export const audioTime = () => (ctx ? ctx.currentTime : 0);

function duck(on) {
  const g = marchBus.gain;
  const t = ctx.currentTime;
  g.cancelScheduledValues(t);
  g.setValueAtTime(g.value, t);
  g.linearRampToValueAtTime(on ? DUCK_LEVEL : 1, t + DUCK_FADE);
}

/**
 * Play a Morse string ("." "-" " " "/") as beeps, lowering the march meanwhile.
 * Returns { events, endTime, stop }:
 *   events  - [{ index, start, end }] for each dot/dash, where `index` is the
 *             character's position in `morse` and times are on the audio clock
 *   endTime - audio clock time when playback finishes
 *   stop()  - cut playback short (also restores the march volume)
 * Starting a new playback stops the previous one.
 */
export function playMorse(morse) {
  audio();
  current?.stop();

  const nodes = [];
  const events = [];
  let t = ctx.currentTime + DUCK_FADE;
  [...morse].forEach((ch, index) => {
    if (ch === "." || ch === "-") {
      const len = ch === "." ? DOT : DOT * 3;
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = 680;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.4, t + 0.005);
      g.gain.setValueAtTime(0.4, t + len - 0.005);
      g.gain.linearRampToValueAtTime(0, t + len);
      o.connect(g);
      g.connect(master);
      o.start(t);
      o.stop(t + len);
      nodes.push(o, g);
      events.push({ index, start: t, end: t + len });
      t += len + DOT;
    } else if (ch === " ") {
      t += DOT * 2; // letter gap: 3 units including the gap after the symbol
    } else if (ch === "/") {
      t += DOT; // word gap: ~7 units with the surrounding spaces
    }
  });

  duck(true);
  const endTime = t;
  let stopped = false;
  const restoreTimer = setTimeout(() => handle.stop(), (endTime - ctx.currentTime) * 1000);

  const handle = {
    events,
    endTime,
    stop() {
      if (stopped) return;
      stopped = true;
      clearTimeout(restoreTimer);
      for (const n of nodes) {
        try {
          n.stop?.();
        } catch {
          /* already stopped */
        }
        n.disconnect();
      }
      if (current === handle) current = null;
      duck(false);
    },
  };
  current = handle;
  return handle;
}

export function stopMorse() {
  current?.stop();
}
