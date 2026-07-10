/**
 * Chiptune engine — packet 003 (+ multi-track revision).
 *
 * A tiny Web Audio sequencer: square-wave lead + triangle bass + noise
 * percussion playing seamless 8-bar loops, quantized 16ths on a lookahead
 * scheduler. No audio files, no network. THREE tracks; the music chip
 * cycles COURTSIDE → FAST BREAK → MOONLIGHT → OFF (clock-chip idiom).
 *
 * Mixed QUIET on purpose: master gain 0.12 (contract cap 0.15).
 *
 * Public surface:
 *   getMusicState()             — { off, trackIdx, name } from localStorage
 *   isMusicEnabled()            — !off (kept for older call sites)
 *   cycleMusic()                — advance track → … → OFF → first track
 *   attachAutoplayGesture()     — start-on-first-user-gesture (autoplay policy)
 *   MUSIC_CHANGE_EVENT          — window event fired on state change
 *
 * The AudioContext is created ONCE (lazily, inside a user gesture) and
 * suspended/resumed on toggle — never recreated, never errors on autoplay.
 * Switching tracks swaps the master gain node so notes already scheduled
 * into the lookahead window die silently instead of bleeding through.
 */

export const MUSIC_CHANGE_EVENT = "bb-music-change";
const STORAGE_KEY = "blacktop-blitz-music";

/* ---------------------------------------------------------------------------
 * The songs. Human-editable note grids.
 *
 * Each bar is 16 sixteenth-note steps, written as 16 whitespace-separated
 * tokens: a note name ("A4", "C#5") starts a note, "-" holds the previous
 * note, "." is a rest. One step = 60/bpm/4 seconds; every loop is 8 bars
 * (128 steps) and wraps seamlessly (step index is modulo total steps).
 * Percussion: K = kick, S = snare, h = closed hat, "." = silence.
 * ------------------------------------------------------------------------- */

// --- Track 1: COURTSIDE — the original. Am | F | C | G ×2, 96 BPM. --------
// Lead sticks to A natural minor (heavy on the A-C-D-E-G pentatonic);
// bass pumps root/fifth/octave in eighths.

// prettier-ignore
const COURTSIDE_LEAD = [
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
const COURTSIDE_BASS = [
  /* Bar 1  Am */ "A2 - A2 -  E3 - A2 -  A3 - A2 -  E3 - A2 -",
  /* Bar 2  F  */ "F2 - F2 -  C3 - F2 -  F3 - F2 -  C3 - F2 -",
  /* Bar 3  C  */ "C3 - C3 -  G3 - C3 -  C4 - C3 -  G3 - C3 -",
  /* Bar 4  G  */ "G2 - G2 -  D3 - G2 -  G3 - G2 -  D3 - G2 -",
  /* Bar 5  Am */ "A2 - A2 -  E3 - A2 -  A3 - A2 -  E3 - A2 -",
  /* Bar 6  F  */ "F2 - F2 -  C3 - F2 -  F3 - F2 -  C3 - F2 -",
  /* Bar 7  C  */ "C3 - C3 -  G3 - C3 -  C4 - C3 -  G3 - C3 -",
  /* Bar 8  G  */ "G2 - G2 -  D3 - G2 -  G3 - G3 -  A3 - B3 -", // walk-up back to Am
];

// prettier-ignore
const COURTSIDE_DRUMS = [
  "K . h .  S . h .  K . K .  S . h h",
  "K . h .  S . h .  K . K .  S . h h",
  "K . h .  S . h .  K . K .  S . h h",
  "K . h .  S . h .  K . K .  S . h h",
  "K . h .  S . h .  K . K .  S . h h",
  "K . h .  S . h .  K . K .  S . h h",
  "K . h .  S . h .  K . K .  S . h h",
  "K . h .  S . h .  K . K .  S S S S", // bar-8 snare fill into the loop
];

// --- Track 2: FAST BREAK — upbeat. C | G | Am | F ×2, 112 BPM. ------------
// Bright C-major-pentatonic lead, driving hats.

// prettier-ignore
const FASTBREAK_LEAD = [
  /* Bar 1  C  */ "E5 - G5 -  C6 - G5 -  A5 - G5 E5  D5 - E5 -",
  /* Bar 2  G  */ "D5 - G5 -  B5 - G5 -  A5 - B5 -  D6 - B5 A5",
  /* Bar 3  Am */ "C6 - A5 -  E5 - A5 -  G5 - E5 D5  E5 - - -",
  /* Bar 4  F  */ "A5 - G5 -  F5 - A5 -  C6 - - -  D6 - C6 A5",
  /* Bar 5  C  */ "E5 - G5 -  C6 - G5 -  A5 - G5 E5  D5 - E5 -",
  /* Bar 6  G  */ "D5 - G5 -  B5 - D6 -  B5 - A5 G5  A5 - B5 -",
  /* Bar 7  Am */ "C6 - A5 -  E5 - G5 -  A5 - - -  G5 - E5 -",
  /* Bar 8  F  */ "F5 - A5 -  C6 - A5 -  G5 - A5 -  B5 - D6 -", // lifts back into C
];

// prettier-ignore
const FASTBREAK_BASS = [
  /* Bar 1  C  */ "C3 - C3 -  G3 - C3 -  C4 - C3 -  G3 - C3 -",
  /* Bar 2  G  */ "G2 - G2 -  D3 - G2 -  G3 - G2 -  D3 - G2 -",
  /* Bar 3  Am */ "A2 - A2 -  E3 - A2 -  A3 - A2 -  E3 - A2 -",
  /* Bar 4  F  */ "F2 - F2 -  C3 - F2 -  F3 - F2 -  C3 - F2 -",
  /* Bar 5  C  */ "C3 - C3 -  G3 - C3 -  C4 - C3 -  G3 - C3 -",
  /* Bar 6  G  */ "G2 - G2 -  D3 - G2 -  G3 - G2 -  D3 - G2 -",
  /* Bar 7  Am */ "A2 - A2 -  E3 - A2 -  A3 - A2 -  E3 - A2 -",
  /* Bar 8  F  */ "F2 - F2 -  C3 - F2 -  F3 - F3 -  G3 - B3 -", // walk-up into C
];

// prettier-ignore
const FASTBREAK_DRUMS = [
  "K . h h  S . h .  K . h K  S . h h",
  "K . h h  S . h .  K . h K  S . h h",
  "K . h h  S . h .  K . h K  S . h h",
  "K . h h  S . h .  K . h K  S . h h",
  "K . h h  S . h .  K . h K  S . h h",
  "K . h h  S . h .  K . h K  S . h h",
  "K . h h  S . h .  K . h K  S . h h",
  "K . h h  S . h .  K . S S  S . h h", // bar-8 push into the loop
];

// --- Track 3: MOONLIGHT — night chill. Dm | Bb | F | C ×2, 80 BPM. --------
// Sparse dreamy lead, long bass roots, hats only (one snare in the turn).

// prettier-ignore
const MOONLIGHT_LEAD = [
  /* Bar 1  Dm */ "D5 - - -  . - F5 -  A5 - - -  G5 - F5 -",
  /* Bar 2  Bb */ "F5 - - -  . - D5 -  F5 - - -  G5 - - -",
  /* Bar 3  F  */ "A5 - - -  . - C6 -  A5 - G5 -  F5 - - -",
  /* Bar 4  C  */ "G5 - - -  E5 - - -  G5 - - -  . - A5 -",
  /* Bar 5  Dm */ "D6 - - -  . - C6 -  A5 - - -  G5 - F5 -",
  /* Bar 6  Bb */ "G5 - - -  F5 - D5 -  F5 - - -  . - - -",
  /* Bar 7  F  */ "C6 - - -  A5 - - -  G5 - F5 -  G5 - - -",
  /* Bar 8  C  */ "A5 - G5 -  E5 - - -  D5 - - -  . - - -",
];

// prettier-ignore
const MOONLIGHT_BASS = [
  /* Bar 1  Dm */ "D3 - - -  A3 - - -  D3 - - -  A2 - - -",
  /* Bar 2  Bb */ "A#2 - - -  F3 - - -  A#2 - - -  F3 - - -",
  /* Bar 3  F  */ "F2 - - -  C3 - - -  F3 - - -  C3 - - -",
  /* Bar 4  C  */ "C3 - - -  G3 - - -  C3 - - -  G2 - - -",
  /* Bar 5  Dm */ "D3 - - -  A3 - - -  D3 - - -  A2 - - -",
  /* Bar 6  Bb */ "A#2 - - -  F3 - - -  A#2 - - -  F3 - - -",
  /* Bar 7  F  */ "F2 - - -  C3 - - -  F3 - - -  C3 - - -",
  /* Bar 8  C  */ "C3 - - -  G3 - - -  C3 - C3 -  D3 - E3 -", // walk into Dm
];

// prettier-ignore
const MOONLIGHT_DRUMS = [
  "K . . h  . . h .  K . . h  . . h .",
  "K . . h  . . h .  K . . h  . . h .",
  "K . . h  . . h .  K . . h  . . h .",
  "K . . h  . . h .  K . . h  . . h .",
  "K . . h  . . h .  K . . h  . . h .",
  "K . . h  . . h .  K . . h  . . h .",
  "K . . h  . . h .  K . . h  . . h .",
  "K . . h  . . h .  K . h h  S . h .", // soft turn into the loop
];

const STEPS_PER_BAR = 16;
const BARS = 8;
const TOTAL_STEPS = BARS * STEPS_PER_BAR; // 128 — every track uses this grid

// The track table the music chip cycles through, in order.
const TRACK_DEFS = [
  { name: "COURTSIDE", bpm: 96, lead: COURTSIDE_LEAD, bass: COURTSIDE_BASS, drums: COURTSIDE_DRUMS },
  { name: "FAST BREAK", bpm: 112, lead: FASTBREAK_LEAD, bass: FASTBREAK_BASS, drums: FASTBREAK_DRUMS },
  { name: "MOONLIGHT", bpm: 80, lead: MOONLIGHT_LEAD, bass: MOONLIGHT_BASS, drums: MOONLIGHT_DRUMS },
];

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

const TRACKS = TRACK_DEFS.map((t) => ({
  name: t.name,
  secPerStep: 60 / t.bpm / 4,
  lead: parseMelody(t.lead),
  bass: parseMelody(t.bass),
  drums: parseDrums(t.drums),
}));

/* --------------------------- audio engine --------------------------------- */

let ctx = null;
let master = null;
let noiseBuffer = null;
let timer = null;
let stepIndex = 0;
let nextTime = 0;
let playingIdx = -1; // track index currently wired into the scheduler

function ensureContext() {
  if (ctx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return; // no Web Audio — chip becomes a no-op, app still works
  ctx = new AC();
  attachMaster();
  // 1s of shared white noise for hats/snares.
  noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
}

function attachMaster() {
  master = ctx.createGain();
  master.gain.value = MASTER_GAIN;
  master.connect(ctx.destination);
}

/**
 * Track switch: notes already scheduled into the lookahead window hang off
 * the OLD master node — disconnect it and they die silently, then rewire a
 * fresh master so the new track starts clean from step 0.
 */
function silenceScheduled() {
  if (!ctx || !master) return;
  master.disconnect();
  attachMaster();
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

function scheduleStep(track, step, t) {
  const lead = track.lead.get(step);
  if (lead) {
    // 0.92 articulation gap keeps repeated notes from smearing together.
    playTone("square", lead.freq, t, lead.durSteps * track.secPerStep * 0.92, LEAD_GAIN, LEAD_GAIN * 0.4);
  }
  const bass = track.bass.get(step);
  if (bass) {
    playTone("triangle", bass.freq, t, bass.durSteps * track.secPerStep * 0.9, BASS_GAIN, BASS_GAIN * 0.6);
  }
  const drum = track.drums.get(step);
  if (drum === "K") playKick(t);
  else if (drum === "S") playNoise(t, 0.09, SNARE_GAIN, "bandpass", 1800);
  else if (drum === "h") playNoise(t, 0.03, HAT_GAIN, "highpass", 6000);
}

function tick() {
  if (!ctx || playingIdx < 0) return;
  const track = TRACKS[playingIdx];
  while (nextTime < ctx.currentTime + LOOKAHEAD_SEC) {
    scheduleStep(track, stepIndex % TOTAL_STEPS, nextTime);
    stepIndex++;
    nextTime += track.secPerStep;
  }
}

function startPlayback(idx) {
  ensureContext();
  if (!ctx) return;
  if (timer && playingIdx === idx) return; // already playing this track
  if (timer && playingIdx !== idx) {
    // Track change mid-playback: drop the scheduled tail, restart the grid.
    silenceScheduled();
    stepIndex = 0;
    nextTime = 0;
  }
  playingIdx = idx;
  ctx.resume();
  nextTime = Math.max(nextTime, ctx.currentTime + 0.05);
  tick();
  if (!timer) timer = setInterval(tick, TICK_MS);
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

/**
 * Stored state: "off", or a track index "0"/"1"/"2". Legacy values from the
 * on/off era map: "on" (or anything unrecognized) → track 0.
 */
export function getMusicState() {
  let raw = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    /* private mode */
  }
  if (raw === "off") return { off: true, trackIdx: -1, name: "OFF" };
  const idx = Math.min(TRACKS.length - 1, Math.max(0, parseInt(raw, 10) || 0));
  return { off: false, trackIdx: idx, name: TRACKS[idx].name };
}

export function isMusicEnabled() {
  return !getMusicState().off;
}

export function isMusicRunning() {
  return timer !== null;
}

function saveState(value) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* private mode — pref just won't persist */
  }
}

/** Advance the chip: track 0 → 1 → 2 → OFF → track 0 (clock-chip idiom). */
export function cycleMusic() {
  const cur = getMusicState();
  if (cur.off) {
    saveState("0");
    startPlayback(0);
  } else if (cur.trackIdx >= TRACKS.length - 1) {
    saveState("off");
    stopPlayback();
  } else {
    const next = cur.trackIdx + 1;
    saveState(String(next));
    startPlayback(next);
  }
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
    const state = getMusicState();
    if (!state.off) startPlayback(state.trackIdx);
  };
  window.addEventListener("pointerdown", onGesture, true);
  window.addEventListener("keydown", onGesture, true);
}
