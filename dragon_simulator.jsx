import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════
// DRAGON FORGE — Full Feature Dragon Simulator
// Build · Train · Evolve · Battle
// ═══════════════════════════════════════════════════════════════

const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = (arr) => arr[rand(0, arr.length - 1)];

// ─── SPRITE SHEET CONFIG ───
const SPRITE_SIZE = { width: 64, height: 64 }; // Pixel size of one frame
const SCALE = 3;                                 // Scale factor for retro pixel art look
const ANIMATION_DATA = {
  idle:   { row: 0, length: 4, isLooping: true },
  walk:   { row: 1, length: 4, isLooping: true },
  attack: { row: 2, length: 3, isLooping: false },
  egg:    { row: 3, length: 1, isLooping: false },
};
// Add sprite sheet paths here per element — leave unset to use the SVG fallback
const SPRITE_SHEETS = {
  ice: '/sprites/ice-dragon-sheet.png',
  // fire:      '/sprites/fire-dragon-sheet.png',
  // lightning: '/sprites/lightning-dragon-sheet.png',
  // nature:    '/sprites/nature-dragon-sheet.png',
  // shadow:    '/sprites/shadow-dragon-sheet.png',
};

// ─── ELEMENTS ───
const ELEMENTS = {
  fire: { name: "Fire", emoji: "🔥", color: "#ff4422", accent: "#ff8844", bg: "#331108", weakness: "ice", strong: "nature" },
  ice: { name: "Ice", emoji: "❄️", color: "#44bbff", accent: "#88ddff", bg: "#081828", weakness: "lightning", strong: "fire" },
  lightning: { name: "Lightning", emoji: "⚡", color: "#ffdd00", accent: "#ffee66", bg: "#282008", weakness: "nature", strong: "ice" },
  nature: { name: "Nature", emoji: "🌿", color: "#44dd66", accent: "#88ff99", bg: "#082810", weakness: "fire", strong: "lightning" },
  shadow: { name: "Shadow", emoji: "🌑", color: "#9944ff", accent: "#bb88ff", bg: "#180828", weakness: "nature", strong: "fire" },
};

// ─── BODY TYPES ───
const BODY_TYPES = [
  { id: "serpent", name: "Serpentine", desc: "+Speed", statMod: { speed: 3 } },
  { id: "tank", name: "Hulking", desc: "+Defense, +HP", statMod: { defense: 3, maxHp: 20 } },
  { id: "balanced", name: "Balanced", desc: "All-round", statMod: {} },
  { id: "wyvern", name: "Wyvern", desc: "+Attack", statMod: { attack: 3 } },
  { id: "mystic", name: "Mystic", desc: "+Mana", statMod: { maxMana: 20 } },
];

// ─── DRAGON COLORS ───
const DRAGON_COLORS = [
  { id: "default", name: "Element Default", primary: null, secondary: null },
  { id: "crimson", name: "Crimson", primary: "#cc1111", secondary: "#ff4444" },
  { id: "midnight", name: "Midnight Blue", primary: "#1133aa", secondary: "#3366dd" },
  { id: "emerald", name: "Emerald", primary: "#118833", secondary: "#33cc55" },
  { id: "gold", name: "Golden", primary: "#cc8800", secondary: "#ffbb33" },
  { id: "obsidian", name: "Obsidian", primary: "#222222", secondary: "#555555" },
  { id: "ivory", name: "Ivory", primary: "#ccbbaa", secondary: "#eeddcc" },
  { id: "violet", name: "Violet", primary: "#8822cc", secondary: "#bb55ff" },
  { id: "rust", name: "Rust", primary: "#884422", secondary: "#bb6644" },
  { id: "teal", name: "Teal", primary: "#118888", secondary: "#33bbbb" },
];

// ─── TITLES ───
const TITLES = ["", "the Fierce", "the Mighty", "Dragonborn", "Flamecaller", "Stormbringer", "the Ancient", "Worldeater", "the Unyielding", "Shadowbane", "Skyscourge"];

// ─── ABILITIES ───
const ABILITIES = {
  fire: [
    { name: "Fireball", dmg: 18, cost: 15, type: "attack", icon: "🔥", fx: "fire", desc: "Hurl a blazing fireball" },
    { name: "Inferno", dmg: 30, cost: 28, type: "attack", icon: "🌋", fx: "fire", desc: "Unleash a firestorm" },
    { name: "Flame Shield", dmg: 0, cost: 12, type: "buff", value: 3, icon: "🛡️", fx: "buff", desc: "+3 DEF this fight" },
    { name: "Searing Drain", dmg: 14, cost: 18, type: "drain", healPct: 0.4, icon: "💀", fx: "fire", desc: "Drain life from foe" },
  ],
  ice: [
    { name: "Frost Bolt", dmg: 16, cost: 13, type: "attack", icon: "❄️", fx: "ice", desc: "Launch a bolt of ice" },
    { name: "Blizzard", dmg: 28, cost: 26, type: "attack", icon: "🌨️", fx: "ice", desc: "Summon a blizzard" },
    { name: "Ice Armor", dmg: 0, cost: 14, type: "buff", value: 4, icon: "🧊", fx: "buff", desc: "+4 DEF this fight" },
    { name: "Glacial Heal", dmg: 0, cost: 20, type: "heal", value: 25, icon: "💎", fx: "heal", desc: "Restore 25 HP" },
  ],
  lightning: [
    { name: "Spark", dmg: 14, cost: 10, type: "attack", icon: "⚡", fx: "lightning", desc: "Quick lightning strike" },
    { name: "Thunder Crash", dmg: 32, cost: 30, type: "attack", icon: "🌩️", fx: "lightning", desc: "Devastating thunder" },
    { name: "Static Charge", dmg: 0, cost: 12, type: "buff", value: 3, icon: "💫", fx: "buff", desc: "+3 ATK this fight" },
    { name: "Chain Lightning", dmg: 20, cost: 22, type: "attack", icon: "🔗", fx: "lightning", desc: "Chaining shock" },
  ],
  nature: [
    { name: "Vine Whip", dmg: 15, cost: 12, type: "attack", icon: "🌿", fx: "nature", desc: "Lash with thorny vines" },
    { name: "Earthquake", dmg: 26, cost: 25, type: "attack", icon: "🌍", fx: "nature", desc: "Shake the ground" },
    { name: "Regenerate", dmg: 0, cost: 18, type: "heal", value: 30, icon: "🌱", fx: "heal", desc: "Restore 30 HP" },
    { name: "Thorn Armor", dmg: 0, cost: 14, type: "buff", value: 4, icon: "🌵", fx: "buff", desc: "+4 DEF this fight" },
  ],
  shadow: [
    { name: "Shadow Bolt", dmg: 17, cost: 14, type: "attack", icon: "🌑", fx: "shadow", desc: "Dark energy blast" },
    { name: "Void Rend", dmg: 34, cost: 32, type: "attack", icon: "🕳️", fx: "shadow", desc: "Tear through reality" },
    { name: "Dark Pact", dmg: 0, cost: 10, type: "buff", value: 4, icon: "📿", fx: "buff", desc: "+4 ATK this fight" },
    { name: "Soul Siphon", dmg: 16, cost: 20, type: "drain", healPct: 0.5, icon: "👁️", fx: "shadow", desc: "Steal life force" },
  ],
};

// ─── SHOP ITEMS ───
const SHOP_ITEMS = [
  { name: "Iron Claws", cost: 50, stat: "attack", value: 2, icon: "🗡️", desc: "+2 ATK", req: 1 },
  { name: "Razorfang", cost: 120, stat: "attack", value: 4, icon: "⚔️", desc: "+4 ATK", req: 5 },
  { name: "Scale Mail", cost: 60, stat: "defense", value: 2, icon: "🛡️", desc: "+2 DEF", req: 1 },
  { name: "Obsidian Plate", cost: 150, stat: "defense", value: 5, icon: "🪨", desc: "+5 DEF", req: 7 },
  { name: "Swift Boots", cost: 70, stat: "speed", value: 3, icon: "👢", desc: "+3 SPD", req: 3 },
  { name: "Amulet of Life", cost: 100, stat: "maxHp", value: 20, icon: "💚", desc: "+20 HP", req: 4 },
  { name: "Mana Crystal", cost: 90, stat: "maxMana", value: 15, icon: "💎", desc: "+15 MP", req: 3 },
  { name: "Crown of Elements", cost: 200, stat: "attack", value: 6, icon: "👑", desc: "+6 ATK", req: 10 },
  { name: "Dragon Heart", cost: 250, stat: "maxHp", value: 40, icon: "❤️‍🔥", desc: "+40 HP", req: 12 },
  { name: "Arcane Orb", cost: 180, stat: "maxMana", value: 25, icon: "🔮", desc: "+25 MP", req: 8 },
];

// ─── TECHNIQUES ───
const TECHNIQUES = [
  { name: "Tail Cleave", dmg: 22, cost: 16, type: "attack", icon: "🦎", fx: "fire", desc: "Sweep with tail", req: 3, price: 80 },
  { name: "Frenzy", dmg: 10, cost: 22, type: "multi", hits: 3, icon: "💢", fx: "fire", desc: "3-hit combo", req: 6, price: 150 },
  { name: "Venom Bite", dmg: 12, cost: 15, type: "poison", dot: 5, turns: 3, icon: "🐍", fx: "nature", desc: "Poison for 3 turns", req: 4, price: 100 },
  { name: "Battle Roar", dmg: 0, cost: 18, type: "roar", atkVal: 3, defVal: 2, icon: "🦁", fx: "buff", desc: "+3 ATK +2 DEF", req: 5, price: 120 },
  { name: "Life Steal", dmg: 20, cost: 22, type: "drain", healPct: 0.5, icon: "🧛", fx: "shadow", desc: "Steal 50% as HP", req: 7, price: 160 },
  { name: "Dragon Breath", dmg: 35, cost: 35, type: "attack", icon: "🐉", fx: "fire", desc: "Devastating breath", req: 9, price: 200 },
  { name: "Iron Scales", dmg: 0, cost: 15, type: "buff", value: 6, icon: "🪨", fx: "buff", desc: "+6 DEF this fight", req: 8, price: 140 },
  { name: "War Cry", dmg: 0, cost: 12, type: "buff", value: 5, icon: "📯", fx: "buff", desc: "+5 ATK this fight", req: 6, price: 130 },
  { name: "Meteor Strike", dmg: 45, cost: 45, type: "attack", icon: "☄️", fx: "fire", desc: "Call down a meteor", req: 14, price: 350 },
  { name: "Healing Surge", dmg: 0, cost: 25, type: "heal", value: 40, icon: "✨", fx: "heal", desc: "Restore 40 HP", req: 10, price: 220 },
  { name: "Ice Breath", dmg: 22, cost: 20, type: "attack", icon: "❄️", fx: "ice", desc: "Exhale a freezing blast", req: 5, price: 110 },
];

// ─── BOSSES ───
const BOSSES = [
  { name: "Infernax the World Burner", element: "fire", level: 5, hp: 200, atk: 14, def: 8, spd: 10, mana: 100, sig: { name: "World Fire", dmg: 40, cost: 30, type: "attack", icon: "🌋", fx: "fire" }, gold: 150, xp: 80 },
  { name: "Glaciara the Frozen Queen", element: "ice", level: 8, hp: 280, atk: 16, def: 12, spd: 9, mana: 120, sig: { name: "Absolute Zero", dmg: 50, cost: 35, type: "attack", icon: "🧊", fx: "ice" }, gold: 250, xp: 140 },
  { name: "Voltharion the Storm King", element: "lightning", level: 12, hp: 350, atk: 20, def: 10, spd: 18, mana: 140, sig: { name: "Judgement Bolt", dmg: 60, cost: 40, type: "attack", icon: "⚡", fx: "lightning" }, gold: 400, xp: 220 },
  { name: "Yggdraxis the Ancient Root", element: "nature", level: 16, hp: 450, atk: 18, def: 22, spd: 7, mana: 160, sig: { name: "Nature's Wrath", dmg: 55, cost: 35, type: "attack", icon: "🌍", fx: "nature" }, gold: 550, xp: 320 },
  { name: "Nihiloth the Void Dragon", element: "shadow", level: 20, hp: 600, atk: 25, def: 18, spd: 15, mana: 200, sig: { name: "Void Collapse", dmg: 75, cost: 50, type: "attack", icon: "🕳️", fx: "shadow" }, gold: 800, xp: 500 },
  { name: "Gorvath the Stone Golem", element: "nature", level: 6, hp: 300, atk: 11, def: 20, spd: 3, mana: 80, sig: { name: "Boulder Crush", dmg: 38, cost: 28, type: "attack", icon: "🪨", fx: "nature" }, gold: 180, xp: 110 },
];

// ─── EVOLUTION STAGES ───
const EVOLUTIONS = [
  { stage: "Hatchling", level: 1, desc: "A young dragon", bonus: { attack: 0, defense: 0, speed: 0, maxHp: 0, maxMana: 0 } },
  { stage: "Juvenile", level: 5, desc: "Growing stronger", bonus: { attack: 3, defense: 2, speed: 2, maxHp: 20, maxMana: 15 } },
  { stage: "Adult", level: 10, desc: "A formidable beast", bonus: { attack: 5, defense: 4, speed: 3, maxHp: 40, maxMana: 25 } },
  { stage: "Elder", level: 15, desc: "Ancient and powerful", bonus: { attack: 8, defense: 6, speed: 5, maxHp: 60, maxMana: 40 } },
  { stage: "Mythic", level: 20, desc: "Legendary dragon", bonus: { attack: 12, defense: 10, speed: 8, maxHp: 100, maxMana: 60 } },
];

// ─── ARENAS ───
const ARENAS = [
  { name: "Volcanic Crater", bg: "linear-gradient(180deg,#1a0800,#331100,#552200)", ground: "#443322" },
  { name: "Frozen Tundra", bg: "linear-gradient(180deg,#0a1525,#152535,#203545)", ground: "#889aaa" },
  { name: "Storm Peaks", bg: "linear-gradient(180deg,#0a0a15,#151525,#202035)", ground: "#445566" },
  { name: "Ancient Forest", bg: "linear-gradient(180deg,#081408,#102010,#183018)", ground: "#334422" },
  { name: "Shadow Realm", bg: "linear-gradient(180deg,#0a0515,#150a25,#1a1030)", ground: "#332244" },
  { name: "Colosseum", bg: "linear-gradient(180deg,#1a1508,#2a2010,#3a3020)", ground: "#887766" },
  { name: "Mountain Peak", bg: null, ground: "#a3d8f4", component: "mountain" },
];

// ─── ENEMY NAMES ───
const ENEMY_NAMES = ["Drakon", "Wyrmtail", "Scalefang", "Emberclaw", "Frostmaw", "Thunderwing", "Thornback", "Nightshade", "Ashfury", "Glacius", "Stormcrest", "Venomtooth", "Stone Drake", "Venom Wyvern", "Shadow Specter", "Solar Drake", "Lunar Serpent"];

// ═══════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════

// ─── HEALTH BAR ───
function HealthBar({ current, max, color, label, height = 14 }) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  return (
    <div style={{ marginBottom: 3 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#aaa", marginBottom: 1, fontFamily: "'Fira Code',monospace" }}>
        <span>{label}</span><span>{current}/{max}</span>
      </div>
      <div style={{ background: "#1a1a1a", borderRadius: 3, height, overflow: "hidden", border: "1px solid #333" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg,${color},${color}88)`, borderRadius: 3, transition: "width 0.5s ease" }} />
      </div>
    </div>
  );
}

// ─── ACTION LOG (typewriter dialogue box) ───
function ActionLog({ message }) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTypingDone, setIsTypingDone] = useState(false);

  useEffect(() => {
    setDisplayedText('');
    setIsTypingDone(false);
    let i = 0;
    const t = setInterval(() => {
      setDisplayedText(prev => prev + message.charAt(i));
      i++;
      if (i >= message.length) { clearInterval(t); setIsTypingDone(true); }
    }, 40);
    return () => clearInterval(t);
  }, [message]);

  return (
    <div style={{
      position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)',
      width: '90%', height: '56px',
      backgroundColor: '#000080',
      backgroundImage: 'linear-gradient(180deg, #0000cc 0%, #000080 100%)',
      border: '3px solid #fff',
      boxShadow: 'inset -3px -3px 0px #000, inset 3px 3px 0px rgba(255,255,255,0.4), 0px 6px 0px rgba(0,0,0,0.5)',
      padding: '8px 14px', zIndex: 20,
      fontFamily: '"Courier New", Courier, monospace',
      color: '#fff', fontSize: '11px', lineHeight: '1.4',
      textShadow: '1px 1px #000', imageRendering: 'pixelated',
    }}>
      <style>{`@keyframes dialogBounce { from { transform: translateY(0); } to { transform: translateY(3px); } }`}</style>
      {displayedText}
      <div style={{
        position: 'absolute', bottom: '6px', right: '10px',
        width: 0, height: 0,
        borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '8px solid #fff',
        animation: 'dialogBounce 0.6s infinite alternate',
        opacity: isTypingDone ? 1 : 0,
      }} />
    </div>
  );
}

// ─── DRAGON SVG SPRITE ───
function DragonSprite({ element, size = 80, color: overrideColor, stage = 0, animate = false, flip = false }) {
  const el = ELEMENTS[element] || ELEMENTS.fire;
  const c1 = overrideColor || el.color;
  const c2 = el.accent;
  const sc = size / 100;
  const horns = stage >= 2 ? 3 : stage >= 1 ? 2 : 1;
  const glow = stage >= 3;

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ transform: flip ? "scaleX(-1)" : "none" }}>
      {glow && <circle cx="50" cy="50" r="45" fill="none" stroke={c1} strokeWidth="1" opacity="0.3">
        <animate attributeName="r" values="42;48;42" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.2;0.5;0.2" dur="2s" repeatCount="indefinite" />
      </circle>}
      {/* Wings */}
      <path d={`M45,40 Q20,15 10,30 Q15,35 25,38 Q18,28 30,22 Q25,35 40,42Z`} fill={c1} opacity="0.6" />
      <path d={`M55,40 Q80,15 90,30 Q85,35 75,38 Q82,28 70,22 Q75,35 60,42Z`} fill={c1} opacity="0.6" />
      {/* Wing veins */}
      <line x1="45" y1="40" x2="20" y2="25" stroke={c2} strokeWidth="0.5" opacity="0.4" />
      <line x1="45" y1="40" x2="28" y2="30" stroke={c2} strokeWidth="0.5" opacity="0.4" />
      <line x1="55" y1="40" x2="80" y2="25" stroke={c2} strokeWidth="0.5" opacity="0.4" />
      <line x1="55" y1="40" x2="72" y2="30" stroke={c2} strokeWidth="0.5" opacity="0.4" />
      {/* Body */}
      <ellipse cx="50" cy="55" rx="18" ry="22" fill={c1} />
      <ellipse cx="50" cy="55" rx="14" ry="18" fill={c2} opacity="0.15" />
      {/* Scales pattern */}
      {[0, 1, 2, 3, 4].map(i => (
        <path key={i} d={`M${42 + i * 4},${45 + i * 3} Q${44 + i * 4},${43 + i * 3} ${46 + i * 4},${45 + i * 3}`} fill="none" stroke={c2} strokeWidth="0.5" opacity="0.3" />
      ))}
      {/* Head */}
      <ellipse cx="50" cy="32" rx="12" ry="10" fill={c1} />
      {/* Brow ridges */}
      <path d="M40,29 Q43,26 46,29" fill="none" stroke={c2} strokeWidth="1" opacity="0.5" />
      <path d="M54,29 Q57,26 60,29" fill="none" stroke={c2} strokeWidth="1" opacity="0.5" />
      {/* Eyes */}
      <ellipse cx="44" cy="30" rx="3" ry="2.5" fill="#111" />
      <ellipse cx="56" cy="30" rx="3" ry="2.5" fill="#111" />
      <ellipse cx="44" cy="30" rx="1.5" ry="2" fill={c2} />
      <ellipse cx="56" cy="30" rx="1.5" ry="2" fill={c2} />
      {/* Nostrils */}
      <circle cx="47" cy="35" r="1" fill="#111" />
      <circle cx="53" cy="35" r="1" fill="#111" />
      {/* Teeth */}
      <path d="M43,37 L44,39 L45,37" fill="#eee" />
      <path d="M55,37 L56,39 L57,37" fill="#eee" />
      {/* Horns */}
      {Array.from({ length: horns }).map((_, i) => (
        <g key={i}>
          <path d={`M${42 - i * 3},${28 - i * 2} Q${38 - i * 4},${18 - i * 3} ${40 - i * 2},${14 - i * 4}`} fill="none" stroke={c2} strokeWidth="2" strokeLinecap="round" />
          <path d={`M${58 + i * 3},${28 - i * 2} Q${62 + i * 4},${18 - i * 3} ${60 + i * 2},${14 - i * 4}`} fill="none" stroke={c2} strokeWidth="2" strokeLinecap="round" />
        </g>
      ))}
      {/* Dorsal spines */}
      {[0, 1, 2, 3].map(i => (
        <path key={i} d={`M${48 + i},${40 + i * 5} L50,${36 + i * 5} L${52 - i},${40 + i * 5}`} fill={c2} opacity="0.6" />
      ))}
      {/* Legs */}
      <rect x="36" y="68" width="6" height="12" rx="2" fill={c1} />
      <rect x="58" y="68" width="6" height="12" rx="2" fill={c1} />
      {/* Claws */}
      {[0, 1, 2].map(i => <line key={`l${i}`} x1={37 + i * 2} y1="80" x2={36 + i * 2} y2="83" stroke={c2} strokeWidth="1" strokeLinecap="round" />)}
      {[0, 1, 2].map(i => <line key={`r${i}`} x1={59 + i * 2} y1="80" x2={58 + i * 2} y2="83" stroke={c2} strokeWidth="1" strokeLinecap="round" />)}
      {/* Tail */}
      <path d="M50,75 Q60,82 70,78 Q78,75 82,70 L85,73 L83,67 L80,71 Q75,76 65,79 Q55,82 50,75" fill={c1} />
      {/* Tail spikes */}
      <path d="M78,72 L82,68 L80,74" fill={c2} opacity="0.6" />
      {/* Breathing animation */}
      {animate && (
        <circle cx="50" cy="38" r="2" fill={c1} opacity="0">
          <animate attributeName="cy" values="38;32;26" dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0.3;0" dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="r" values="2;4;6" dur="1.5s" repeatCount="indefinite" />
        </circle>
      )}
    </svg>
  );
}

// ─── FLOATING TEXT ───
function FloatText({ texts }) {
  return texts.map((t, i) => (
    <div key={t.id || i} style={{
      position: "absolute", left: t.side === "player" ? "20%" : "65%", top: "30%",
      fontSize: 14, fontWeight: 900, color: t.color, pointerEvents: "none",
      animation: "floatUp 1.2s ease forwards", fontFamily: "'Fira Code',monospace",
      textShadow: `0 0 8px ${t.color}`,
    }}>{t.text}</div>
  ));
}

// ─── SPELL PARTICLES ───
function SpellParticles({ fx, side }) {
  if (!fx) return null;
  const colors = {
    fire: ["#ff4422", "#ff8844", "#ffcc00"],
    ice: ["#44bbff", "#88ddff", "#ffffff"],
    lightning: ["#ffdd00", "#ffee66", "#ffffff"],
    nature: ["#44dd66", "#88ff99", "#aaffcc"],
    shadow: ["#9944ff", "#bb88ff", "#dd88ff"],
    heal: ["#44ff88", "#88ffaa", "#ccffdd"],
    buff: ["#ffaa00", "#ffcc44", "#ffee88"],
  };
  const cs = colors[fx] || colors.fire;
  const x = side === "player" ? 70 : 25;
  return (
    <div style={{ position: "absolute", left: `${x}%`, top: "35%", pointerEvents: "none" }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          width: rand(4, 8), height: rand(4, 8), borderRadius: "50%",
          background: pick(cs),
          left: rand(-30, 30), top: rand(-30, 30),
          animation: `particleBurst 0.8s ease forwards`,
          animationDelay: `${i * 0.05}s`,
          opacity: 0,
        }} />
      ))}
    </div>
  );
}

// ─── STATUS ICON ───
function StatusIcon({ type }) {
  const effects = {
    BURN:  { color: '#e74c3c', clip: 'polygon(50% 0%, 100% 70%, 80% 100%, 20% 100%, 0% 70%)', glow: '#f39c12' },
    CHILL: { color: '#a3d8f4', clip: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',            glow: '#fff' },
    STUN:  { color: '#f1c40f', clip: 'polygon(40% 0%, 100% 40%, 60% 40%, 80% 100%, 0% 50%, 40% 50%)', glow: '#fff' },
    POISON:{ color: '#44dd66', clip: 'polygon(50% 0%, 80% 20%, 100% 50%, 80% 80%, 50% 100%, 20% 80%, 0% 50%, 20% 20%)', glow: '#88ff44' },
  };
  const effect = effects[type];
  if (!effect) return null;
  return (
    <div style={{ width: 20, height: 20, imageRendering: 'pixelated', position: 'relative', animation: 'pulseStatus 0.8s infinite alternate', filter: 'drop-shadow(2px 2px 0px rgba(0,0,0,0.5))' }}>
      <style>{`@keyframes pulseStatus { from { transform: scale(1); } to { transform: scale(1.2); } }`}</style>
      <div style={{ width: '100%', height: '100%', backgroundColor: effect.color, clipPath: effect.clip, boxShadow: `inset -2px -2px 0px rgba(0,0,0,0.4), 0 0 5px ${effect.glow}` }} />
    </div>
  );
}

// ─── DRAGON COMBAT HUD ───
function DragonCombatHUD({ name, currentHP, maxHP, currentMana, maxMana, activeEffects = [] }) {
  const hpPct = Math.max(0, Math.min(100, (currentHP / maxHP) * 100));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, width: 120, pointerEvents: 'none', fontFamily: '"Courier New",monospace', color: '#fff' }}>
      {/* Status icons */}
      <div style={{ display: 'flex', gap: 4, height: 20 }}>
        {activeEffects.map((eff, i) => <StatusIcon key={i} type={eff} />)}
      </div>
      {/* Name */}
      <div style={{ fontSize: 9, textShadow: '1px 1px #000', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
        {name.toUpperCase()}
      </div>
      {/* HP bar */}
      <div style={{ width: '100%', height: 10, backgroundColor: '#3d2314', border: '2px solid #fff', boxShadow: '2px 2px 0px rgba(0,0,0,0.5)' }}>
        <div style={{ width: `${hpPct}%`, height: '100%', backgroundColor: hpPct > 30 ? '#2ecc71' : '#e74c3c', transition: 'width 0.3s steps(5)', boxShadow: 'inset 0px 2px 0px rgba(255,255,255,0.4)' }} />
      </div>
      {/* Mana row */}
      {currentMana !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <ManaCrystal size={10} />
          <span style={{ fontSize: 9 }}>{currentMana}/{maxMana}</span>
        </div>
      )}
    </div>
  );
}

// ─── MANA CRYSTAL ───
function ManaCrystal({ size = 16 }) {
  return (
    <span style={{ position: 'relative', display: 'inline-block', width: size, height: size * 1.25, imageRendering: 'pixelated', filter: 'contrast(1.1) brightness(1.1)', verticalAlign: 'middle' }}>
      <style>{`@keyframes manaPulse { 0% { transform: scaleY(0.8); opacity: 0.5; } 100% { transform: scaleY(1.2); opacity: 1; } }`}</style>
      {/* Aura */}
      <span style={{ position: 'absolute', bottom: '-10%', left: 0, width: '100%', height: '30%', background: 'radial-gradient(ellipse at center, rgba(0,204,255,0.3) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(2px)', animation: 'manaPulse 1.5s ease-in-out infinite alternate', display: 'block' }} />
      {/* Crystal body */}
      <span style={{ position: 'absolute', top: '10%', left: '10%', width: '80%', height: '80%', backgroundColor: '#00ccff', clipPath: 'polygon(50% 0%, 100% 30%, 80% 100%, 20% 100%, 0% 30%)', boxShadow: 'inset -4px -4px 0px rgba(0,0,0,0.4), inset 4px 4px 0px rgba(255,255,255,0.6)', display: 'block' }}>
        {/* Flare */}
        <span style={{ position: 'absolute', width: '3px', height: '6px', top: '20%', left: '20%', backgroundColor: '#fff', opacity: 0.8, display: 'block' }} />
      </span>
    </span>
  );
}

// ─── ICE BREATH ARTWORK ───
function IceBreathArtwork() {
  const Shard = ({ size, top, left, rotate, delay }) => (
    <div style={{
      position: 'absolute', width: size, height: size * 1.5,
      top, left, transform: `rotate(${rotate}deg)`,
      backgroundColor: '#fff',
      clipPath: 'polygon(50% 0%, 100% 100%, 50% 80%, 0% 100%)',
      boxShadow: 'inset -2px -2px 0px #a3d8f4',
      opacity: 0.9,
      animation: `iceFloat 3s ease-in-out infinite alternate ${delay}s`,
    }} />
  );
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#050a14', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes iceFloat { from { transform: translateY(0px); } to { transform: translateY(-10px); } }`}</style>
      {/* Mist */}
      <div style={{ position: 'absolute', width: '120%', height: '120%', background: 'radial-gradient(circle, rgba(163,216,244,0.4) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(8px)' }} />
      {/* Shards */}
      <Shard size={30} top="20%" left="40%" rotate={10} delay={0} />
      <Shard size={20} top="40%" left="25%" rotate={-25} delay={0.5} />
      <Shard size={25} top="50%" left="60%" rotate={45} delay={1.2} />
      <Shard size={15} top="10%" left="15%" rotate={-10} delay={0.8} />
      {/* Snow particles */}
      <div style={{ position: 'absolute', width: '4px', height: '4px', backgroundColor: '#fff', boxShadow: '20px 40px #fff, -30px 20px #a3d8f4, 50px -10px #fff, -40px -30px #a3d8f4' }} />
    </div>
  );
}

// ─── LAVA PLUME ARTWORK ───
function LavaPlumeArtwork() {
  // Fixed heights per plume — avoids Math.random() recalculating every render
  const plumeHeights = [42, 68, 55, 78, 48];
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#1a0505', overflow: 'hidden', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <style>{`@keyframes lavaFlicker { 0% { transform: scale(1) translateY(0); filter: brightness(1); } 100% { transform: scale(1.1) translateY(-5px); filter: brightness(1.3); } }`}</style>
      {/* Heat glow */}
      <div style={{ position: 'absolute', width: '150%', height: '100%', background: 'radial-gradient(circle, #e67e22 0%, transparent 70%)', opacity: 0.3, filter: 'blur(10px)' }} />
      {/* Plumes */}
      {plumeHeights.map((h, i) => (
        <div key={i} style={{
          position: 'absolute', bottom: '-10px',
          left: `${15 + i * 15}%`,
          width: `${20 + i * 5}px`,
          height: `${h}px`,
          backgroundColor: i % 2 === 0 ? '#e74c3c' : '#f39c12',
          clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
          animation: `lavaFlicker ${0.8 + i * 0.15}s infinite alternate`,
          opacity: 0.9,
          border: '1px solid #3d0a0a',
        }} />
      ))}
      {/* Embers */}
      <div style={{ position: 'absolute', width: '2px', height: '2px', backgroundColor: '#f1c40f', boxShadow: '10px -40px #f1c40f, -20px -60px #e67e22, 40px -30px #f1c40f' }} />
    </div>
  );
}

// Map fx types to artwork components — add more as assets are created
const CARD_ARTWORK = {
  ice: IceBreathArtwork,
  fire: LavaPlumeArtwork,
  lightning: ThunderStrikeArtwork,
};

// ─── THUNDER STRIKE ARTWORK ───
function ThunderStrikeArtwork() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#0a0520', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes boltPulse { 0% { opacity: 0.4; filter: brightness(1); } 100% { opacity: 1; filter: brightness(1.8); } }`}</style>
      {/* Glow */}
      <div style={{ position: 'absolute', width: '100%', height: '100%', background: 'radial-gradient(circle, rgba(255,220,0,0.3) 0%, transparent 70%)', animation: 'boltPulse 0.4s infinite alternate' }} />
      {/* Main bolt */}
      <div style={{ width: '18px', height: '70px', backgroundColor: '#f1c40f', clipPath: 'polygon(40% 0%, 100% 40%, 60% 40%, 80% 100%, 0% 50%, 40% 50%)', boxShadow: '0 0 12px #fff', animation: 'boltPulse 0.4s infinite alternate' }} />
      {/* Sparks */}
      <div style={{ position: 'absolute', width: '3px', height: '3px', backgroundColor: '#fff', boxShadow: '15px -20px #fff, -15px -30px #f1c40f, 20px 10px #fff, -10px 20px #f1c40f' }} />
    </div>
  );
}

// ─── CARD HAND ───
function CardHand({ cards, onPlayCard }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  return (
    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', width: '100%', height: '200px', pointerEvents: 'none', marginTop: 4 }}>
      <style>{`
        @keyframes drawCard { 0% { transform: translate(200px,80px) rotate(20deg); opacity: 0; } 100% { transform: translate(0,0) rotate(var(--rot)); opacity: 1; } }
        @keyframes cardFocus { 0% { transform: translate(-50%,-50%) scale(1); } 60% { transform: translate(-50%,-50%) scale(1.4); } 100% { transform: translate(-50%,-50%) scale(1.3); opacity: 0; } }
      `}</style>
      {cards.map((card, i) => {
        const rotation = (i - (cards.length - 1) / 2) * 5;
        const isHovered = hoveredIndex === i;
        const Artwork = CARD_ARTWORK[card.fx];
        return (
          <div key={card.id} onMouseEnter={() => setHoveredIndex(i)} onMouseLeave={() => setHoveredIndex(null)} onClick={() => card.canPlay && onPlayCard(card, i)}
            style={{
              cursor: card.canPlay ? 'pointer' : 'default', pointerEvents: 'auto',
              transition: 'transform 0.2s cubic-bezier(0.18,0.89,0.32,1.28)',
              transform: `rotate(${rotation}deg) translateY(${isHovered ? '-30px' : '0px'}) scale(${isHovered ? 0.75 : 0.65})`,
              transformOrigin: 'bottom center',
              margin: '0 -18px',
              animation: `drawCard 0.4s ease-out forwards ${i * 0.08}s`,
              opacity: card.canPlay ? 1 : 0.5,
              '--rot': `${rotation}deg`,
              zIndex: isHovered ? 50 : i,
            }}>
            <CardFrame name={card.name} description={card.desc} rarity={card.rarity} owned={false} disabled={!card.canPlay}>
              {Artwork ? <Artwork /> : <span style={{ fontSize: 32 }}>{card.icon}</span>}
            </CardFrame>
          </div>
        );
      })}
    </div>
  );
}

// ─── ENEMY THOUGHT BUBBLE ───
function EnemyThoughtBubble() {
  return (
    <div style={{ position: 'absolute', top: '-44px', left: '10px', backgroundColor: '#fff', border: '3px solid #000', padding: '4px 8px', fontFamily: '"Courier New",monospace', fontSize: 12, fontWeight: 'bold', zIndex: 20, animation: 'floatBubble 1s infinite alternate', whiteSpace: 'nowrap' }}>
      <style>{`@keyframes floatBubble { from { transform: translateY(0); } to { transform: translateY(-5px); } }`}</style>
      ... !
      <div style={{ position: 'absolute', bottom: '-10px', left: 10, width: 6, height: 6, backgroundColor: '#fff', borderBottom: '3px solid #000', borderRight: '3px solid #000', transform: 'rotate(45deg)' }} />
    </div>
  );
}

// ─── DAMAGE POP-UP ───
function DamagePopUp({ value, x, y, color = '#e74c3c' }) {
  return (
    <div style={{ position: 'absolute', top: y, left: x, color, fontSize: 22, fontWeight: 'bold', fontFamily: '"Courier New",monospace', textShadow: '2px 2px #000', zIndex: 100, animation: 'damageBounce 0.6s forwards steps(4)', pointerEvents: 'none' }}>
      <style>{`@keyframes damageBounce { 0% { transform: translateY(0) scale(1); opacity: 1; } 50% { transform: translateY(-28px) scale(1.5); } 100% { transform: translateY(-10px) scale(1.2); opacity: 0; } }`}</style>
      -{value}
    </div>
  );
}

// ─── GLACIAL CARD FRAME ───
function CardFrame({ children, name, description, rarity = 'common', onClick, disabled, owned }) {
  const colors = {
    common: '#4a90e2',
    rare: '#9b59b6',
    legendary: '#f1c40f',
  };
  const col = colors[rarity];
  return (
    <div onClick={!disabled && !owned ? onClick : undefined} style={{
      width: '150px',
      backgroundColor: 'rgba(255,255,255,0.08)',
      backdropFilter: 'blur(4px)',
      position: 'relative',
      padding: '10px',
      margin: '6px',
      border: `4px solid ${owned ? '#44dd66' : disabled ? '#333' : col}`,
      boxShadow: owned || disabled ? 'none' : `inset 4px 4px 0px rgba(255,255,255,0.3), inset -4px -4px 0px rgba(0,0,0,0.3), 6px 6px 0px rgba(0,0,0,0.3)`,
      color: '#fff',
      fontFamily: '"Courier New", Courier, monospace',
      cursor: disabled || owned ? 'default' : 'pointer',
      opacity: disabled ? 0.45 : 1,
      transition: 'transform 0.1s',
      flexShrink: 0,
    }}
    onMouseEnter={e => { if (!disabled && !owned) e.currentTarget.style.transform = 'translateY(-3px)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Artwork area */}
      <div style={{
        width: '100%', height: '90px',
        backgroundColor: '#000',
        border: '2px solid rgba(255,255,255,0.15)',
        marginBottom: '8px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', fontSize: 36,
      }}>
        {children}
      </div>
      <div style={{ fontSize: '11px', fontWeight: 'bold', textAlign: 'center', color: owned ? '#44dd66' : col }}>
        {owned ? '✓ ' : ''}{name}
      </div>
      <div style={{ fontSize: '9px', marginTop: '6px', lineHeight: '1.3', color: '#aaa' }}>
        {description}
      </div>
    </div>
  );
}

// ─── STONE DRAKE ───
function StoneDrake() {
  const BodyPart = ({ width, height, color, clip, top, left, z, delay = 0, children }) => (
    <div style={{
      position: 'absolute', width, height, top, left, zIndex: z,
      backgroundColor: color, clipPath: clip,
      border: '3px solid #2c1e14',
      boxShadow: 'inset -8px -8px 0px rgba(0,0,0,0.4)',
      animation: `stoneIdle 3s ease-in-out infinite alternate ${delay}s`,
    }}>{children}</div>
  );
  return (
    <div style={{ position: 'relative', width: '180px', height: '120px', imageRendering: 'pixelated' }}>
      <style>{`@keyframes stoneIdle { from { transform: translateY(0); } to { transform: translateY(3px); } }`}</style>
      <BodyPart width="60px" height="40px" color="#5d4037" clip="polygon(0 40%, 100% 0, 100% 100%, 0 60%)" top="60%" left="60%" z={1} />
      <BodyPart width="80px" height="30px" color="#4e342e" clip="polygon(0 100%, 20% 0, 40% 100%, 60% 0, 80% 100%, 100% 0)" top="20%" left="30%" z={0} />
      <BodyPart width="100px" height="70px" color="#795548" clip="polygon(10% 0, 90% 0, 100% 100%, 0 100%)" top="40%" left="20%" z={2} />
      <BodyPart width="50px" height="50px" color="#8d6e63" clip="polygon(0 20%, 100% 20%, 100% 80%, 0 80%)" top="30%" left="5%" z={3}>
        <div style={{ position: 'absolute', top: '40%', left: '70%', width: '6px', height: '6px', backgroundColor: '#fff', border: '1px solid #000' }} />
      </BodyPart>
    </div>
  );
}

// ─── VENOM WYVERN ───
function VenomWyvern() {
  return (
    <div style={{ position: 'relative', width: '160px', height: '140px', imageRendering: 'pixelated' }}>
      <style>{`
        @keyframes wyvernSway { from { transform: rotate(-5deg); } to { transform: rotate(5deg); } }
        @keyframes venomDrip { 0% { top: 40%; opacity: 1; } 100% { top: 80%; opacity: 0; } }
      `}</style>
      <div style={{ position: 'absolute', left: '15%', width: '4px', height: '8px', backgroundColor: '#76ff03', animation: 'venomDrip 1s infinite' }} />
      <div style={{
        position: 'absolute', width: '40px', height: '100px', backgroundColor: '#2e7d32',
        clipPath: 'polygon(30% 0, 70% 0, 100% 100%, 0 100%)', top: '20%', left: '20%',
        border: '3px solid #1b5e20', animation: 'wyvernSway 2s ease-in-out infinite alternate'
      }} />
      <div style={{
        position: 'absolute', width: '120px', height: '60px', backgroundColor: '#4a148c',
        clipPath: 'polygon(0 0, 50% 20%, 100% 0, 80% 100%, 20% 100%)', top: '10%', left: '30%', zIndex: 0
      }} />
      <div style={{
        position: 'absolute', width: '40px', height: '30px', backgroundColor: '#4caf50',
        clipPath: 'polygon(0 0, 100% 30%, 100% 70%, 0 100%, 20% 50%)', top: '10%', left: '10%', zIndex: 4
      }}>
        <div style={{ position: 'absolute', top: '30%', left: '60%', width: '4px', height: '4px', backgroundColor: '#ff1744' }} />
      </div>
    </div>
  );
}

// ─── SHADOW SPECTER ───
function ShadowSpecter() {
  const trails = [
    { left: '20%', delay: 0 },
    { left: '40%', delay: 0.5 },
    { left: '60%', delay: 1.0 },
  ];
  return (
    <div style={{ position: 'relative', width: '150px', height: '150px', imageRendering: 'pixelated' }}>
      <style>{`
        @keyframes floatGhost {
          0% { transform: translateY(0) scale(1); opacity: 0.6; }
          100% { transform: translateY(-15px) scale(1.05); opacity: 0.9; }
        }
      `}</style>
      {trails.map((t, i) => (
        <div key={i} style={{
          position: 'absolute', bottom: '10%', left: t.left,
          width: '20px', height: '40px', backgroundColor: '#212121',
          clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
          opacity: 0.4, animation: `floatGhost 2s infinite alternate ${t.delay}s`
        }} />
      ))}
      <div style={{
        position: 'absolute', width: '80px', height: '100px',
        backgroundColor: '#000', border: '2px solid #6a1b9a',
        clipPath: 'polygon(50% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%)',
        top: '20%', left: '30%', boxShadow: '0 0 20px #6a1b9a',
        animation: 'floatGhost 1.5s ease-in-out infinite alternate'
      }}>
        <div style={{ position: 'absolute', top: '30%', left: '25%', width: '8px', height: '8px', backgroundColor: '#fff', borderRadius: '50%', boxShadow: '0 0 10px #fff' }} />
        <div style={{ position: 'absolute', top: '30%', left: '60%', width: '8px', height: '8px', backgroundColor: '#fff', borderRadius: '50%', boxShadow: '0 0 10px #fff' }} />
      </div>
    </div>
  );
}

// ─── STONE GOLEM ───
function StoneGolem() {
  const rockStyle = (width, height, color, clip, delay) => ({
    width, height, backgroundColor: color, clipPath: clip,
    border: '2px solid #2c3e50',
    boxShadow: 'inset -6px -6px 0px rgba(0,0,0,0.3), inset 4px 4px 0px rgba(255,255,255,0.1)',
    animation: `golemIdle 3s ease-in-out infinite alternate ${delay}s`,
  });
  return (
    <div style={{ position: 'relative', width: '160px', height: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', filter: 'drop-shadow(10px 10px 0px rgba(0,0,0,0.2))' }}>
      <style>{`@keyframes golemIdle { 0% { transform: translateY(0px); } 100% { transform: translateY(-8px); } }`}</style>
      {/* Head */}
      <div style={rockStyle('40px', '40px', '#95a5a6', 'polygon(10% 0, 90% 0, 100% 100%, 0 100%)', 0)}>
        <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '15px', width: '100%' }}>
          <div style={{ width: '6px', height: '6px', backgroundColor: '#e67e22', boxShadow: '0 0 5px #e67e22' }} />
          <div style={{ width: '6px', height: '6px', backgroundColor: '#e67e22', boxShadow: '0 0 5px #e67e22' }} />
        </div>
      </div>
      {/* Torso */}
      <div style={{ ...rockStyle('100px', '80px', '#7f8c8d', 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)', 0.5), margin: '-5px 0' }}>
        <div style={{ width: '40px', height: '4px', backgroundColor: '#2c3e50', opacity: 0.3, margin: '20px auto' }} />
      </div>
      {/* Arms */}
      <div style={{ display: 'flex', gap: '80px', position: 'absolute', bottom: '40px' }}>
        <div style={rockStyle('45px', '70px', '#7f8c8d', 'polygon(0 0, 100% 20%, 80% 100%, 20% 80%)', 1)} />
        <div style={rockStyle('45px', '70px', '#7f8c8d', 'polygon(100% 0, 0 20%, 20% 100%, 80% 80%)', 1.2)} />
      </div>
      {/* Legs */}
      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={rockStyle('35px', '40px', '#34495e', 'polygon(0 0, 100% 0, 80% 100%, 20% 100%)', 0)} />
        <div style={rockStyle('35px', '40px', '#34495e', 'polygon(0 0, 100% 0, 80% 100%, 20% 100%)', 0)} />
      </div>
    </div>
  );
}

// ─── FIRE DRAGON ───
function FireDragon({ animationState = 'idle', flip = false }) {
  const BodyPart = ({ width, height, color, clip, top, left, z, delay = 0, children }) => (
    <div style={{
      position: 'absolute', width, height, top, left, zIndex: z,
      backgroundColor: color, clipPath: clip,
      border: '2px solid #3d0a0a',
      boxShadow: 'inset -6px -4px 0px rgba(0,0,0,0.4), inset 4px 4px 0px rgba(255,255,255,0.2)',
      animation: `fireDragonIdle 2s ease-in-out infinite alternate ${delay}s`,
    }}>{children}</div>
  );
  return (
    <div style={{ position: 'relative', width: '180px', height: '140px', imageRendering: 'pixelated', filter: 'drop-shadow(8px 8px 0px rgba(0,0,0,0.3))', transform: flip ? 'scaleX(-1)' : 'none' }}>
      <style>{`
        @keyframes fireDragonIdle { from { transform: translateY(0px) rotate(0deg); } to { transform: translateY(-5px) rotate(2deg); } }
        @keyframes fireSmoke { 0% { transform: translate(0,0) scale(1); opacity: 0; } 50% { opacity: 0.6; } 100% { transform: translate(-20px,-40px) scale(2); opacity: 0; } }
      `}</style>
      {/* Smoke */}
      <div style={{ position: 'absolute', top: '20%', left: '15%', width: '4px', height: '4px', backgroundColor: '#555', borderRadius: '50%', animation: 'fireSmoke 2s infinite' }} />
      <div style={{ position: 'absolute', top: '22%', left: '12%', width: '3px', height: '3px', backgroundColor: '#888', borderRadius: '50%', animation: 'fireSmoke 2s infinite 0.5s' }} />
      {/* Tail */}
      <BodyPart width="60px" height="30px" color="#c0392b" clip="polygon(0 50%, 100% 0, 80% 100%)" top="60%" left="60%" z={1} delay={0.2} />
      {/* Back wing */}
      <BodyPart width="80px" height="90px" color="#2c3e50" clip="polygon(100% 0, 0 40%, 100% 100%, 80% 50%)" top="0" left="40%" z={0} delay={0.4} />
      {/* Body */}
      <BodyPart width="90px" height="60px" color="#e67e22" clip="polygon(20% 0, 100% 20%, 80% 100%, 0 80%)" top="40%" left="20%" z={2} />
      {/* Head */}
      <BodyPart width="50px" height="40px" color="#e67e22" clip="polygon(0 20%, 80% 0, 100% 40%, 90% 100%, 0 80%)" top="10%" left="5%" z={3} delay={0.1}>
        <div style={{ position: 'absolute', top: '35%', left: '60%', width: '5px', height: '5px', backgroundColor: '#f1c40f', boxShadow: '0 0 8px #f39c12' }} />
      </BodyPart>
      {/* Front wing */}
      <BodyPart width="70px" height="80px" color="#e74c3c" clip="polygon(100% 0, 0 30%, 100% 100%, 70% 40%)" top="10%" left="30%" z={4} delay={0.5} />
    </div>
  );
}

// Map enemy/boss names to custom sprite components
const ENEMY_SPRITES = {
  'Gorvath the Stone Golem': StoneGolem,
  'Stone Drake': StoneDrake,
  'Venom Wyvern': VenomWyvern,
  'Shadow Specter': ShadowSpecter,
  'Solar Drake': SolarDrake,
  'Lunar Serpent': LunarSerpent,
};

// ─── STORM DRAGON ───
function StormDragon({ animationState = 'idle', flip = false }) {
  // Fixed bolt positions — avoids Math.random() recalculating on every render
  const bolts = [
    { top: '8%',  left: '60%', delay: 0 },
    { top: '42%', left: '12%', delay: 0.7 },
    { top: '20%', left: '75%', delay: 1.4 },
  ];
  const BodyPart = ({ width, height, color, clip, top, left, z, delay = 0, speed = '1.5s', children }) => (
    <div style={{
      position: 'absolute', width, height, top, left, zIndex: z,
      backgroundColor: color, clipPath: clip,
      border: '2px solid #2d1a47',
      boxShadow: 'inset -4px -4px 0px rgba(0,0,0,0.3), inset 4px 4px 0px rgba(255,255,255,0.4)',
      animation: `stormJitter ${speed} ease-in-out infinite alternate ${delay}s`,
    }}>{children}</div>
  );
  return (
    <div style={{ position: 'relative', width: '160px', height: '160px', imageRendering: 'pixelated', filter: 'drop-shadow(8px 8px 0px rgba(0,0,0,0.3))', transform: flip ? 'scaleX(-1)' : 'none' }}>
      <style>{`
        @keyframes stormJitter { 0% { transform: translate(0,0) scale(1); } 50% { transform: translate(2px,-2px) scale(1.02); } 100% { transform: translate(-1px,1px) scale(1); } }
        @keyframes boltFlicker { 0%, 90%, 100% { opacity: 0; } 92%, 98% { opacity: 1; transform: scale(1.2); } }
      `}</style>
      {/* Lightning bolt aura */}
      {bolts.map((b, i) => (
        <div key={i} style={{ position: 'absolute', top: b.top, left: b.left, width: '20px', height: '40px', backgroundColor: '#fff', clipPath: 'polygon(40% 0%, 100% 40%, 60% 40%, 80% 100%, 0% 50%, 40% 50%)', animation: `boltFlicker 2s infinite ${b.delay}s`, zIndex: 10, boxShadow: '0 0 10px #00ffff' }} />
      ))}
      {/* Back wing */}
      <BodyPart width="100px" height="60px" color="#5e35b1" clip="polygon(0 0, 100% 20%, 70% 100%, 20% 80%)" top="10%" left="40%" z={1} delay={0.2} />
      {/* Body */}
      <BodyPart width="80px" height="70px" color="#7b1fa2" clip="polygon(20% 0, 80% 0, 100% 100%, 0 100%)" top="40%" left="25%" z={2} />
      {/* Head */}
      <BodyPart width="40px" height="60px" color="#9c27b0" clip="polygon(30% 0, 70% 0, 100% 100%, 0 100%)" top="10%" left="15%" z={3} delay={0.1} speed="1s">
        <div style={{ position: 'absolute', top: '20%', left: '40%', width: '6px', height: '6px', backgroundColor: '#00ffff', boxShadow: '0 0 8px #00ffff' }} />
      </BodyPart>
      {/* Front wing */}
      <BodyPart width="90px" height="50px" color="#8e24aa" clip="polygon(0 20%, 100% 0, 80% 100%, 10% 80%)" top="30%" left="35%" z={4} delay={0.4} />
    </div>
  );
}

// Map element names to CSS dragon sprite components
const DRAGON_COMPONENTS = {
  fire: FireDragon,
  lightning: StormDragon,
};

// ─── SYNERGY DETECTION ───
const getSynergy = (cardA, cardB) => {
  const types = [cardA.fx || cardA.type, cardB.fx || cardB.type].sort();
  if (types[0] === 'fire' && types[1] === 'nature') return 'TOXIC_CLOUD';
  if (types[0] === 'ice' && types[1] === 'lightning') return 'SUPERCONDUCTOR';
  return null;
};

// ─── TOXIC CLOUD EFFECT ───
function ToxicCloudEffect() {
  // Fixed positions — avoids Math.random() on re-render
  const blobs = [
    { left: '10%', top: '22%' }, { left: '25%', top: '45%' }, { left: '40%', top: '30%' },
    { left: '55%', top: '55%' }, { left: '70%', top: '25%' }, { left: '82%', top: '48%' },
  ];
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 600,
      backgroundColor: 'rgba(74, 20, 140, 0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', pointerEvents: 'none'
    }}>
      <style>{`
        @keyframes gasExpand {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.5); opacity: 0.8; }
          100% { transform: scale(3); opacity: 0; }
        }
      `}</style>
      {blobs.map((b, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: '200px', height: '200px',
          backgroundColor: i % 2 === 0 ? '#76ff03' : '#9c27b0',
          borderRadius: '50%', filter: 'blur(20px)',
          left: b.left, top: b.top,
          animation: `gasExpand 1.5s ease-out forwards ${i * 0.1}s`
        }} />
      ))}
      <div style={{ fontFamily: '"Courier New", monospace', fontSize: '40px', color: '#76ff03', textShadow: '4px 4px #000', fontWeight: 'bold', zIndex: 10 }}>
        TOXIC CLOUD!
      </div>
    </div>
  );
}

// ─── SUPERCONDUCTOR EFFECT ───
function SuperconductorEffect() {
  // Fixed delay/rotation arrays — avoids Math.random() on re-render
  const arcs = [
    { delay: 0,    rot: 12  }, { delay: 0.10, rot: 85  }, { delay: 0.15, rot: 157 },
    { delay: 0.05, rot: 203 }, { delay: 0.20, rot: 299 }, { delay: 0.12, rot: 40  },
    { delay: 0.08, rot: 120 }, { delay: 0.18, rot: 250 }, { delay: 0.03, rot: 330 }, { delay: 0.22, rot: 60 },
  ];
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 600,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none'
    }}>
      <style>{`
        @keyframes lightningArc {
          0% { opacity: 0; transform: skewX(20deg); }
          10% { opacity: 1; transform: skewX(-20deg); }
          20% { opacity: 0; }
          100% { opacity: 0; }
        }
      `}</style>
      {arcs.map((a, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: '4px', height: '100%',
          backgroundColor: '#00ffff',
          left: `${i * 10}%`,
          boxShadow: '0 0 15px #fff',
          animation: `lightningArc 0.3s infinite ${a.delay}s`,
          transform: `rotate(${a.rot}deg)`
        }} />
      ))}
      <div style={{ fontFamily: '"Courier New", monospace', fontSize: '40px', color: '#fff', textShadow: '0 0 20px #00ffff', fontWeight: 'bold', zIndex: 10 }}>
        SUPERCONDUCTOR!
      </div>
    </div>
  );
}

// ─── TURN BANNER ───
function TurnBanner({ activeTurn }) {
  const isPlayer = activeTurn === 'player';
  return (
    <div style={{ position: 'absolute', top: '38%', left: 0, width: '100%', height: '52px', backgroundColor: isPlayer ? '#f1c40f' : '#4a148c', borderTop: '4px solid #fff', borderBottom: '4px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, boxShadow: '0 10px 0 rgba(0,0,0,0.4)', transformOrigin: 'left', animation: 'ribbonSlide 1.2s cubic-bezier(0.18,0.89,0.32,1.28) forwards', imageRendering: 'pixelated' }}>
      <style>{`@keyframes ribbonSlide { 0% { transform: scaleX(0); opacity: 0; } 15% { transform: scaleX(1); opacity: 1; } 85% { transform: scaleX(1); opacity: 1; } 100% { transform: scaleX(0); opacity: 0; } }`}</style>
      <div style={{ fontFamily: '"Courier New",monospace', fontSize: 22, fontWeight: 'bold', color: isPlayer ? '#000' : '#fff', textTransform: 'uppercase', letterSpacing: 4, textShadow: isPlayer ? 'none' : '2px 2px #000' }}>
        {isPlayer ? '▶ PLAYER TURN' : '▶ ENEMY TURN'}
      </div>
    </div>
  );
}

// ─── HIT SPARK ───
function HitSpark({ x, y }) {
  return (
    <div style={{ position: 'absolute', top: y, left: x, width: '40px', height: '40px', backgroundColor: '#fff', clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)', animation: 'sparkPop 0.2s forwards steps(2)', zIndex: 50, pointerEvents: 'none' }}>
      <style>{`@keyframes sparkPop { 0% { transform: scale(0.5) rotate(0deg); opacity: 1; } 100% { transform: scale(1.5) rotate(45deg); opacity: 0; } }`}</style>
    </div>
  );
}

// ─── CARD SHOP ───
function CardShop({ playerGold, shopItems, inventory, onBuy, dragonLevel }) {
  const [selectedIndex, useState_sel] = useState(0);
  const item = shopItems[selectedIndex];
  const owned = inventory.includes(item.name);
  const canBuy = playerGold >= item.cost && dragonLevel >= item.req && !owned;
  const fxMap = { attack: 'fire', defense: 'buff', speed: 'lightning', maxHp: 'heal', maxMana: 'ice' };
  return (
    <div style={{ width: '100%', backgroundColor: '#3d2314', border: '6px solid #5d3a1a', padding: 14, display: 'flex', flexDirection: 'column', fontFamily: '"Courier New",monospace', color: '#f1c40f', boxShadow: '0 16px 0 rgba(0,0,0,0.5)', imageRendering: 'pixelated' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '3px solid #5d3a1a', paddingBottom: 8, marginBottom: 12, fontSize: 16, fontWeight: 'bold' }}>
        <span>🐉 DRAGON SHOP</span><span style={{ color: '#fff' }}>💰 {playerGold}g</span>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        {/* Item list */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {shopItems.map((it, i) => {
            const own = inventory.includes(it.name);
            return (
              <div key={it.name} onClick={() => useState_sel(i)} style={{ padding: '7px 10px', backgroundColor: selectedIndex === i ? '#5d3a1a' : 'transparent', border: selectedIndex === i ? '2px solid #f1c40f' : '2px solid transparent', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', fontSize: 10, color: own ? '#44dd66' : '#f1c40f' }}>
                <span>{it.name}</span><span>{own ? '✓' : `${it.cost}g`}</span>
              </div>
            );
          })}
        </div>
        {/* Preview */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', padding: 8 }}>
          <div style={{ transform: 'scale(0.75)', transformOrigin: 'top center', marginBottom: -30 }}>
            {(() => { const A = CARD_ARTWORK[fxMap[item.stat] || 'fire']; return (
              <CardFrame name={item.name} description={`${item.desc} · Req Lv.${item.req}`} rarity={item.cost >= 200 ? 'legendary' : item.cost >= 100 ? 'rare' : 'common'} owned={owned}>
                {A ? <A /> : <span style={{ fontSize: 28 }}>{item.icon}</span>}
              </CardFrame>
            ); })()}
          </div>
          <button onClick={() => canBuy && onBuy(item)} disabled={!canBuy} style={{ marginTop: 'auto', width: '100%', padding: '8px', backgroundColor: owned ? '#555' : canBuy ? '#2ecc71' : '#7f8c8d', color: '#fff', border: 'none', fontWeight: 'bold', cursor: canBuy ? 'pointer' : 'default', fontFamily: '"Courier New",monospace', fontSize: 11 }}>
            {owned ? 'OWNED' : canBuy ? 'BUY' : playerGold < item.cost ? 'NEED GOLD' : `REQ LV.${item.req}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── WORLD MAP ───
function WorldMap({ onSelectLocation, completedLocations = [] }) {
  const locations = [
    { id: 'fire',      name: 'Cinder Volcano',  x: '18%', y: '28%', color: '#e74c3c', arena: 'Volcanic Crater' },
    { id: 'ice',       name: 'Frost Cavern',     x: '68%', y: '18%', color: '#3498db', arena: 'Frozen Tundra' },
    { id: 'lightning', name: 'Lightning Peaks',  x: '48%', y: '68%', color: '#9b59b6', arena: 'Storm Peaks' },
    { id: 'nature',    name: 'Ancient Grove',    x: '75%', y: '55%', color: '#27ae60', arena: 'Ancient Forest' },
    { id: 'shadow',    name: 'Shadow Realm',     x: '28%', y: '62%', color: '#8e44ad', arena: 'Shadow Realm' },
    { id: 'mountain',  name: 'Mountain Peak',    x: '52%', y: '30%', color: '#95a5a6', arena: 'Mountain Peak' },
  ];
  return (
    <div style={{ position: 'relative', width: '100%', height: 220, backgroundColor: '#d3bc8d', backgroundImage: 'radial-gradient(#c2a878 1px, transparent 1px)', backgroundSize: '16px 16px', border: '8px solid #5d3a1a', imageRendering: 'pixelated', overflow: 'hidden', boxShadow: '0 16px 0 rgba(0,0,0,0.4)' }}>
      <style>{`@keyframes pulseNode { from { transform: scale(1); box-shadow: 0 0 0px #fff; } to { transform: scale(1.2); box-shadow: 0 0 12px #fff; } }`}</style>
      <div style={{ padding: '6px 10px', fontFamily: '"Courier New",monospace', fontWeight: 'bold', fontSize: 10, color: '#3d2314' }}>SELECT DESTINATION</div>
      {locations.map(loc => {
        const done = completedLocations.includes(loc.id);
        return (
          <div key={loc.id} style={{ position: 'absolute', left: loc.x, top: loc.y, textAlign: 'center' }}>
            <div onClick={() => onSelectLocation(loc)} style={{ width: 20, height: 20, backgroundColor: done ? '#44dd66' : loc.color, border: '3px solid #fff', borderRadius: '50%', cursor: 'pointer', animation: done ? 'none' : 'pulseNode 1s infinite alternate', margin: '0 auto' }} />
            <div style={{ marginTop: 3, fontSize: 8, color: '#3d2314', fontWeight: 'bold', textShadow: '1px 1px #fff', whiteSpace: 'nowrap' }}>{loc.name}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── LEVEL UP SCREEN ───
function LevelUpScreen({ dragon, onConfirm }) {
  const [atk, setAtk] = useState(dragon.attack);
  const [hp, setHp] = useState(dragon.maxHp);
  const [def, setDef] = useState(dragon.defense);
  const [points, setPoints] = useState(5);
  const StatBar = ({ label, value, max, color, onAdd }) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
        <span>{label}</span><span>{value}</span>
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <div style={{ flex: 1, height: 10, backgroundColor: '#000', border: '2px solid #fff' }}>
          <div style={{ width: `${Math.min(100, (value / max) * 100)}%`, height: '100%', backgroundColor: color, transition: 'width 0.4s steps(10)' }} />
        </div>
        <button onClick={onAdd} disabled={points === 0} style={{ fontSize: 10, padding: '2px 6px', cursor: points > 0 ? 'pointer' : 'default' }}>+</button>
      </div>
    </div>
  );
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,128,0.92)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '85%', padding: 20, backgroundColor: '#000080', color: '#fff', border: '5px double #fff', fontFamily: '"Courier New",monospace' }}>
        <div style={{ fontSize: 18, textAlign: 'center', marginBottom: 14, color: '#f1c40f' }}>⬆ LEVEL UP!</div>
        <div style={{ fontSize: 11, color: '#f1c40f', marginBottom: 12 }}>POINTS: {points}</div>
        <StatBar label="ATTACK" value={atk} max={50} color="#e74c3c" onAdd={() => { if (points > 0) { setAtk(a => a + 1); setPoints(p => p - 1); }}} />
        <StatBar label="MAX HP"  value={hp}  max={300} color="#2ecc71" onAdd={() => { if (points > 0) { setHp(h => h + 5);  setPoints(p => p - 1); }}} />
        <StatBar label="DEFENSE" value={def} max={50}  color="#3498db" onAdd={() => { if (points > 0) { setDef(d => d + 1); setPoints(p => p - 1); }}} />
        <button disabled={points > 0} onClick={() => onConfirm({ attack: atk, maxHp: hp, defense: def })} style={{ marginTop: 14, width: '100%', padding: 10, background: points === 0 ? '#f1c40f' : '#555', color: points === 0 ? '#000' : '#aaa', border: 'none', fontWeight: 'bold', cursor: points === 0 ? 'pointer' : 'default', fontFamily: '"Courier New",monospace', fontSize: 12 }}>
          {points === 0 ? 'CONFIRM GROWTH' : `USE ALL ${points} POINTS`}
        </button>
      </div>
    </div>
  );
}

// ─── DEFEAT SCREEN ───
function DefeatScreen({ onRetry, onMenu }) {
  const btnStyle = { background: 'none', border: '3px solid #fff', color: '#fff', padding: '10px 20px', fontFamily: '"Courier New",monospace', fontSize: 15, cursor: 'pointer', marginBottom: 8, width: 180, boxShadow: '4px 4px 0px #000' };
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,20,0.75)', backdropFilter: 'grayscale(80%) brightness(0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1000, imageRendering: 'pixelated' }}>
      <style>{`@keyframes bloodDrip { 0% { transform: translateY(-50px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }`}</style>
      <div style={{ fontFamily: '"Courier New",monospace', fontSize: 48, fontWeight: 'bold', color: '#c0392b', textShadow: '4px 4px 0px #000', marginBottom: 36, animation: 'bloodDrip 2s ease-in-out forwards' }}>GAME OVER</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button style={btnStyle} onClick={onRetry}>▶ TRY AGAIN</button>
        <button style={btnStyle} onClick={onMenu}>▶ MAIN MENU</button>
      </div>
    </div>
  );
}

// ─── VICTORY BANNER ───
function VictoryBanner() {
  return (
    <div style={{
      position: 'absolute', top: '18%', left: '50%',
      transform: 'translate(-50%, -50%) skew(-10deg)',
      width: '90%', maxWidth: '500px', height: '56px',
      backgroundColor: '#000', border: '4px solid #fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200, overflow: 'hidden',
      boxShadow: '0px 10px 0px rgba(0,0,0,0.4)', imageRendering: 'pixelated',
    }}>
      <style>{`@keyframes victoryFlash { 0% { color: #f1c40f; filter: brightness(1); } 50% { color: #fff; filter: brightness(1.5); } 100% { color: #f1c40f; filter: brightness(1); } }`}</style>
      <div style={{ fontFamily: '"Courier New", Courier, monospace', fontSize: '36px', fontWeight: 'bold', textTransform: 'uppercase', color: '#f1c40f', textShadow: '3px 3px 0px #c0392b, 6px 6px 0px #000', animation: 'victoryFlash 0.5s infinite' }}>
        VICTORY!
      </div>
    </div>
  );
}

// ─── PIXEL CHEST ───
function PixelChest({ onOpenComplete }) {
  const [isOpen, setIsOpen] = useState(false);
  const partStyle = (color, clip, top) => ({
    position: 'absolute', width: '100%', height: '50%', top, left: 0,
    backgroundColor: color, clipPath: clip,
    border: '3px solid #3d2314',
    boxShadow: 'inset -4px -4px 0px rgba(0,0,0,0.3), inset 4px 4px 0px rgba(255,255,255,0.1)',
    transition: 'transform 0.2s steps(2)',
  });
  const handleOpen = () => {
    if (!isOpen) { setIsOpen(true); if (onOpenComplete) onOpenComplete(); }
  };
  return (
    <div onClick={handleOpen} style={{ position: 'relative', width: '100px', height: '80px', cursor: isOpen ? 'default' : 'pointer', imageRendering: 'pixelated' }}>
      <style>{`@keyframes chestGlow { 0% { opacity: 0.2; transform: scale(0.8); } 100% { opacity: 1; transform: scale(1.2); } }`}</style>
      {/* Glow */}
      <div style={{ position: 'absolute', top: '10%', left: '10%', width: '80%', height: '60%', background: 'radial-gradient(circle, #f1c40f 0%, transparent 70%)', opacity: isOpen ? 1 : 0, filter: 'blur(4px)', animation: isOpen ? 'chestGlow 1s infinite alternate' : 'none', zIndex: 1 }} />
      {/* Body */}
      <div style={{ ...partStyle('#8e44ad', 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', '50%'), zIndex: 0, borderTop: 'none' }}>
        <div style={{ width: '20px', height: '20px', backgroundColor: '#f39c12', border: '2px solid #3d2314', margin: '-5px auto', clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
      </div>
      {/* Lid */}
      <div style={{ ...partStyle('#8e44ad', 'polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)', '0%'), transform: isOpen ? 'translateY(-30px) scaleY(0.6)' : 'translateY(0)', zIndex: 2 }}>
        <div style={{ width: '30%', height: '6px', backgroundColor: '#f39c12', margin: '10px auto', clipPath: 'polygon(0% 0%, 100% 0%, 90% 100%, 10% 100%)' }} />
      </div>
    </div>
  );
}

// ─── VICTORY SCREEN ───
function VictoryScreen({ enemy, earnedGold, earnedXp, onContinue }) {
  const [rewardLevel, setRewardLevel] = useState(0);
  const rewards = [
    { label: `${earnedXp} XP`, color: '#ffee44' },
    { label: `${earnedGold} Gold`, color: '#f1c40f' },
    ...(enemy?.isBoss ? [{ label: 'Boss Slain! 💀', color: '#ff8844' }] : []),
  ];
  const handleChestOpen = () => {
    rewards.forEach((_, i) => setTimeout(() => setRewardLevel(i + 1), 500 + i * 500));
  };
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 150, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
      <VictoryBanner />
      <div style={{ display: 'flex', alignItems: 'center', gap: 40, marginTop: 50 }}>
        <PixelChest onOpenComplete={handleChestOpen} />
        <div style={{ fontFamily: '"Courier New", Courier, monospace', fontSize: 16, lineHeight: 1.8 }}>
          {rewards.slice(0, rewardLevel).map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: 10 }}>
              <span style={{ color: '#f1c40f' }}>+</span>
              <span style={{ color: r.color }}>{r.label}</span>
            </div>
          ))}
        </div>
      </div>
      <button onClick={onContinue} style={{ position: 'absolute', bottom: 28, padding: '8px 28px', background: '#e74c3c', color: '#fff', fontFamily: '"Courier New", Courier, monospace', fontSize: 14, border: '3px solid #fff', cursor: 'pointer' }}>
        CONTINUE
      </button>
    </div>
  );
}

// ─── GLACIAL CAVERN AURA ───
function GlacialCavernAura({ children }) {
  const snowflakes = [
    { delay: 0,   left: '5%',  size: 3, speed: 4 }, { delay: 0.3, left: '12%', size: 2, speed: 5 },
    { delay: 0.6, left: '22%', size: 4, speed: 3 }, { delay: 0.9, left: '33%', size: 2, speed: 6 },
    { delay: 1.2, left: '44%', size: 3, speed: 4 }, { delay: 1.5, left: '55%', size: 4, speed: 5 },
    { delay: 1.8, left: '64%', size: 2, speed: 3 }, { delay: 2.1, left: '73%', size: 3, speed: 4 },
    { delay: 2.4, left: '82%', size: 4, speed: 5 }, { delay: 2.7, left: '91%', size: 2, speed: 6 },
    { delay: 0.5, left: '18%', size: 3, speed: 4 }, { delay: 1.0, left: '38%', size: 2, speed: 5 },
    { delay: 1.5, left: '58%', size: 4, speed: 3 }, { delay: 2.0, left: '78%', size: 3, speed: 4 },
    { delay: 2.5, left: '96%', size: 2, speed: 5 },
  ];
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', backgroundColor: '#050a14' }}>
      <style>{`
        @keyframes fallSnow { 0% { transform: translateY(0) translateX(0); opacity: 0; } 20% { opacity: 1; } 100% { transform: translateY(450px) translateX(20px); opacity: 0; } }
        @keyframes frostPulse { 0% { opacity: 0.4; transform: scale(1); } 100% { opacity: 0.7; transform: scale(1.02); } }
      `}</style>
      {/* Frost vignette */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, transparent 50%, rgba(163,216,244,0.4) 100%)', zIndex: 10, pointerEvents: 'none', animation: 'frostPulse 5s ease-in-out infinite alternate' }} />
      {/* Snowflakes */}
      {snowflakes.map((s, i) => (
        <div key={i} style={{ position: 'absolute', top: '-20px', left: s.left, width: s.size, height: s.size, backgroundColor: '#fff', boxShadow: '0 0 2px #fff', opacity: 0.8, zIndex: 5, animation: `fallSnow ${s.speed}s linear infinite ${s.delay}s` }} />
      ))}
      {children}
    </div>
  );
}

// ─── FIRE CRATER AURA ───
function FireCraterAura({ children }) {
  // Fixed ember positions — avoids Math.random() recalculating on re-render
  const embers = [
    { delay: 0,   left: '8%',  size: 4 }, { delay: 0.4, left: '20%', size: 3 },
    { delay: 0.8, left: '35%', size: 5 }, { delay: 1.2, left: '50%', size: 2 },
    { delay: 1.6, left: '62%', size: 4 }, { delay: 2.0, left: '75%', size: 3 },
    { delay: 2.4, left: '85%', size: 5 }, { delay: 0.2, left: '14%', size: 3 },
    { delay: 0.6, left: '44%', size: 2 }, { delay: 1.0, left: '92%', size: 4 },
  ];
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', backgroundColor: '#1a0505' }}>
      <style>{`
        @keyframes riseEmber { 0% { transform: translateY(0) rotate(0deg); opacity: 0; } 20% { opacity: 1; } 100% { transform: translateY(-400px) rotate(360deg); opacity: 0; } }
        @keyframes heatWave  { 0% { opacity: 0.3; transform: scale(1); } 100% { opacity: 0.5; transform: scale(1.05); } }
      `}</style>
      {/* Heat haze overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(231,76,60,0.15) 0%, transparent 100%)', zIndex: 4, pointerEvents: 'none', animation: 'heatWave 4s ease-in-out infinite alternate' }} />
      {/* Embers */}
      {embers.map((e, i) => (
        <div key={i} style={{ position: 'absolute', bottom: '-20px', left: e.left, width: e.size, height: e.size, backgroundColor: i % 2 === 0 ? '#f39c12' : '#e67e22', boxShadow: '0 0 4px #f1c40f', opacity: 0.8, zIndex: 5, animation: `riseEmber 3s linear infinite ${e.delay}s` }} />
      ))}
      {children}
    </div>
  );
}

// ─── BATTLE BACKGROUND: MOUNTAIN PEAKS ───
function BattleBackground() {
  const peakStyle = (color, height, bottom, z) => ({
    position: 'absolute',
    bottom: bottom,
    width: '100%',
    height: height,
    backgroundColor: color,
    clipPath: 'polygon(0% 100%, 15% 40%, 30% 80%, 45% 20%, 60% 70%, 75% 10%, 90% 60%, 100% 100%)',
    zIndex: z,
  });

  return (
    <div style={{ position: 'absolute', inset: 0, backgroundColor: '#08081a', overflow: 'hidden', imageRendering: 'pixelated' }}>
      {/* Stars */}
      <div style={{ position: 'absolute', top: '10%', left: '15%', width: '2px', height: '2px', backgroundColor: '#fff', boxShadow: '50px 20px #fff, 120px 40px #fff, 200px 10px #fff' }} />
      {/* Distant peaks */}
      <div style={peakStyle('#1e2a4a', '60%', '0', 1)} />
      {/* Midground peaks */}
      <div style={peakStyle('#2d4c8c', '40%', '0', 2)} />
      {/* Icy floor */}
      <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '25%', backgroundColor: '#a3d8f4', borderTop: '4px solid #fff', zIndex: 3 }} />
    </div>
  );
}

// ─── DRAGON SPRITE SHEET ───
function DragonSpriteSheet({ element, currentAnimation = 'idle', fps = 8, flip = false }) {
  const [frameIndex, setFrameIndex] = useState(0);
  const intervalRef = useRef(null);
  const sheetPath = SPRITE_SHEETS[element];
  const animation = ANIMATION_DATA[currentAnimation] || ANIMATION_DATA.idle;

  useEffect(() => {
    setFrameIndex(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setFrameIndex(prev => prev + 1 < animation.length ? prev + 1 : animation.isLooping ? 0 : prev);
    }, 1000 / fps);
    return () => clearInterval(intervalRef.current);
  }, [currentAnimation, animation.length, animation.isLooping, fps]);

  if (!sheetPath) return null;

  const posX = -(frameIndex * SPRITE_SIZE.width) * SCALE;
  const posY = -(animation.row * SPRITE_SIZE.height) * SCALE;

  return (
    <div style={{
      display: 'block',
      imageRendering: 'pixelated',
      width: `${SPRITE_SIZE.width * SCALE}px`,
      height: `${SPRITE_SIZE.height * SCALE}px`,
      backgroundImage: `url('${sheetPath}')`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: `${posX}px ${posY}px`,
      backgroundSize: `${SPRITE_SIZE.width * 4 * SCALE}px ${SPRITE_SIZE.height * 4 * SCALE}px`,
      transform: flip ? 'scaleX(-1)' : 'none',
    }} />
  );
}

// ─── LUNAR SERPENT ───
function LunarSerpent() {
  return (
    <div style={{ position: 'relative', width: '180px', height: '140px', imageRendering: 'pixelated' }}>
      <style>{`
        @keyframes serpentSlide { 0% { transform: translateX(0) skewX(0deg); } 100% { transform: translateX(10px) skewX(5deg); } }
        @keyframes moonGlow { from { filter: drop-shadow(0 0 2px #90caf9); } to { filter: drop-shadow(0 0 10px #90caf9); } }
      `}</style>
      {/* Crescent Tail */}
      <div style={{ position: 'absolute', width: '80px', height: '80px', backgroundColor: '#1a237e', clipPath: 'polygon(100% 0, 0% 0, 50% 100%)', top: '40%', left: '45%', opacity: 0.8, borderLeft: '4px solid #90caf9', animation: 'serpentSlide 2.5s infinite alternate' }} />
      {/* Body */}
      <div style={{ position: 'absolute', width: '120px', height: '40px', backgroundColor: '#0d47a1', clipPath: 'polygon(0 50%, 20% 0, 80% 0, 100% 50%, 80% 100%, 20% 100%)', top: '50%', left: '10%', border: '3px solid #1a237e', boxShadow: 'inset 0 10px 0 rgba(255,255,255,0.1)', animation: 'moonGlow 2s infinite alternate' }} />
      {/* Head */}
      <div style={{ position: 'absolute', width: '50px', height: '30px', backgroundColor: '#1565c0', clipPath: 'polygon(0 30%, 80% 0, 100% 50%, 80% 100%, 0 70%)', top: '45%', left: '5%', border: '2px solid #90caf9' }}>
        <div style={{ position: 'absolute', top: '40%', left: '70%', width: '8px', height: '2px', backgroundColor: '#fff' }} />
      </div>
    </div>
  );
}

// ─── SOLAR DRAKE ───
function SolarDrake() {
  return (
    <div style={{ position: 'relative', width: '170px', height: '150px', imageRendering: 'pixelated' }}>
      <style>{`
        @keyframes haloPulse { 0% { transform: scale(1); opacity: 0.4; } 100% { transform: scale(1.3); opacity: 0.8; } }
        @keyframes wingSweep { from { transform: rotate(-10deg); } to { transform: rotate(10deg); } }
      `}</style>
      {/* Halo */}
      <div style={{ position: 'absolute', top: '5%', left: '15%', width: '60px', height: '20px', backgroundColor: 'transparent', border: '4px solid #fff59d', borderRadius: '50%', boxShadow: '0 0 15px #fff59d', animation: 'haloPulse 2s infinite alternate' }} />
      {/* Wings */}
      <div style={{ position: 'absolute', width: '140px', height: '70px', backgroundColor: '#fff', clipPath: 'polygon(0 40%, 50% 0, 100% 40%, 80% 100%, 20% 100%)', top: '25%', left: '15%', border: '2px solid #fbc02d', animation: 'wingSweep 3s ease-in-out infinite alternate' }} />
      {/* Body */}
      <div style={{ position: 'absolute', width: '70px', height: '90px', backgroundColor: '#fafafa', clipPath: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)', top: '30%', left: '30%', border: '3px solid #fbc02d', boxShadow: 'inset -5px -5px 0 #e0e0e0' }} />
      {/* Head */}
      <div style={{ position: 'absolute', width: '35px', height: '45px', backgroundColor: '#fff', clipPath: 'polygon(20% 0, 80% 0, 100% 100%, 0 100%)', top: '15%', left: '45%', border: '2px solid #fbc02d' }}>
        <div style={{ position: 'absolute', top: '25%', left: '40%', width: '5px', height: '5px', backgroundColor: '#4fc3f7' }} />
      </div>
    </div>
  );
}

// ─── ALCHEMY CAULDRON ───
function AlchemyCauldron({ ingredients, onCraft }) {
  const [selected, setSelected] = useState([]);
  const toggle = (ing) => setSelected(prev =>
    prev.includes(ing) ? prev.filter(x => x !== ing) : [...prev, ing]
  );
  const craftSnack = () => {
    if (selected.includes('Fire Crystal') && selected.includes('Sweet Herb')) {
      onCraft({ name: 'Spicy Jerky', boost: { attack: 5 }, color: '#e67e22' });
    } else if (selected.includes('Ice Shard') && selected.includes('Storm Dust')) {
      onCraft({ name: 'Frost Surge', boost: { maxMana: 10 }, color: '#00cfff' });
    }
    setSelected([]);
  };
  return (
    <div style={{ padding: '16px', backgroundColor: '#2d1a47', border: '4px solid #fff', color: '#fff', fontFamily: '"Courier New", monospace', imageRendering: 'pixelated' }}>
      <div style={{ textAlign: 'center', fontSize: '14px', marginBottom: '12px', fontWeight: 'bold' }}>🧪 DRAGON ALCHEMY</div>
      <div style={{ width: '80px', height: '64px', backgroundColor: '#000', margin: '0 auto 14px', borderRadius: '0 0 32px 32px', border: '3px solid #fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-8px', left: '20%', width: '8px', height: '8px', backgroundColor: '#9c27b0', borderRadius: '50%', animation: 'floatBubble 1s infinite' }} />
        <div style={{ position: 'absolute', top: '-6px', left: '55%', width: '6px', height: '6px', backgroundColor: '#76ff03', borderRadius: '50%', animation: 'floatBubble 1.3s infinite 0.4s' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginBottom: '10px' }}>
        {ingredients.map(ing => (
          <button key={ing} onClick={() => toggle(ing)} style={{
            fontSize: '9px', padding: '5px', cursor: 'pointer', border: '2px solid #fff',
            background: selected.includes(ing) ? '#f1c40f' : '#4a148c', color: '#fff', fontFamily: '"Courier New",monospace'
          }}>{ing}</button>
        ))}
      </div>
      <button onClick={craftSnack} disabled={selected.length < 2} style={{ width: '100%', padding: '8px', background: selected.length >= 2 ? '#2ecc71' : '#555', color: '#fff', border: 'none', cursor: selected.length >= 2 ? 'pointer' : 'default', fontFamily: '"Courier New",monospace', fontWeight: 'bold', fontSize: 11 }}>
        MIX INGREDIENTS
      </button>
    </div>
  );
}

// ─── CRT SCANLINE OVERLAY ───
function CRTOverlay() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none',
      background: `linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.1) 50%), linear-gradient(90deg, rgba(255,0,0,0.03), rgba(0,255,0,0.01), rgba(0,0,255,0.03))`,
      backgroundSize: '100% 3px, 3px 100%',
      opacity: 0.6, animation: 'crtFlicker 0.15s infinite'
    }}>
      <style>{`@keyframes crtFlicker { 0% { opacity: 0.55; } 50% { opacity: 0.6; } 100% { opacity: 0.58; } }`}</style>
    </div>
  );
}

// ─── DAMAGE FORMULA ───
// Extended damage calc for future use — accepts attacker/defender stat objects and a card
const calculateDamage = (attacker, defender, card) => {
  let power = (attacker.atk * 1.5) - (defender.def * 0.5);
  const multipliers = {
    'fire_vs_ice': 2.0, 'ice_vs_lightning': 2.0,
    'lightning_vs_nature': 2.0, 'nature_vs_fire': 2.0, 'shadow_vs_all': 1.2,
  };
  const key = `${card.fx}_vs_${defender.element}`;
  const multiplier = multipliers[key] || 1.0;
  const variance = 0.85 + (Math.random() * 0.15); // called on action, not in render — safe
  return Math.floor(power * multiplier * variance);
};

// ─── VICTORY FANFARE (end-game credits) ───
function VictoryFanfare({ stats, onRestart }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 3000,
      background: 'linear-gradient(0deg, #ff7043 0%, #ffca28 50%, #4fc3f7 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', fontFamily: '"Courier New", monospace',
      imageRendering: 'pixelated', overflow: 'hidden'
    }}>
      <style>{`
        @keyframes trophySpin { 0% { transform: rotateY(0deg) scale(1.5); } 100% { transform: rotateY(360deg) scale(1.5); } }
        @keyframes creditsScroll { 0% { transform: translateY(400px); } 100% { transform: translateY(-600px); } }
        @keyframes fadeGold { from { filter: brightness(1); } to { filter: brightness(1.5) drop-shadow(0 0 10px #fff); } }
      `}</style>
      {/* Rotating trophy */}
      <div style={{
        position: 'relative', width: '60px', height: '80px', backgroundColor: '#f1c40f',
        clipPath: 'polygon(10% 0%, 90% 0%, 100% 40%, 50% 100%, 0% 40%)',
        border: '4px solid #f39c12', marginBottom: '40px',
        animation: 'trophySpin 3s infinite linear, fadeGold 1s infinite alternate'
      }}>
        <div style={{ position: 'absolute', top: '10%', left: '20%', width: '10px', height: '20px', backgroundColor: 'rgba(255,255,255,0.5)' }} />
      </div>
      {/* Title */}
      <div style={{ fontSize: '48px', color: '#fff', fontWeight: 'bold', textShadow: '4px 4px #d35400', marginBottom: '20px' }}>
        VICTORY!
      </div>
      {/* Scrolling credits */}
      <div style={{ textAlign: 'center', color: '#fff', fontSize: '18px', animation: 'creditsScroll 20s linear forwards' }}>
        <div style={{ marginBottom: '40px' }}>THE VOID HAS BEEN SEALED</div>
        <div style={{ color: '#f1c40f', marginBottom: '20px' }}>— BATTLE STATS —</div>
        <div>DRAGONS RAISED: {stats.dragonsRaised}</div>
        <div>GOLD AMASSED: {stats.totalGold}G</div>
        <div>TOTAL DAMAGE: {stats.totalDamage}</div>
        <div style={{ marginTop: '100px', fontSize: '12px' }}>DESIGNED BY YOU</div>
        <div style={{ marginTop: '20px', fontSize: '12px' }}>POWERED BY REACT</div>
        <div style={{ marginTop: '300px', fontSize: '40px', fontWeight: 'bold' }}>THE END</div>
      </div>
      {/* Restart */}
      <button onClick={onRestart} style={{
        position: 'absolute', bottom: '40px', padding: '10px 20px',
        background: 'none', border: '3px solid #fff', color: '#fff',
        cursor: 'pointer', fontFamily: '"Courier New",monospace', fontSize: 14,
        animation: 'pulseStatus 1s infinite alternate'
      }}>
        PLAY AGAIN?
      </button>
    </div>
  );
}

// ─── SAVE SYSTEM ───
const SaveSystem = {
  saveGame: (slot, data) => {
    try {
      localStorage.setItem(`dragon_quest_slot_${slot}`, JSON.stringify(data));
    } catch (err) { console.error("Save failed", err); }
  },
  loadGame: (slot) => {
    try {
      const data = localStorage.getItem(`dragon_quest_slot_${slot}`);
      return data ? JSON.parse(data) : null;
    } catch (err) { console.error("Load failed", err); return null; }
  },
};

// ─── SAVE MENU ───
function SaveMenu({ gameState, onSave, onLoad, onClose }) {
  const [activeSlot, setActiveSlot] = useState(0);
  return (
    <div style={{
      position: 'absolute', top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '320px', backgroundColor: '#d3bc8d',
      border: '6px double #3d2314', padding: '20px',
      fontFamily: '"Courier New", monospace', color: '#3d2314',
      zIndex: 1000, boxShadow: '0 20px 0 rgba(0,0,0,0.5)',
      imageRendering: 'pixelated'
    }}>
      <div style={{ fontSize: '18px', fontWeight: 'bold', textAlign: 'center', marginBottom: '16px' }}>
        — TRAVELER'S JOURNAL —
      </div>
      {[0, 1, 2].map(i => (
        <div key={i} onClick={() => setActiveSlot(i)} style={{
          padding: '12px', marginBottom: '8px',
          backgroundColor: activeSlot === i ? '#f1c40f' : 'rgba(0,0,0,0.1)',
          border: activeSlot === i ? '3px solid #3d2314' : '3px solid transparent',
          cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: 12 }}>FILE {i + 1}</div>
            <div style={{ fontSize: '10px' }}>GOLD: {gameState.gold}G | LV: {gameState.level}</div>
          </div>
          <div style={{ fontSize: '9px', textAlign: 'right' }}>
            {new Date().toLocaleDateString()}<br />
            {(gameState.location || 'HUB').toUpperCase()}
          </div>
        </div>
      ))}
      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
        <button onClick={() => onSave(activeSlot)} style={{ flex: 1, padding: '8px', background: '#2ecc71', color: '#fff', border: 'none', fontFamily: '"Courier New",monospace', cursor: 'pointer', fontWeight: 'bold', fontSize: 11 }}>SAVE</button>
        <button onClick={() => onLoad(activeSlot)} style={{ flex: 1, padding: '8px', background: '#3498db', color: '#fff', border: 'none', fontFamily: '"Courier New",monospace', cursor: 'pointer', fontWeight: 'bold', fontSize: 11 }}>LOAD</button>
        <button onClick={onClose} style={{ flex: 1, padding: '8px', background: '#e74c3c', color: '#fff', border: 'none', fontFamily: '"Courier New",monospace', cursor: 'pointer', fontWeight: 'bold', fontSize: 11 }}>CLOSE</button>
      </div>
    </div>
  );
}

// ─── LOADING SCREEN ───
function LoadingScreen() {
  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: '#000',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      zIndex: 2000, fontFamily: '"Courier New", monospace', color: '#fff'
    }}>
      <style>{`@keyframes pixelFly { 0% { transform: translateX(-50px); } 100% { transform: translateX(50px); } }`}</style>
      <div style={{
        width: '40px', height: '20px', backgroundColor: '#fff',
        clipPath: 'polygon(0% 50%, 40% 0%, 100% 50%, 40% 100%)',
        animation: 'pixelFly 1s infinite alternate ease-in-out',
        marginBottom: '20px'
      }} />
      <div style={{ fontSize: 13, letterSpacing: 2 }}>COMMUNING WITH DRAGONS...</div>
      <div style={{ width: '200px', height: '10px', border: '2px solid #fff', marginTop: '12px' }}>
        <div style={{ width: '60%', height: '100%', backgroundColor: '#f1c40f' }} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// GENERATE ENEMY
// ═══════════════════════════════════════════════════════════════
function generateEnemy(playerLevel) {
  const l = Math.max(1, playerLevel + rand(-1, 2));
  const el = pick(Object.keys(ELEMENTS));
  const mh = 60 + l * 15 + rand(0, 20);
  const mm = 60 + l * 10;
  const abs = [...ABILITIES[el]];
  if (l >= 6) { const t = TECHNIQUES.filter(t => t.req <= l); if (t.length) abs.push(pick(t)); }
  return {
    name: pick(ENEMY_NAMES),
    element: el, level: l,
    hp: mh, maxHp: mh, mana: mm, maxMana: mm,
    attack: 6 + l * 2 + rand(0, 3), defense: 4 + l * 2 + rand(0, 2),
    speed: 5 + l + rand(0, 3), abilities: abs, gold: 15 + l * 8 + rand(0, 10),
    xp: 10 + l * 5 + rand(0, 5), isBoss: false,
  };
}

function generateBoss(bossIndex) {
  const b = BOSSES[bossIndex];
  const abs = [...ABILITIES[b.element], b.sig];
  return {
    name: b.name, element: b.element, level: b.level,
    hp: b.hp, maxHp: b.hp, mana: b.mana, maxMana: b.mana,
    attack: b.atk, defense: b.def, speed: b.spd,
    abilities: abs, gold: b.gold, xp: b.xp, isBoss: true,
  };
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function DragonSimulator() {
  const [screen, setScreen] = useState("title");
  const [dragon, setDragon] = useState(null);
  const [enemy, setEnemy] = useState(null);
  const [battleLog, setBattleLog] = useState([]);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [battleOver, setBattleOver] = useState(false);
  const [gold, setGold] = useState(0);
  const [xp, setXp] = useState(0);
  const [xpNeeded, setXpNeeded] = useState(30);
  const [inventory, setInventory] = useState([]);
  const [techniques, setTechniques] = useState([]);
  const [bossesDefeated, setBossesDefeated] = useState([]);
  const [arena, setArena] = useState(ARENAS[0]);
  const [floatTexts, setFloatTexts] = useState([]);
  const [particles, setParticles] = useState(null);
  const [showEvo, setShowEvo] = useState(null);
  const [hubTab, setHubTab] = useState("stats");
  const [poison, setPoison] = useState({ player: 0, enemy: 0 });
  const [playerAnim, setPlayerAnim] = useState('idle');
  const [enemyAnim, setEnemyAnim] = useState('idle');
  const [playedCard, setPlayedCard] = useState(null);
  const [enemyThinking, setEnemyThinking] = useState(false);
  const [damagePops, setDamagePops] = useState([]);
  const [showTurnBanner, setShowTurnBanner] = useState(false);
  const [turnBannerSide, setTurnBannerSide] = useState('player');

  const addDamagePop = useCallback((value, side, color) => {
    const id = Date.now() + Math.random();
    const x = side === 'enemy' ? '62%' : '8%';
    const y = `${25 + Math.floor(Math.random() * 15)}%`;
    setDamagePops(prev => [...prev, { id, value, x, y, color }]);
    setTimeout(() => setDamagePops(prev => prev.filter(d => d.id !== id)), 700);
  }, []);

  const flashTurnBanner = useCallback((side) => {
    setTurnBannerSide(side);
    setShowTurnBanner(true);
    setTimeout(() => setShowTurnBanner(false), 1200);
  }, []);
  const [isShaking, setIsShaking] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [hitSparks, setHitSparks] = useState([]);
  const [activeCombo, setActiveCombo] = useState(null);
  const lastAbilityFxRef = useRef(null);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const totalDamageRef = useRef(0);

  const triggerShake = useCallback(() => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 300);
  }, []);

  const triggerFlash = useCallback(() => {
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 100);
  }, []);

  const addHitSpark = useCallback((side) => {
    const id = Date.now() + Math.random();
    const x = side === 'enemy' ? '65%' : '15%';
    const y = `${30 + Math.floor(Math.random() * 20)}%`;
    setHitSparks(prev => [...prev, { id, x, y }]);
    setTimeout(() => setHitSparks(prev => prev.filter(h => h.id !== id)), 220);
  }, []);

  // Create screen state
  const [createName, setCreateName] = useState("");
  const [createElement, setCreateElement] = useState("fire");
  const [createBody, setCreateBody] = useState("balanced");
  const [createColor, setCreateColor] = useState("default");
  const [createTitle, setCreateTitle] = useState("");

  const floatId = useRef(0);

  // ─── SAVE / LOAD ───
  const saveGame = useCallback(() => {
    if (!dragon) return;
    try {
      const data = { dragon, gold, xp, xpNeeded, inventory, techniques, bossesDefeated };
      window.storage?.set("dragonsim-save", JSON.stringify(data));
    } catch (e) { console.error("Save failed", e); }
  }, [dragon, gold, xp, xpNeeded, inventory, techniques, bossesDefeated]);

  const loadGame = useCallback(async () => {
    try {
      const r = await window.storage?.get("dragonsim-save");
      if (r?.value) {
        const d = JSON.parse(r.value);
        setDragon(d.dragon); setGold(d.gold); setXp(d.xp);
        setXpNeeded(d.xpNeeded); setInventory(d.inventory || []);
        setTechniques(d.techniques || []); setBossesDefeated(d.bossesDefeated || []);
        return true;
      }
    } catch (e) { console.error("Load failed", e); }
    return false;
  }, []);

  const deleteSave = useCallback(async () => {
    try { await window.storage?.delete("dragonsim-save"); } catch (e) {}
    setDragon(null); setGold(0); setXp(0); setXpNeeded(30);
    setInventory([]); setTechniques([]); setBossesDefeated([]);
    setScreen("title");
  }, []);

  // Auto-save when returning to hub
  useEffect(() => { if (screen === "hub" && dragon) saveGame(); }, [screen, saveGame, dragon]);

  // Check for save on title
  useEffect(() => {
    if (screen === "title") {
      loadGame().then(found => { if (found) setScreen("hub"); });
    }
  }, []);

  // ─── ADD FLOAT TEXT ───
  const addFloat = useCallback((text, color, side) => {
    const id = ++floatId.current;
    setFloatTexts(p => [...p, { id, text, color, side }]);
    setTimeout(() => setFloatTexts(p => p.filter(f => f.id !== id)), 1200);
  }, []);

  // ─── GET EVOLUTION STAGE ───
  const getEvolution = (level) => {
    let evo = EVOLUTIONS[0];
    for (const e of EVOLUTIONS) { if (level >= e.level) evo = e; }
    return evo;
  };

  // ─── CREATE DRAGON ───
  const createDragon = () => {
    if (!createName.trim()) return;
    const body = BODY_TYPES.find(b => b.id === createBody);
    const colorObj = DRAGON_COLORS.find(c => c.id === createColor);
    const d = {
      name: createName.trim(),
      title: createTitle,
      element: createElement,
      body: createBody,
      colorId: createColor,
      customColor: colorObj?.primary || null,
      level: 1,
      hp: 100 + (body.statMod.maxHp || 0),
      maxHp: 100 + (body.statMod.maxHp || 0),
      mana: 70 + (body.statMod.maxMana || 0),
      maxMana: 70 + (body.statMod.maxMana || 0),
      attack: 8 + (body.statMod.attack || 0),
      defense: 6 + (body.statMod.defense || 0),
      speed: 7 + (body.statMod.speed || 0),
      abilities: [...ABILITIES[createElement]],
      stage: 0,
    };
    setDragon(d); setGold(30); setXp(0); setXpNeeded(30);
    setInventory([]); setTechniques([]); setBossesDefeated([]);
    setScreen("hub");
  };

  // ─── DO ABILITY ───
  const doAbility = (attacker, defender, ab, isPlayer) => {
    let nA = { ...attacker }; let nD = { ...defender };
    let log = []; let nEP = poison.enemy; let nPP = poison.player;
    nA.mana -= ab.cost;

    const atkStat = nA.attack + rand(-2, 2);
    const defStat = nD.defense + rand(-1, 1);
    const elA = ELEMENTS[nA.element]; const elD = ELEMENTS[nD.element];
    let mult = 1;
    if (elA?.strong === nD.element) mult = 1.5;
    else if (elA?.weakness === nD.element) mult = 0.65;

    if (ab.type === "attack") {
      let dmg = Math.max(1, Math.round((ab.dmg + atkStat - defStat * 0.5) * mult));
      nD.hp = Math.max(0, nD.hp - dmg);
      const effText = mult > 1 ? " Super effective!" : mult < 1 ? " Not very effective..." : "";
      log.push({ text: `${nA.name} uses ${ab.name}! ${dmg} DMG!${effText}`, color: mult > 1 ? "#ff8844" : mult < 1 ? "#8888aa" : "#ffffff", icon: ab.icon });
      addFloat(`-${dmg}`, mult > 1 ? "#ff4444" : "#ff8888", isPlayer ? "enemy" : "player");
      if (isPlayer) totalDamageRef.current += dmg;
    } else if (ab.type === "multi") {
      let total = 0;
      for (let h = 0; h < (ab.hits || 3); h++) {
        let dmg = Math.max(1, Math.round((ab.dmg + atkStat * 0.6 - defStat * 0.3) * mult));
        nD.hp = Math.max(0, nD.hp - dmg); total += dmg;
      }
      log.push({ text: `${nA.name} unleashes ${ab.name}! ${ab.hits}x hit for ${total} DMG!`, color: "#ff6644", icon: ab.icon });
      addFloat(`-${total}`, "#ff4444", isPlayer ? "enemy" : "player");
    } else if (ab.type === "heal") {
      const h = ab.value + rand(-3, 5);
      nA.hp = Math.min(nA.maxHp, nA.hp + h);
      log.push({ text: `${nA.name} uses ${ab.name}! +${h} HP!`, color: "#44ff88", icon: ab.icon });
      addFloat(`+${h}`, "#44ff88", isPlayer ? "player" : "enemy");
    } else if (ab.type === "buff") {
      if (ab.name.toLowerCase().includes("atk") || ab.name.toLowerCase().includes("cry") || ab.name.toLowerCase().includes("charge") || ab.name.toLowerCase().includes("pact")) {
        nA.attack += ab.value;
        log.push({ text: `${nA.name} uses ${ab.name}! +${ab.value} ATK!`, color: "#ffaa00", icon: ab.icon });
      } else {
        nA.defense += ab.value;
        log.push({ text: `${nA.name} uses ${ab.name}! +${ab.value} DEF!`, color: "#ffaa00", icon: ab.icon });
      }
      addFloat(`+${ab.value}`, "#ffaa00", isPlayer ? "player" : "enemy");
    } else if (ab.type === "drain") {
      let dmg = Math.max(1, Math.round((ab.dmg + atkStat - defStat * 0.5) * mult));
      nD.hp = Math.max(0, nD.hp - dmg);
      const heal = Math.round(dmg * (ab.healPct || 0.4));
      nA.hp = Math.min(nA.maxHp, nA.hp + heal);
      log.push({ text: `${nA.name} uses ${ab.name}! ${dmg} DMG, heals ${heal}!`, color: "#cc44ff", icon: ab.icon });
      addFloat(`-${dmg}`, "#ff4444", isPlayer ? "enemy" : "player");
    } else if (ab.type === "poison") {
      let dmg = Math.max(1, Math.round((ab.dmg + atkStat * 0.5) * mult));
      nD.hp = Math.max(0, nD.hp - dmg);
      if (isPlayer) nEP = ab.turns || 3; else nPP = ab.turns || 3;
      log.push({ text: `${nA.name} uses ${ab.name}! ${dmg} DMG + Poisoned ${ab.turns} turns!`, color: "#88ff44", icon: ab.icon });
      addFloat(`-${dmg} 🐍`, "#88ff44", isPlayer ? "enemy" : "player");
    } else if (ab.type === "roar") {
      nA.attack += (ab.atkVal || 3); nA.defense += (ab.defVal || 2);
      log.push({ text: `${nA.name} roars! +${ab.atkVal}ATK +${ab.defVal}DEF!`, color: "#ffaa00", icon: ab.icon });
      addFloat(`+ATK +DEF`, "#ffaa00", isPlayer ? "player" : "enemy");
    } else if (ab.type === "rest") {
      const h = (ab.value || 10) + rand(-2, 4);
      const m = (ab.manaValue || 12) + rand(-2, 4);
      nA.hp = Math.min(nA.maxHp, nA.hp + h);
      nA.mana = Math.min(nA.maxMana, nA.mana + m);
      log.push({ text: `${nA.name} rests: +${h} HP, +${m} MP!`, color: "#88ccff", icon: "💤" });
      addFloat(`+${h}HP +${m}MP`, "#88ccff", isPlayer ? "player" : "enemy");
    } else if (ab.type === "focus") {
      const m = (ab.manaValue || 25) + rand(-3, 5);
      nA.mana = Math.min(nA.maxMana, nA.mana + m);
      log.push({ text: `${nA.name} focuses energy: +${m} MP!`, color: "#aa88ff", icon: "🧘" });
      addFloat(`+${m} MP`, "#aa88ff", isPlayer ? "player" : "enemy");
    }

    // Passive mana regen each turn
    nA.mana = Math.min(nA.maxMana, nA.mana + 3);

    return { a: nA, d: nD, log, ep: nEP, pp: nPP };
  };

  // ─── APPLY POISON ───
  const applyPoison = (target, turns, isPlayer) => {
    if (turns <= 0) return { target, turns: 0, log: [] };
    const dmg = 5 + rand(0, 3);
    const nT = { ...target, hp: Math.max(0, target.hp - dmg) };
    return {
      target: nT, turns: turns - 1,
      log: [{ text: `${nT.name} takes ${dmg} poison damage!`, color: "#88aa44", icon: "🐍" }],
    };
  };

  // ─── PLAYER ACTION ───
  const playerAction = (ability) => {
    if (!isPlayerTurn || battleOver) return;
    // Check synergy combo with the previous ability played this battle
    if (lastAbilityFxRef.current) {
      const combo = getSynergy({ fx: lastAbilityFxRef.current }, { fx: ability.fx });
      if (combo) {
        setActiveCombo(combo);
        triggerFlash();
        triggerShake();
        setTimeout(() => setActiveCombo(null), 2000);
      }
    }
    lastAbilityFxRef.current = ability.fx;
    setIsPlayerTurn(false);
    setParticles({ fx: ability.fx || null, side: "enemy" });
    setTimeout(() => setParticles(null), 800);
    setPlayerAnim('attack');
    setTimeout(() => setPlayerAnim('idle'), 800);
    // Impact juice: flash on attack, shake on heavy hits
    if (['attack', 'multi', 'drain'].includes(ability.type)) {
      triggerFlash();
      addHitSpark('enemy');
      if (ability.dmg >= 30) triggerShake();
      setTimeout(() => addDamagePop(ability.dmg, 'enemy', '#ff4444'), 200);
    }

    const res = doAbility(dragon, enemy, ability, true);
    let d = res.a; let e = res.d;
    let log = [...battleLog, ...res.log];
    let ep = res.ep; let pp = res.pp;

    // Player poison
    if (pp > 0) {
      const pr = applyPoison(d, pp, true);
      d = pr.target; pp = pr.turns; log = [...log, ...pr.log];
    }

    setDragon(d); setEnemy(e); setBattleLog(log);
    setPoison({ player: pp, enemy: ep });

    if (e.hp <= 0) {
      log.push({ text: `🎉 ${e.name} defeated! +${e.gold}g +${e.xp}xp`, color: "#ffdd44", icon: "🏆" });
      setBattleLog(log); setBattleOver(true);
      const newGold = gold + e.gold;
      const newXp = xp + e.xp;
      setGold(newGold);
      if (e.isBoss) {
        setBossesDefeated(prev => [...prev, e.name]);
        if (e.name === 'Nihiloth the Void Dragon') setGameWon(true);
      }
      // Level up check
      if (newXp >= xpNeeded) {
        const n = { ...d, level: d.level + 1, attack: d.attack + rand(1, 3), defense: d.defense + rand(1, 3), speed: d.speed + rand(1, 3), maxHp: d.maxHp + rand(8, 15), maxMana: d.maxMana + rand(6, 12) };
        n.hp = n.maxHp; n.mana = n.maxMana;
        // Check evolution
        const newEvo = getEvolution(n.level);
        const oldEvo = getEvolution(d.level);
        if (newEvo.stage !== oldEvo.stage) {
          const ei = EVOLUTIONS.indexOf(newEvo);
          n.stage = ei;
          n.attack += newEvo.bonus.attack; n.defense += newEvo.bonus.defense;
          n.speed += newEvo.bonus.speed; n.maxHp += newEvo.bonus.maxHp;
          n.maxMana += newEvo.bonus.maxMana; n.hp = n.maxHp; n.mana = n.maxMana;
          setShowEvo(newEvo);
          setTimeout(() => setShowEvo(null), 3000);
        }
        setDragon(n); setXp(newXp - xpNeeded); setXpNeeded(Math.round(xpNeeded * 1.4));
        log.push({ text: `⬆️ LEVEL UP! Now level ${n.level}!`, color: "#ffee44", icon: "⬆️" });
        setBattleLog(log);
      } else {
        setXp(newXp);
      }
      return;
    }

    // Enemy turn — show thinking bubble, then attack
    setEnemyThinking(true);
    flashTurnBanner('enemy');
    setTimeout(() => {
      setEnemyThinking(false);
      const eAbilities = e.abilities.filter(a => e.mana >= a.cost);
      const eAb = eAbilities.length > 0 ? pick(eAbilities) : { name: "Rest", dmg: 0, cost: 0, type: "rest", value: 10, manaValue: 12, icon: "💤", fx: "heal" };
      setParticles({ fx: eAb.fx || null, side: "player" });
      setTimeout(() => setParticles(null), 800);
      setEnemyAnim('attack');
      setTimeout(() => setEnemyAnim('idle'), 800);
      if (['attack', 'multi', 'drain'].includes(eAb.type)) {
        triggerFlash();
        addHitSpark('player');
        if (eAb.dmg >= 30) triggerShake();
        setTimeout(() => addDamagePop(eAb.dmg, 'player', '#ff6644'), 200);
      }

      const eres = doAbility(e, d, eAb, false);
      let ne = eres.a; let nd = eres.d;
      let elog = [...log, ...eres.log];
      let nep2 = eres.ep; let npp2 = eres.pp;

      // Enemy poison
      if (nep2 > 0) {
        const pr = applyPoison(ne, nep2, false);
        ne = pr.target; nep2 = pr.turns; elog = [...elog, ...pr.log];
      }

      setDragon(nd); setEnemy(ne); setBattleLog(elog);
      setPoison({ player: npp2, enemy: nep2 });

      if (nd.hp <= 0) {
        elog.push({ text: `💀 ${nd.name} has fallen...`, color: "#ff4444", icon: "💀" });
        setBattleLog(elog); setBattleOver(true);
      } else {
        setIsPlayerTurn(true);
        flashTurnBanner('player');
      }
    }, 1200);
  };

  // ─── START BATTLE ───
  const startBattle = (bossIndex = null) => {
    const e = bossIndex !== null ? generateBoss(bossIndex) : generateEnemy(dragon.level);
    const d = { ...dragon, hp: dragon.maxHp, mana: dragon.maxMana };
    // Add learned techniques to abilities
    const allAbs = [...ABILITIES[dragon.element], ...techniques.map(t => TECHNIQUES.find(te => te.name === t)).filter(Boolean)];
    d.abilities = allAbs;
    setDragon(d); setEnemy(e); setBattleLog([]); setIsPlayerTurn(d.speed >= e.speed);
    setBattleOver(false); setArena(pick(ARENAS)); setFloatTexts([]); setParticles(null);
    setPoison({ player: 0, enemy: 0 }); setPlayerAnim('walk'); setEnemyAnim('walk');
    lastAbilityFxRef.current = null; setActiveCombo(null);
    setScreen("battle");
    setTimeout(() => { setPlayerAnim('idle'); setEnemyAnim('idle'); }, 1200);
  };

  // ─── TRAIN ───
  const train = (stat, cost) => {
    if (gold < cost) return;
    setGold(gold - cost);
    const d = { ...dragon };
    const g = rand(1, 3);
    if (stat === "attack") d.attack += g;
    else if (stat === "defense") d.defense += g;
    else if (stat === "speed") d.speed += g;
    else if (stat === "maxHp") { d.maxHp += g * 5; d.hp = d.maxHp; }
    else if (stat === "maxMana") { d.maxMana += g * 3; d.mana = d.maxMana; }
    setDragon(d);
  };

  // ─── BUY ITEM ───
  const buyItem = (item) => {
    if (gold < item.cost || inventory.includes(item.name) || dragon.level < item.req) return;
    setGold(gold - item.cost); setInventory([...inventory, item.name]);
    const d = { ...dragon };
    if (item.stat === "maxHp") { d.maxHp += item.value; d.hp = d.maxHp; }
    else if (item.stat === "maxMana") { d.maxMana += item.value; d.mana = d.maxMana; }
    else d[item.stat] = (d[item.stat] || 0) + item.value;
    setDragon(d);
  };

  // ─── LEARN TECHNIQUE ───
  const learnTech = (tech) => {
    if (gold < tech.price || techniques.includes(tech.name) || dragon.level < tech.req) return;
    setGold(gold - tech.price); setTechniques([...techniques, tech.name]);
  };

  // ─── REST AT CAMP ───
  const restAtCamp = () => {
    const d = { ...dragon, hp: dragon.maxHp, mana: dragon.maxMana };
    setDragon(d);
  };

  // ─── CSS ───
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Fira+Code:wght@400;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    @keyframes floatUp { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(-40px); opacity: 0; } }
    @keyframes particleBurst { 0% { transform: scale(0); opacity: 0.8; } 50% { transform: scale(1.5); opacity: 0.5; } 100% { transform: scale(0) translateY(-20px); opacity: 0; } }
    @keyframes slideIn { 0% { transform: translateY(20px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
    @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
    @keyframes glow { 0%, 100% { box-shadow: 0 0 5px currentColor; } 50% { box-shadow: 0 0 15px currentColor; } }
    @keyframes evoFlash { 0% { opacity: 0; transform: scale(0.5); } 50% { opacity: 1; transform: scale(1.2); } 100% { opacity: 0; transform: scale(2); } }
    .btn { background: #1a1a1a; border: 1px solid #333; border-radius: 6px; color: #ccc; cursor: pointer; font-family: 'Fira Code', monospace; transition: all 0.2s; }
    .btn:hover:not(:disabled) { background: #252525; border-color: #555; transform: translateY(-1px); }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-primary { background: linear-gradient(135deg,#cc3300,#ff5522); border-color: #ff6633; color: #fff; font-weight: 700; }
    .btn-primary:hover:not(:disabled) { background: linear-gradient(135deg,#dd4411,#ff6633); }
    .btn-boss { background: linear-gradient(135deg,#551100,#882200); border-color: #aa3311; color: #ff8844; }
    .tab { background: none; border: none; border-bottom: 2px solid transparent; color: #666; cursor: pointer; padding: 6px 12px; font-size: 10px; font-family: 'Fira Code', monospace; text-transform: uppercase; letter-spacing: 1px; }
    .tab.active { color: #ff8844; border-bottom-color: #ff8844; }
    .tab:hover { color: #aaa; }
    input, select { background: #111; border: 1px solid #333; border-radius: 4px; color: #eee; padding: 6px 10px; font-family: 'Fira Code', monospace; font-size: 12px; outline: none; }
    input:focus, select:focus { border-color: #ff8844; }
  `;

  const pg = { width: "100%", minHeight: "100vh", background: "#0d0d0d", color: "#eee", fontFamily: "'Cinzel', serif", padding: 16, overflow: "auto" };

  // ─── EVOLUTION OVERLAY ───
  const EvoOverlay = showEvo && (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
      <div style={{ textAlign: "center", animation: "evoFlash 3s ease forwards" }}>
        <div style={{ fontSize: 48, marginBottom: 10 }}>🐉</div>
        <h2 style={{ fontSize: 24, color: "#ffdd44", marginBottom: 6 }}>EVOLUTION!</h2>
        <div style={{ fontSize: 18, color: "#ff8844", fontWeight: 700, marginBottom: 6 }}>{showEvo.stage}</div>
        <div style={{ fontSize: 13, color: "#aaa", fontFamily: "'Cinzel',serif" }}>{showEvo.desc}</div>
        <div style={{ fontSize: 11, color: "#88ff88", marginTop: 10, fontFamily: "'Fira Code',monospace" }}>
          +{showEvo.bonus.attack}ATK +{showEvo.bonus.defense}DEF +{showEvo.bonus.speed}SPD +{showEvo.bonus.maxHp}HP +{showEvo.bonus.maxMana}MP
        </div>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  // SCREENS
  // ═══════════════════════════════════════════════════════════

  // ─── GAME WON (final boss defeated) ───
  if (gameWon) return (
    <VictoryFanfare
      stats={{ dragonsRaised: 1, totalGold: gold, totalDamage: totalDamageRef.current }}
      onRestart={() => { setGameWon(false); totalDamageRef.current = 0; deleteSave(); }}
    />
  );

  // ─── TITLE ───
  if (screen === "title") return (
    <div style={{ ...pg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <style>{css}</style>
      <CRTOverlay />
      <div style={{ animation: "slideIn 1s ease", textAlign: "center" }}>
        <div style={{ fontSize: 13, letterSpacing: 8, color: "#555", marginBottom: 10 }}>⚔ DRAGON FORGE ⚔</div>
        <h1 style={{ fontSize: 38, fontWeight: 900, background: "linear-gradient(180deg,#ff8844,#ff4422,#cc2200)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1.1, marginBottom: 10 }}>DRAGON<br />SIMULATOR</h1>
        <div style={{ fontSize: 11, color: "#777", marginBottom: 28, letterSpacing: 3, fontFamily: "'Fira Code',monospace" }}>BUILD · TRAIN · EVOLVE · BATTLE</div>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", marginBottom: 28 }}>
          {Object.entries(ELEMENTS).map(([k]) => (<div key={k}><DragonSprite element={k} size={50} animate /></div>))}
        </div>
        <button className="btn btn-primary" style={{ fontSize: 14, padding: "12px 36px", letterSpacing: 2 }} onClick={() => setScreen("create")}>NEW GAME</button>
      </div>
    </div>
  );

  // ─── CREATE ───
  if (screen === "create") {
    const se = ELEMENTS[createElement];
    const cc = DRAGON_COLORS.find(c => c.id === createColor);
    const previewColor = cc?.primary || se.color;
    return (
      <div style={{ ...pg, maxWidth: 500, margin: "0 auto" }}>
        <style>{css}</style>
        <h2 style={{ fontSize: 20, textAlign: "center", marginBottom: 20, color: "#ff8844" }}>⚔ FORGE YOUR DRAGON ⚔</h2>

        <div style={{ textAlign: "center", marginBottom: 16 }}>
          {SPRITE_SHEETS[createElement]
            ? <DragonSpriteSheet element={createElement} currentAnimation={createName.trim() ? 'idle' : 'egg'} />
            : <DragonSprite element={createElement} size={100} color={previewColor} animate />}
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>Dragon Name</label>
          <input value={createName} onChange={e => setCreateName(e.target.value)} placeholder="Enter name..." style={{ width: "100%" }} maxLength={20} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>Title</label>
          <select value={createTitle} onChange={e => setCreateTitle(e.target.value)} style={{ width: "100%" }}>
            {TITLES.map(t => <option key={t} value={t}>{t || "(none)"}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>Element</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {Object.entries(ELEMENTS).map(([k, v]) => (
              <button key={k} className="btn" onClick={() => setCreateElement(k)} style={{
                flex: 1, minWidth: 60, padding: "8px 4px", textAlign: "center",
                borderColor: createElement === k ? v.color : "#333", background: createElement === k ? v.bg : "#1a1a1a",
              }}>
                <div style={{ fontSize: 16 }}>{v.emoji}</div>
                <div style={{ fontSize: 9, color: createElement === k ? v.color : "#888" }}>{v.name}</div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>Body Type</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {BODY_TYPES.map(b => (
              <button key={b.id} className="btn" onClick={() => setCreateBody(b.id)} style={{
                flex: 1, minWidth: 70, padding: "6px 4px", textAlign: "center",
                borderColor: createBody === b.id ? "#ff8844" : "#333",
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: createBody === b.id ? "#ff8844" : "#ccc" }}>{b.name}</div>
                <div style={{ fontSize: 8, color: "#888" }}>{b.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>Color</label>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {DRAGON_COLORS.map(c => (
              <button key={c.id} className="btn" onClick={() => setCreateColor(c.id)} style={{
                width: 32, height: 32, borderRadius: 6, padding: 0,
                background: c.primary || se.color, borderColor: createColor === c.id ? "#fff" : "#333", borderWidth: createColor === c.id ? 2 : 1,
              }} title={c.name} />
            ))}
          </div>
        </div>

        <button className="btn btn-primary" onClick={createDragon} disabled={!createName.trim()} style={{ width: "100%", padding: "12px", fontSize: 14, letterSpacing: 2 }}>
          🐉 CREATE DRAGON
        </button>
      </div>
    );
  }

  // ─── HUB ───
  if (screen === "hub" && dragon) {
    const pEl = ELEMENTS[dragon.element];
    const evo = getEvolution(dragon.level);
    const availBosses = BOSSES.filter(b => dragon.level >= b.level && !bossesDefeated.includes(b.name));
    const trainCost = 10 + dragon.level * 3;

    return (
      <div style={{ ...pg, maxWidth: 500, margin: "0 auto" }}>
        <style>{css}</style>
        {EvoOverlay}

        {/* Dragon card */}
        <div style={{ background: `linear-gradient(135deg,${pEl.bg},#111)`, border: `1px solid ${pEl.color}33`, borderRadius: 10, padding: 14, marginBottom: 12, textAlign: "center" }}>
          {(() => { const DC = DRAGON_COMPONENTS[dragon.element]; return DC ? <DC animationState="idle" /> : <DragonSprite element={dragon.element} size={90} color={dragon.customColor} stage={dragon.stage} animate />; })()}
          <h2 style={{ fontSize: 16, color: pEl.color, marginTop: 6 }}>{dragon.name} {dragon.title}</h2>
          <div style={{ fontSize: 10, color: "#888", fontFamily: "'Fira Code',monospace" }}>
            {pEl.emoji} {pEl.name} {evo.stage} · Lv.{dragon.level}
          </div>
          <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 8, fontSize: 10, color: "#aaa", fontFamily: "'Fira Code',monospace" }}>
            <span>⚔{dragon.attack}</span><span>🛡{dragon.defense}</span><span>💨{dragon.speed}</span>
            <span>❤️{dragon.maxHp}</span><span><ManaCrystal size={12} />{dragon.maxMana}</span>
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: "#ffcc44", fontFamily: "'Fira Code',monospace" }}>
            💰 {gold}g · ⭐ {xp}/{xpNeeded} XP
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #222", marginBottom: 10 }}>
          {["stats", "shop", "tech", "bosses", "deck"].map(t => (
            <button key={t} className={`tab ${hubTab === t ? "active" : ""}`} onClick={() => setHubTab(t)}>{t}</button>
          ))}
        </div>

        {/* Stats tab */}
        {hubTab === "stats" && (
          <div>
            <HealthBar current={dragon.hp} max={dragon.maxHp} color="#44dd66" label="HP" />
            <HealthBar current={dragon.mana} max={dragon.maxMana} color="#4488ff" label="MP" />
            <HealthBar current={xp} max={xpNeeded} color="#ffcc44" label="XP" />

            <div style={{ fontSize: 11, color: "#aaa", marginTop: 10, marginBottom: 6 }}>Training ({trainCost}g each)</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {[["attack", "⚔ Attack"], ["defense", "🛡 Defense"], ["speed", "💨 Speed"], ["maxHp", "❤️ Vitality"], ["maxMana", "🔮 Arcane Study"]].map(([s, l]) => (
                <button key={s} className="btn" onClick={() => train(s, trainCost)} disabled={gold < trainCost} style={{ padding: "8px", fontSize: 10 }}>{l}</button>
              ))}
              <button className="btn" onClick={restAtCamp} style={{ padding: "8px", fontSize: 10 }}>🏕️ Rest at Camp</button>
            </div>

            <button className="btn" onClick={deleteSave} style={{ marginTop: 12, width: "100%", fontSize: 9, color: "#aa4444", padding: "6px" }}>🗑️ Delete Save & Restart</button>
          </div>
        )}

        {/* Shop tab */}
        {hubTab === "shop" && (
          <div style={{ display: "grid", gap: 6 }}>
            {SHOP_ITEMS.map(item => {
              const owned = inventory.includes(item.name);
              const canBuy = gold >= item.cost && dragon.level >= item.req && !owned;
              return (
                <button key={item.name} className="btn" onClick={() => buyItem(item)} disabled={!canBuy} style={{
                  padding: "8px 10px", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center",
                  borderColor: owned ? "#44dd6644" : canBuy ? "#ff884444" : "#333",
                }}>
                  <div>
                    {item.name === 'Mana Crystal' ? <ManaCrystal size={14} /> : <span style={{ fontSize: 12 }}>{item.icon}</span>}
                    <span style={{ fontSize: 11, fontWeight: 700, marginLeft: 6, color: owned ? "#44dd66" : "#eee" }}>{item.name}</span>
                    <span style={{ fontSize: 9, color: "#888", marginLeft: 6 }}>{item.desc} · Req Lv.{item.req}</span>
                  </div>
                  <span style={{ fontSize: 10, color: owned ? "#44dd66" : "#ffcc44", fontFamily: "'Fira Code',monospace" }}>
                    {owned ? "✓" : `${item.cost}g`}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Techniques tab */}
        {hubTab === "tech" && (
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center" }}>
            {TECHNIQUES.map(tech => {
              const learned = techniques.includes(tech.name);
              const canLearn = gold >= tech.price && dragon.level >= tech.req && !learned;
              const rarity = tech.req >= 12 ? 'legendary' : tech.req >= 6 ? 'rare' : 'common';
              const desc = `${tech.desc}\n${tech.dmg > 0 ? `${tech.dmg} dmg · ` : ''}${tech.cost}mp · Lv.${tech.req} · ${learned ? 'Learned' : `${tech.price}g`}`;
              const Artwork = CARD_ARTWORK[tech.fx];
              return (
                <CardFrame key={tech.name} name={tech.name} description={desc} rarity={rarity}
                  onClick={() => learnTech(tech)} disabled={!canLearn} owned={learned}>
                  {Artwork ? <Artwork /> : tech.icon}
                </CardFrame>
              );
            })}
          </div>
        )}

        {/* Bosses tab */}
        {hubTab === "bosses" && (
          <div style={{ display: "grid", gap: 6 }}>
            {BOSSES.map((b, i) => {
              const defeated = bossesDefeated.includes(b.name);
              const available = dragon.level >= b.level && !defeated;
              return (
                <button key={b.name} className={available ? "btn btn-boss" : "btn"} onClick={() => available && startBattle(i)} disabled={!available} style={{
                  padding: "10px", textAlign: "left",
                  borderColor: defeated ? "#44dd6644" : available ? "#aa3311" : "#333",
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: defeated ? "#44dd66" : available ? "#ff8844" : "#666" }}>
                    💀 {b.name} {defeated && "✓ SLAIN"}
                  </div>
                  <div style={{ fontSize: 9, color: "#888", fontFamily: "'Fira Code',monospace" }}>
                    {ELEMENTS[b.element].emoji} Lv.{b.level} · {b.hp}HP · {b.gold}g reward
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Deck tab */}
        {hubTab === "deck" && (
          <div style={{ width: '100%', backgroundColor: '#000080', backgroundImage: 'linear-gradient(135deg,#0000cc 0%,#000033 100%)', border: '4px double #fff', padding: 14, display: 'flex', gap: 14, fontFamily: '"Courier New",monospace', color: '#fff', imageRendering: 'pixelated' }}>
            {/* Sidebar: Dragon preview + stats */}
            <div style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', border: '2px solid rgba(255,255,255,0.2)', padding: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 'bold', borderBottom: '2px solid #fff', paddingBottom: 4 }}>DRAGON STATS</div>
              <div style={{ width: '100%', height: 80, backgroundColor: '#000', border: '2px solid #fff', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                <div style={{ transform: 'scale(0.5)', transformOrigin: 'center center' }}>
                  {(() => { const DC = DRAGON_COMPONENTS[dragon.element]; return DC ? <DC animationState="idle" /> : <DragonSprite element={dragon.element} size={90} color={dragon.customColor} stage={dragon.stage} animate />; })()}
                </div>
              </div>
              <div style={{ fontSize: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div>NAME: {dragon.name}</div>
                <div>LV: {dragon.level} · {ELEMENTS[dragon.element].emoji} {ELEMENTS[dragon.element].name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>ATK:
                  <div style={{ height: 6, width: 50, background: '#333' }}><div style={{ height: '100%', width: `${Math.min(100, dragon.attack * 2)}%`, background: '#e74c3c' }} /></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>DEF:
                  <div style={{ height: 6, width: 50, background: '#333' }}><div style={{ height: '100%', width: `${Math.min(100, dragon.defense * 2)}%`, background: '#3498db' }} /></div>
                </div>
              </div>
            </div>
            {/* Ability card grid */}
            <div style={{ flex: 2, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, overflowY: 'auto', maxHeight: 260 }}>
              {[...ABILITIES[dragon.element], ...techniques.map(t => TECHNIQUES.find(te => te.name === t)).filter(Boolean)].map((ab, i) => (
                <div key={i} style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '2px solid #fff', padding: '6px', textAlign: 'center', fontSize: 9 }}>
                  <div style={{ fontSize: 16, marginBottom: 2 }}>{ab.icon}</div>
                  <div style={{ fontWeight: 'bold', fontSize: 10 }}>{ab.name}</div>
                  <div style={{ color: '#aaa', marginTop: 2 }}>{ab.dmg > 0 ? `${ab.dmg}dmg · ` : ''}{ab.cost}mp</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        {showSaveMenu && (
          <SaveMenu
            gameState={{ gold, level: dragon.level, location: 'hub' }}
            onSave={(slot) => { SaveSystem.saveGame(slot, { dragon, gold, xp, xpNeeded, inventory, techniques, bossesDefeated }); setShowSaveMenu(false); }}
            onLoad={(slot) => { const d = SaveSystem.loadGame(slot); if (d) { setDragon(d.dragon); setGold(d.gold); setXp(d.xp); setXpNeeded(d.xpNeeded); setInventory(d.inventory || []); setTechniques(d.techniques || []); setBossesDefeated(d.bossesDefeated || []); } setShowSaveMenu(false); }}
            onClose={() => setShowSaveMenu(false)}
          />
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button className="btn btn-primary" onClick={() => startBattle()} style={{ flex: 1, padding: "12px", fontSize: 13, letterSpacing: 1 }}>⚔️ BATTLE</button>
          {availBosses.length > 0 && (
            <button className="btn btn-boss" onClick={() => { const bi = BOSSES.indexOf(availBosses[0]); startBattle(bi); }} style={{ flex: 1, padding: "12px", fontSize: 11, letterSpacing: 1 }}>
              💀 BOSS: {availBosses[0].name.split(" ")[0]}
            </button>
          )}
          <button className="btn" onClick={() => setShowSaveMenu(true)} style={{ padding: "12px 10px", fontSize: 11 }}>💾</button>
        </div>
      </div>
    );
  }

  // ─── BATTLE ───
  if (screen === "battle" && dragon && enemy) {
    const pEl = ELEMENTS[dragon.element]; const eEl = ELEMENTS[enemy.element];
    const allAbilities = dragon.abilities || [];

    return (
      <div style={{ ...pg, maxWidth: 500, margin: "0 auto", position: "relative" }}>
        <style>{css}</style>
        {EvoOverlay}

        {/* Arena */}
        <div style={{
          background: arena.bg || 'transparent', borderRadius: 10, border: "1px solid #222",
          padding: 12, paddingTop: 60, marginBottom: 10, position: "relative", minHeight: 220, overflow: "hidden",
          animation: isShaking ? 'snesShake 0.1s infinite' : 'none',
        }}>
          <style>{`@keyframes snesShake { 0% { transform: translate(2px,1px); } 20% { transform: translate(-1px,-2px); } 40% { transform: translate(-3px,0px); } 60% { transform: translate(3px,2px); } 80% { transform: translate(1px,-1px); } 100% { transform: translate(-1px,2px); } }`}</style>
          {/* Flash overlay */}
          <div style={{ position: 'absolute', inset: 0, backgroundColor: '#fff', opacity: isFlashing ? 0.7 : 0, zIndex: 100, pointerEvents: 'none', transition: 'opacity 0.05s' }} />
          {/* Combo effects */}
          {activeCombo === 'TOXIC_CLOUD' && <ToxicCloudEffect />}
          {activeCombo === 'SUPERCONDUCTOR' && <SuperconductorEffect />}
          {arena.component === 'mountain' && <BattleBackground />}
          {arena.name === 'Volcanic Crater' && <FireCraterAura><div /></FireCraterAura>}
          {arena.name === 'Frozen Tundra' && <GlacialCavernAura><div /></GlacialCavernAura>}
          <div style={{ position: "absolute", top: 4, left: 0, right: 0, textAlign: "center", fontSize: 9, color: arena.component === 'mountain' ? "#8899bb" : "#555", letterSpacing: 2, fontFamily: "'Fira Code',monospace", zIndex: 10 }}>{arena.name}</div>

          {/* Ground line */}
          {!arena.component && <div style={{ position: "absolute", bottom: 20, left: 0, right: 0, height: 2, background: `${arena.ground}44` }} />}

          {/* Dragons */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingTop: 20, position: "relative", zIndex: 10 }}>
            <div style={{ textAlign: "center", position: "relative" }}>
              <div style={{ position: "absolute", top: -50, left: "50%", transform: "translateX(-50%)" }}>
                <DragonCombatHUD name={`${dragon.name} Lv.${dragon.level}`} currentHP={dragon.hp} maxHP={dragon.maxHp} currentMana={dragon.mana} maxMana={dragon.maxMana} activeEffects={poison.player > 0 ? ['POISON'] : []} />
              </div>
              {(() => { const DC = DRAGON_COMPONENTS[dragon.element]; return DC
                ? <DC animationState={playerAnim} />
                : SPRITE_SHEETS[dragon.element]
                  ? <DragonSpriteSheet element={dragon.element} currentAnimation={playerAnim} />
                  : <DragonSprite element={dragon.element} size={70} color={dragon.customColor} stage={dragon.stage} animate />; })()}
            </div>
            <div style={{ fontSize: 20, color: "#444", alignSelf: "center" }}>⚔</div>
            <div style={{ textAlign: "center", position: "relative" }}>
              <div style={{ position: "absolute", top: -50, left: "50%", transform: "translateX(-50%)" }}>
                <DragonCombatHUD name={`${enemy.name} Lv.${enemy.level}${enemy.isBoss ? ' 💀' : ''}`} currentHP={enemy.hp} maxHP={enemy.maxHp} currentMana={enemy.mana} maxMana={enemy.maxMana} activeEffects={poison.enemy > 0 ? ['POISON'] : []} />
              </div>
              {(() => { const EnemySprite = ENEMY_SPRITES[enemy.name]; const DC = DRAGON_COMPONENTS[enemy.element]; return EnemySprite
                ? <div style={{ transform: 'scale(0.5)', transformOrigin: 'bottom center', height: 100 }}><EnemySprite /></div>
                : DC
                  ? <DC animationState={enemyAnim} flip />
                  : SPRITE_SHEETS[enemy.element]
                    ? <DragonSpriteSheet element={enemy.element} currentAnimation={enemyAnim} flip />
                    : <DragonSprite element={enemy.element} size={70} flip animate />; })()}
            </div>
          </div>

          {/* Float texts & particles */}
          <FloatText texts={floatTexts} />
          {particles && <SpellParticles fx={particles.fx} side={particles.side} />}
          {hitSparks.map(h => <HitSpark key={h.id} x={h.x} y={h.y} />)}
          {damagePops.map(d => <DamagePopUp key={d.id} value={d.value} x={d.x} y={d.y} color={d.color} />)}
          {showTurnBanner && <TurnBanner activeTurn={turnBannerSide} />}
          {/* Enemy thought bubble */}
          {enemyThinking && (() => { const EnemySprite = ENEMY_SPRITES[enemy.name]; const hasCustom = EnemySprite || DRAGON_COMPONENTS[enemy.element]; return hasCustom ? <div style={{ position: 'absolute', right: '8%', top: '35%', zIndex: 20 }}><EnemyThoughtBubble /></div> : null; })()}
          {/* Action dialogue */}
          <ActionLog message={battleLog.length > 0 ? `${battleLog[battleLog.length-1].icon ? battleLog[battleLog.length-1].icon + ' ' : ''}${battleLog[battleLog.length-1].text}` : 'Battle begins...'} />
        </div>


        {/* Turn indicator */}
        {!battleOver && (
          <div style={{ textAlign: "center", fontSize: 10, color: isPlayerTurn ? "#44dd66" : "#dd6644", marginBottom: 6, fontFamily: "'Fira Code',monospace" }}>
            {isPlayerTurn ? "▶ YOUR TURN" : "⏳ ENEMY TURN..."}
          </div>
        )}

        {/* Played card spotlight */}
        {playedCard && (
          <div style={{ position: 'fixed', top: '40%', left: '50%', transform: 'translate(-50%,-50%) scale(1.3)', zIndex: 300, animation: 'cardFocus 0.6s forwards', pointerEvents: 'none' }}>
            {(() => { const A = CARD_ARTWORK[playedCard.fx]; return <CardFrame name={playedCard.name} description="" rarity={playedCard.rarity || 'common'}>{A ? <A /> : <span style={{ fontSize: 32 }}>{playedCard.icon}</span>}</CardFrame>; })()}
          </div>
        )}

        {/* Card hand */}
        {!battleOver && (
          <>
            <CardHand
              cards={allAbilities.map((a, i) => ({ id: i, name: a.name, fx: a.fx || 'fire', icon: a.icon, rarity: a.dmg >= 35 ? 'legendary' : a.dmg >= 20 ? 'rare' : 'common', desc: `${a.desc} · ${a.dmg > 0 ? a.dmg + 'dmg · ' : ''}${a.cost}mp`, canPlay: isPlayerTurn && dragon.mana >= a.cost, ability: a }))}
              onPlayCard={(card) => {
                setPlayedCard(card.ability);
                setTimeout(() => { playerAction(card.ability); setPlayedCard(null); }, 600);
              }}
            />
            <div style={{ display: 'flex', gap: 5, marginTop: 4 }}>
              <button className="btn" onClick={() => playerAction({ name: "Rest", dmg: 0, cost: 0, type: "rest", value: 10, manaValue: 12, icon: "💤", fx: "heal" })} disabled={!isPlayerTurn} style={{ flex: 1, textAlign: "center", padding: "4px", fontSize: 9 }}>💤 Rest (+10 HP, +12 MP)</button>
              <button className="btn" onClick={() => playerAction({ name: "Focus", dmg: 0, cost: 0, type: "focus", manaValue: 25, icon: "🧘", fx: "buff" })} disabled={!isPlayerTurn} style={{ flex: 1, textAlign: "center", padding: "4px", fontSize: 9 }}>🧘 Focus (+25 MP)</button>
            </div>
          </>
        )}

        {battleOver && enemy?.hp <= 0 && (
          <VictoryScreen enemy={enemy} earnedGold={enemy.gold} earnedXp={enemy.xp} onContinue={() => setScreen("hub")} />
        )}
        {battleOver && dragon?.hp <= 0 && (
          <DefeatScreen onRetry={() => startBattle()} onMenu={() => setScreen("hub")} />
        )}
      </div>
    );
  }

  return null;
}
