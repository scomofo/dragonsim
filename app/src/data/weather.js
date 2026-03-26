// ─── WEATHER SYSTEM (SNES-Style) ───
export const WEATHER_TYPES = {
  clear:       { name: "Clear",        emoji: "\u2600\uFE0F", desc: "Normal conditions", buffs: {}, debuffs: {} },
  thunderstorm:{ name: "Thunderstorm", emoji: "\u26C8\uFE0F", desc: "Lightning cracks the sky", buffs: { lightning: 1.25, ice: 1.15 }, debuffs: { fire: 0.8 } },
  downpour:    { name: "Downpour",     emoji: "\u{1F327}\uFE0F", desc: "Torrential rain floods the arena", buffs: { ice: 1.3, nature: 1.15 }, debuffs: { fire: 0.7, lightning: 0.85 } },
  heatwave:    { name: "Heat Wave",    emoji: "\u{1F525}", desc: "Scorching temperatures", buffs: { fire: 1.3, stone: 1.1 }, debuffs: { ice: 0.7, nature: 0.85 } },
  voidstorm:   { name: "Void Storm",   emoji: "\u{1F30C}", desc: "Reality destabilizes", buffs: { shadow: 1.3 }, debuffs: { stone: 0.8, nature: 0.8 } },
  sandstorm:   { name: "Sandstorm",    emoji: "\u{1F32A}\uFE0F", desc: "Blinding winds carry stone shards", buffs: { stone: 1.3, fire: 1.1 }, debuffs: { lightning: 0.8, shadow: 0.85 } },
};
export const WEATHER_KEYS = Object.keys(WEATHER_TYPES).filter(k => k !== "clear");
