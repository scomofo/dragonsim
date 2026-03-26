// ─── SPRITE SHEET CONFIG ───
export const SPRITE_SHEETS = {
  fire:      "/sprites/fire.png",
  ice:       "/sprites/ice.png",
  lightning: "/sprites/storm.png",
  nature:    "/sprites/venom.png",
  shadow:    "/sprites/shadow.png",
  stone:     "/sprites/stone.png",
};
export const ATTACK_SPRITE_SHEETS = {
  fire:      "/sprites/fire_attack.png",
  ice:       "/sprites/ice_attack.png",
  lightning: "/sprites/storm_attack.png",
  nature:    "/sprites/venom_attack.png",
  shadow:    "/sprites/shadow_attack.png",
};
export const SPRITE_COLS = 4;
export const SPRITE_ROWS = 2;
export const SPRITE_FRAMES = SPRITE_COLS * SPRITE_ROWS;
// Attack sprite sheets: only the top row (frames 0-3) contains valid battle
// animation. The bottom row holds lifecycle/hatch/projectile art that should
// NOT play during combat.
export const ATTACK_FRAME_COUNT = SPRITE_COLS; // use only the first row (4 frames)
export const FRAME_W = 352;
export const FRAME_H = 384;

// Shared image + chroma-keyed frame cache
export const _spriteCache = {};
export function getSpriteFrames(key) {
  if (_spriteCache[key]) return _spriteCache[key];
  const entry = { img: null, frames: [], ready: false, loading: false, listeners: [] };
  _spriteCache[key] = entry;
  return entry;
}
export function _loadSheet(sheetUrl, cacheKey, onReady) {
  const entry = getSpriteFrames(cacheKey);
  if (entry.ready) { onReady(); return; }
  entry.listeners.push(onReady);
  if (entry.loading) return;
  entry.loading = true;
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    const offscreen = document.createElement("canvas");
    offscreen.width = FRAME_W;
    offscreen.height = FRAME_H;
    const octx = offscreen.getContext("2d");
    for (let i = 0; i < SPRITE_FRAMES; i++) {
      const col = i % SPRITE_COLS;
      const row = Math.floor(i / SPRITE_COLS);
      octx.clearRect(0, 0, FRAME_W, FRAME_H);
      octx.drawImage(img, col * FRAME_W, row * FRAME_H, FRAME_W, FRAME_H, 0, 0, FRAME_W, FRAME_H);
      const imageData = octx.getImageData(0, 0, FRAME_W, FRAME_H);
      const d = imageData.data;
      for (let p = 0; p < d.length; p += 4) {
        const r = d[p], g = d[p+1], b = d[p+2];
        // Remove bright green background (chroma key)
        // Tight detection: only pure/near-pure green, not yellow-green dragon pixels
        if (g > 180 && r < 120 && b < 120 && g > r * 1.8 && g > b * 1.8) {
          d[p+3] = 0;
        }
      }
      octx.putImageData(imageData, 0, 0);
      entry.frames.push(offscreen.toDataURL("image/png"));
    }
    entry.ready = true;
    entry.listeners.forEach(fn => fn());
    entry.listeners = [];
  };
  img.onerror = () => {
    entry.ready = true;
    entry.failed = true;
    entry.listeners.forEach(fn => fn());
    entry.listeners = [];
  };
  img.src = sheetUrl;
}
export function loadSpriteSheet(element, onReady) {
  _loadSheet(SPRITE_SHEETS[element] || SPRITE_SHEETS.fire, element, onReady);
}
export function loadAttackSheet(element, onReady) {
  const url = ATTACK_SPRITE_SHEETS[element];
  if (!url) { onReady(); return; }
  _loadSheet(url, element + "_attack", onReady);
}
