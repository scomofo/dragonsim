import { SFX } from "../data/sfx.js";

export const _audioCache = {};
export function playSound(key, opts = {}) {
  const url = typeof key === "string" && key.startsWith("/") ? key : SFX[key];
  if (!url) return;
  try {
    // Cache Audio objects for reuse
    if (!_audioCache[url]) {
      const audio = new Audio(url);
      audio.preload = "auto";
      _audioCache[url] = audio;
    }
    const audio = _audioCache[url].cloneNode();
    audio.volume = opts.volume ?? 0.5;
    // Pitch randomization for blips (±5%)
    if (opts.pitchShift) {
      audio.playbackRate = 0.95 + Math.random() * 0.1;
    }
    audio.play().catch(() => {}); // silently fail if no file or autoplay blocked
  } catch (e) { /* no audio file = no sound, no error */ }
}
