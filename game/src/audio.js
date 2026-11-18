// Tiny WebAudio sound effects. All tones are synthesised at runtime so the
// game ships with no audio files and still answers every action with a sound.
let context = null;
let muted = false;

function audio() {
  if (muted) return null;
  try {
    if (!context) {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return null;
      context = new Audio();
    }
    if (context.state === 'suspended') context.resume();
    return context;
  } catch {
    return null;
  }
}

function tone(frequency, duration, type = 'sine', volume = 0.12, slide = 0) {
  const ctx = audio();
  if (!ctx) return;
  const now = ctx.currentTime;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  if (slide) oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, frequency + slide), now + duration);
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.02);
}

export const sound = {
  shoot() { tone(680, 0.07, 'square', 0.045, -260); },
  spread() { tone(520, 0.09, 'sawtooth', 0.04, -200); },
  hit() { tone(170, 0.16, 'sawtooth', 0.11, -110); },
  pickup() { tone(880, 0.1, 'sine', 0.09, 420); },
  repair() { tone(520, 0.18, 'sine', 0.1, 360); },
  kill() { tone(240, 0.12, 'triangle', 0.07, -140); },
  wave() { tone(440, 0.3, 'sine', 0.1, 440); },
  over() { tone(300, 0.7, 'sawtooth', 0.12, -250); },
  setMuted(value) { muted = value; },
};
