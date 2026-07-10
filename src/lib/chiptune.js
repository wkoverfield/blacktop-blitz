/**
 * Chiptune engine — packet 003.
 *
 * A tiny Web Audio sequencer: square-wave lead + triangle bass + noise
 * percussion playing a seamless 8-bar loop in A minor (Am–F–C–G, 96 BPM,
 * quantized 16ths on a lookahead scheduler). No audio files, no network.
 *
 * Mixed QUIET on purpose: master gain 0.12 (contract cap 0.15).
 *
 * Public surface:
 *   isMusicEnabled()            — localStorage pref (default ON)
 *   toggleMusic()               — flip pref + start/suspend playback
 *   attachAutoplayGesture()     — start-on-first-user-gesture (autoplay policy)
 *   MUSIC_CHANGE_EVENT          — window event fired on pref change
 *
 * The AudioContext is created ONCE (lazily, inside a user gesture) and
 * suspended/resumed on toggle — never recreated, never errors on autoplay.
 */

export const MUSIC_CHANGE_EVENT = "bb-music-change";
const STORAGE_KEY = "blacktop-blitz-music";

/* ---------------------------------------------------------------------------
 * The song. Human-editable note grid.
 *
 * Each bar is 16 sixteenth-note steps, written as 16 whitespace-separated
 * tokens: a note name ("A4", "C#5") starts a note, "-" holds the previous
 * note, "." is a rest. 96 BPM → one step = 60/96/4 ≈ 0.156s; the full 8-bar
 * loop is 20 seconds and wraps seamlessly (step index is modulo total steps).
 *
 * Progression: Am | F | C | G | Am | F | C | G(walk-up)
 * Lead sticks to A natural minor (heavy on the A-C-D-E-G pentatonic);
 * bass pumps root/fifth/octave in eighths.
 * ------------------------------------------------------------------------- */

// prettier-ignore
const LEAD_BARS = [
  /* Bar 1  Am */ "A4 - - .  A4 - C5 -  E5 - - -  G5 - E5 -",
  /* Bar 2  F  */ "F5 - - .  A5 - G5 -  E5 - - -  C5 - D5 -",
  /* Bar 3  C  */ "E5 - - .  C5 - D5 -  E5 - G5 -  E5 - D5 -",
  /* Bar 4  G  */ "B4 - - .  G4 - B4 -  D5 - - -  . - B4 D5",
  /* Bar 5  Am */ "A4 - - .  A4 - C5 -  E5 - - -  G5 - A5 -",
  /* Bar 6  F  */ "C6 - - -  A5 - G5 -  A5 - - -  G5 - E5 -",
  /* Bar 7  C  */ "G5 - E5 -  D5 - C5 -  D5 - E5 -  G5 - E5 -",
  /* Bar 8  G  */ "D5 - B4 -  G4 - B4 -  D5 - E5 -  G5 - E5 D5",
];

// prettier-ignore
const BASS_BARS = [
  /* Bar 1  Am */ "A2 - A2 -  E3 - A2 -  A3 - A2 -  E3 - A2 -",
  /* Bar 2  F  */ "F2 - F2 -  C3 - F2 -  F3 - F2 -  C3 - F2 -",
  /* Bar 3  C  */ "C3 - C3 -  G3 - C3 -  C4 - C3 -  G3 - C3 -",
  /* Bar 4  G  */ "G2 - G2 -  D3 - G2 -  G3 - G2 -  D3 - G2 -",
  /* Bar 5  Am */ "A2 - A2 -  E3 - A2 -  A3 - A2 -  E3 - A2 -",
  /* Bar 6  F  */ "F2 - F2 -  C3 - F2 -  F3 - F2 -  C3 - F2 -",
  /* Bar 7  C  */ "C3 - C3 -  G3 - C3 -  C4 - C3 -  G3 - C3 -",
  /* Bar 8  G  */ "G2 - G2 -  D3 - G2 -  G3 - G3 -  A3 - B3 -", // walk-up back to Am
];

// Percussion: K = kick, S = snare, h = closed hat, "." = silence.
// prettier-ignore
const DRUM_BARS = [
  "K . h .  S . h .  K . K .  S . h h",
  "K . h .  S . h .  K . K .  S . h h",
  "K . h .  S . h .  K . K .  S . h h",
  "K . h .  S . h .  K . K .  S . h h",
  "K . h .  S . h .  K . K .  S . h h",
  "K . h .  S . h .  K . K .  S . h h",
  "K . h .  S . h .  K . K .  S . h h",
  "K . h .  S . h .  K . K .  S S S S", // bar-8 snare fill into the loop
];

const BPM = 96;
const SEC_PER_STEP = 60 / BPM / 4;
const STEPS_PER_BAR = 16;
const TOTAL_STEPS = LEAD_BARS.length * STEPS_PER_BAR; // 128

// Mixer levels (pre-master). Master is capped at 0.12 ≤ 0.15 (contract 8).
const MASTER_GAIN = 0.12;
const LEAD_GAIN = 0.3;
const BASS_GAIN = 0.45;
const KICK_GAIN = 0.5;
const SNARE_GAIN = 0.22;
const HAT_GAIN = 0.09;

// Lookahead scheduling: generous window so throttled background-tab timers
// (1 tick/s) never starve the queue; suspend() freezes scheduled notes, so a
// long lookahead costs nothing on toggle-off.
const LOOKAHEAD_SEC = 1.2;
const TICK_MS = 100;

/* --------------------------- grid parsing --------------------------------- */

const NOTE_OFFSET = {
  C: 0, "C#": 1, D: 2, "D#": 3, E: 4, F: 5,
  "F#": 6, G: 7, "G#": 8, A: 9, "A#": 10, B: 11,
};

function freqOf(name) {
  const m = /^([A-G]#?)(\d)$/.exec(name);
  if (!m) return null;
  const midi = NOTE_OFFSET[m[1]] + 12 * (Number(m[2]) + 1);
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Flatten bars of tokens into { step -> { freq, durSteps } }. A note's
 * duration is 1 + the run of "-" holds after it (holds may cross barlines).
 */
function parseMelody(bars) {
  const tokens = bars.flatMap((bar) => bar.trim().split(/\s+/));
  if (tokens.length !== TOTAL_STEPS) {
    // Grid typo guard — fail loud in dev, silent-skip worst case.
    console.warn(`chiptune: expected ${TOTAL_STEPS} steps, got ${tokens.length}`);
  }
  const events = new Map();
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (tok === "." || tok === "-") continue;
    const freq = freqOf(tok);
    if (freq == null) continue;
    let dur = 1;
    while (tokens[(i + dur) % tokens.length] === "-" && dur < tokens.length) dur++;
    events.set(i, { freq, durSteps: dur });
  }
  return events;
}

function parseDrums(bars) {
  const tokens = bars.flatMap((bar) => bar.trim().split(/\s+/));
  const events = new Map();
  tokens.forEach((tok, i) => {
    if (tok === "K" || tok === "S" || tok === "h") events.set(i, tok);
  });
  return events;
}

const LEAD_EVENTS = parseMelody(LEAD_BARS);
const BASS_EVENTS = parseMelody(BASS_BARS);
const DRUM_EVENTS = parseDrums(DRUM_BARS);

/* --------------------------- audio engine --------------------------------- */

let ctx = null;
let master = null;
let noiseBuffer = null;
let timer = null;
let stepIndex = 0;
let nextTime = 0;

function ensureContext() {
  if (ctx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return; // no Web Audio — chip becomes a no-op, app still works
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = MASTER_GAIN;
  master.connect(ctx.destination);
  // 1s of shared white noise for hats/snares.
  noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
}

function playTone(type, freq, t, durSec, peak, sustain) {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.008);
  g.gain.exponentialRampToValueAtTime(sustain, t + Math.max(0.02, durSec * 0.55));
  g.gain.exponentialRampToValueAtTime(0.0001, t + durSec);
  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + durSec + 0.03);
}

function playNoise(t, durSec, peak, filterType, filterFreq) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = filterFreq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(peak, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + durSec);
  src.connect(filter).connect(g).connect(master);
  src.start(t);
  src.stop(t + durSec + 0.02);
}

function playKick(t) {
  const osc = ctx.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(150, t);
  osc.frequency.exponentialRampToValueAtTime(45, t + 0.09);
  const g = ctx.createGain();
  g.gain.setValueAtTime(KICK_GAIN, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + 0.13);
}

function scheduleStep(step, t) {
  const lead = LEAD_EVENTS.get(step);
  if (lead) {
    // 0.92 articulation gap keeps repeated notes from smearing together.
    playTone("square", lead.freq, t, lead.durSteps * SEC_PER_STEP * 0.92, LEAD_GAIN, LEAD_GAIN * 0.4);
  }
  const bass = BASS_EVENTS.get(step);
  if (bass) {
    playTone("triangle", bass.freq, t, bass.durSteps * SEC_PER_STEP * 0.9, BASS_GAIN, BASS_GAIN * 0.6);
  }
  const drum = DRUM_EVENTS.get(step);
  if (drum === "K") playKick(t);
  else if (drum === "S") playNoise(t, 0.09, SNARE_GAIN, "bandpass", 1800);
  else if (drum === "h") playNoise(t, 0.03, HAT_GAIN, "highpass", 6000);
}

function tick() {
  if (!ctx) return;
  while (nextTime < ctx.currentTime + LOOKAHEAD_SEC) {
    scheduleStep(stepIndex % TOTAL_STEPS, nextTime);
    stepIndex++;
    nextTime += SEC_PER_STEP;
  }
}

function startPlayback() {
  ensureContext();
  if (!ctx || timer) return;
  ctx.resume();
  nextTime = Math.max(nextTime, ctx.currentTime + 0.05);
  tick();
  timer = setInterval(tick, TICK_MS);
}

function stopPlayback() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  // Suspend (not close): the context is created once and reused (contract 10).
  if (ctx && ctx.state === "running") ctx.suspend();
}

/* --------------------------- public surface ------------------------------- */

export function isMusicEnabled() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

export function isMusicRunning() {
  return timer !== null;
}

export function toggleMusic() {
  const next = !isMusicEnabled();
  try {
    localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
  } catch {
    /* private mode — pref just won't persist */
  }
  if (next) startPlayback();
  else stopPlayback();
  window.dispatchEvent(new Event(MUSIC_CHANGE_EVENT));
}

let gestureAttached = false;

/**
 * Autoplay-policy dance: pref defaults ON but the context may only start
 * inside a user gesture. First pointerdown/keydown anywhere starts playback —
 * EXCEPT on the music chip itself (that press is an intent to toggle, and
 * starting first would blip audio before the toggle lands OFF).
 */
export function attachAutoplayGesture() {
  if (gestureAttached) return;
  gestureAttached = true;
  const onGesture = (e) => {
    if (e.target instanceof Element && e.target.closest("[data-music-chip]")) return;
    window.removeEventListener("pointerdown", onGesture, true);
    window.removeEventListener("keydown", onGesture, true);
    if (isMusicEnabled()) startPlayback();
  };
  window.addEventListener("pointerdown", onGesture, true);
  window.addEventListener("keydown", onGesture, true);
}
