import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════
// DRAGON FORGE — Full Feature Dragon Simulator
// Build · Train · Evolve · Battle
// ═══════════════════════════════════════════════════════════════

const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = (arr) => arr[rand(0, arr.length - 1)];

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
];

// ─── BOSSES ───
const BOSSES = [
  { name: "Infernax the World Burner", element: "fire", level: 5, hp: 200, atk: 14, def: 8, spd: 10, mana: 100, sig: { name: "World Fire", dmg: 40, cost: 30, type: "attack", icon: "🌋", fx: "fire" }, gold: 150, xp: 80 },
  { name: "Glaciara the Frozen Queen", element: "ice", level: 8, hp: 280, atk: 16, def: 12, spd: 9, mana: 120, sig: { name: "Absolute Zero", dmg: 50, cost: 35, type: "attack", icon: "🧊", fx: "ice" }, gold: 250, xp: 140 },
  { name: "Voltharion the Storm King", element: "lightning", level: 12, hp: 350, atk: 20, def: 10, spd: 18, mana: 140, sig: { name: "Judgement Bolt", dmg: 60, cost: 40, type: "attack", icon: "⚡", fx: "lightning" }, gold: 400, xp: 220 },
  { name: "Yggdraxis the Ancient Root", element: "nature", level: 16, hp: 450, atk: 18, def: 22, spd: 7, mana: 160, sig: { name: "Nature's Wrath", dmg: 55, cost: 35, type: "attack", icon: "🌍", fx: "nature" }, gold: 550, xp: 320 },
  { name: "Nihiloth the Void Dragon", element: "shadow", level: 20, hp: 600, atk: 25, def: 18, spd: 15, mana: 200, sig: { name: "Void Collapse", dmg: 75, cost: 50, type: "attack", icon: "🕳️", fx: "shadow" }, gold: 800, xp: 500 },
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
];

// ─── ENEMY NAMES ───
const ENEMY_NAMES = ["Drakon", "Wyrmtail", "Scalefang", "Emberclaw", "Frostmaw", "Thunderwing", "Thornback", "Nightshade", "Ashfury", "Glacius", "Stormcrest", "Venomtooth"];

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

// ─── BATTLE LOG ───
function BattleLog({ log }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [log]);
  return (
    <div ref={ref} style={{ background: "#0a0a0a", border: "1px solid #222", borderRadius: 6, padding: 8, maxHeight: 100, overflowY: "auto", marginTop: 8 }}>
      {log.map((l, i) => (
        <div key={i} style={{ fontSize: 10, color: l.color || "#888", marginBottom: 2, fontFamily: "'Fira Code',monospace" }}>
          {l.icon && <span style={{ marginRight: 4 }}>{l.icon}</span>}{l.text}
        </div>
      ))}
      {log.length === 0 && <div style={{ fontSize: 10, color: "#444" }}>Battle begins...</div>}
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
    setIsPlayerTurn(false);
    setParticles({ fx: ability.fx || null, side: "enemy" });
    setTimeout(() => setParticles(null), 800);

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
      if (e.isBoss) setBossesDefeated(prev => [...prev, e.name]);
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

    // Enemy turn
    setTimeout(() => {
      const eAbilities = e.abilities.filter(a => e.mana >= a.cost);
      const eAb = eAbilities.length > 0 ? pick(eAbilities) : { name: "Rest", dmg: 0, cost: 0, type: "rest", value: 10, manaValue: 12, icon: "💤", fx: "heal" };
      setParticles({ fx: eAb.fx || null, side: "player" });
      setTimeout(() => setParticles(null), 800);

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
    setPoison({ player: 0, enemy: 0 }); setScreen("battle");
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

  // ─── TITLE ───
  if (screen === "title") return (
    <div style={{ ...pg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <style>{css}</style>
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
          <DragonSprite element={createElement} size={100} color={previewColor} animate />
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
          <DragonSprite element={dragon.element} size={90} color={dragon.customColor} stage={dragon.stage} animate />
          <h2 style={{ fontSize: 16, color: pEl.color, marginTop: 6 }}>{dragon.name} {dragon.title}</h2>
          <div style={{ fontSize: 10, color: "#888", fontFamily: "'Fira Code',monospace" }}>
            {pEl.emoji} {pEl.name} {evo.stage} · Lv.{dragon.level}
          </div>
          <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 8, fontSize: 10, color: "#aaa", fontFamily: "'Fira Code',monospace" }}>
            <span>⚔{dragon.attack}</span><span>🛡{dragon.defense}</span><span>💨{dragon.speed}</span>
            <span>❤️{dragon.maxHp}</span><span>💎{dragon.maxMana}</span>
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: "#ffcc44", fontFamily: "'Fira Code',monospace" }}>
            💰 {gold}g · ⭐ {xp}/{xpNeeded} XP
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #222", marginBottom: 10 }}>
          {["stats", "shop", "tech", "bosses"].map(t => (
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
              {[["attack", "⚔ Attack"], ["defense", "🛡 Defense"], ["speed", "💨 Speed"], ["maxHp", "❤️ Vitality"], ["maxMana", "💎 Arcane Study"]].map(([s, l]) => (
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
                    <span style={{ fontSize: 12 }}>{item.icon}</span>
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
          <div style={{ display: "grid", gap: 6 }}>
            {TECHNIQUES.map(tech => {
              const learned = techniques.includes(tech.name);
              const canLearn = gold >= tech.price && dragon.level >= tech.req && !learned;
              return (
                <button key={tech.name} className="btn" onClick={() => learnTech(tech)} disabled={!canLearn} style={{
                  padding: "8px 10px", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center",
                  borderColor: learned ? "#44dd6644" : canLearn ? "#ff884444" : "#333",
                }}>
                  <div>
                    <span style={{ fontSize: 12 }}>{tech.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, marginLeft: 6, color: learned ? "#44dd66" : "#eee" }}>{tech.name}</span>
                    <span style={{ fontSize: 9, color: "#888", marginLeft: 6 }}>{tech.desc} · {tech.dmg > 0 ? `${tech.dmg}dmg ` : ""}{tech.cost}mp · Req Lv.{tech.req}</span>
                  </div>
                  <span style={{ fontSize: 10, color: learned ? "#44dd66" : "#ffcc44", fontFamily: "'Fira Code',monospace" }}>
                    {learned ? "✓" : `${tech.price}g`}
                  </span>
                </button>
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

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button className="btn btn-primary" onClick={() => startBattle()} style={{ flex: 1, padding: "12px", fontSize: 13, letterSpacing: 1 }}>⚔️ BATTLE</button>
          {availBosses.length > 0 && (
            <button className="btn btn-boss" onClick={() => { const bi = BOSSES.indexOf(availBosses[0]); startBattle(bi); }} style={{ flex: 1, padding: "12px", fontSize: 11, letterSpacing: 1 }}>
              💀 BOSS: {availBosses[0].name.split(" ")[0]}
            </button>
          )}
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
          background: arena.bg, borderRadius: 10, border: "1px solid #222",
          padding: 12, marginBottom: 10, position: "relative", minHeight: 180, overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: 4, left: 0, right: 0, textAlign: "center", fontSize: 9, color: "#555", letterSpacing: 2, fontFamily: "'Fira Code',monospace" }}>{arena.name}</div>

          {/* Ground line */}
          <div style={{ position: "absolute", bottom: 20, left: 0, right: 0, height: 2, background: `${arena.ground}44` }} />

          {/* Dragons */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingTop: 20 }}>
            <div style={{ textAlign: "center" }}>
              <DragonSprite element={dragon.element} size={70} color={dragon.customColor} stage={dragon.stage} animate />
              <div style={{ fontSize: 9, color: pEl.color, fontWeight: 700, fontFamily: "'Fira Code',monospace" }}>
                {dragon.name} Lv.{dragon.level}
              </div>
            </div>
            <div style={{ fontSize: 20, color: "#444", alignSelf: "center" }}>⚔</div>
            <div style={{ textAlign: "center" }}>
              <DragonSprite element={enemy.element} size={70} flip animate />
              <div style={{ fontSize: 9, color: eEl.color, fontWeight: 700, fontFamily: "'Fira Code',monospace" }}>
                {enemy.name} Lv.{enemy.level} {enemy.isBoss && "💀"}
              </div>
            </div>
          </div>

          {/* Float texts & particles */}
          <FloatText texts={floatTexts} />
          {particles && <SpellParticles fx={particles.fx} side={particles.side} />}
        </div>

        {/* Status bars */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8 }}>
          <div>
            <HealthBar current={dragon.hp} max={dragon.maxHp} color="#44dd66" label="HP" height={10} />
            <HealthBar current={dragon.mana} max={dragon.maxMana} color="#4488ff" label="MP" height={8} />
          </div>
          <div>
            <HealthBar current={enemy.hp} max={enemy.maxHp} color="#dd4444" label="HP" height={10} />
            <HealthBar current={enemy.mana} max={enemy.maxMana} color="#8844aa" label="MP" height={8} />
          </div>
        </div>

        {/* Turn indicator */}
        {!battleOver && (
          <div style={{ textAlign: "center", fontSize: 10, color: isPlayerTurn ? "#44dd66" : "#dd6644", marginBottom: 6, fontFamily: "'Fira Code',monospace" }}>
            {isPlayerTurn ? "▶ YOUR TURN" : "⏳ ENEMY TURN..."}
          </div>
        )}

        {/* Battle log */}
        <BattleLog log={battleLog} />

        {/* Abilities */}
        {!battleOver && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, marginTop: 8 }}>
            {allAbilities.map((a, i) => (
              <button key={i} className="btn" onClick={() => playerAction(a)} disabled={!isPlayerTurn || dragon.mana < a.cost} style={{
                textAlign: "left", padding: "6px 8px",
                borderColor: isPlayerTurn && dragon.mana >= a.cost ? pEl.color + "88" : "#333",
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: isPlayerTurn && dragon.mana >= a.cost ? "#eee" : "#555" }}>{a.icon || "🔮"} {a.name}</div>
                <div style={{ fontSize: 8, color: "#777", fontFamily: "'Fira Code',monospace" }}>{a.dmg > 0 ? `${a.dmg}dmg ` : ""}{a.cost}mp</div>
              </button>
            ))}
            <button className="btn" onClick={() => playerAction({ name: "Rest", dmg: 0, cost: 0, type: "rest", value: 10, manaValue: 12, icon: "💤", fx: "heal" })} disabled={!isPlayerTurn} style={{ gridColumn: "1/-1", textAlign: "center", padding: "4px" }}>
              <span style={{ fontSize: 9 }}>💤 Rest (+10 HP, +12 MP)</span>
            </button>
            <button className="btn" onClick={() => playerAction({ name: "Focus", dmg: 0, cost: 0, type: "focus", manaValue: 25, icon: "🧘", fx: "buff" })} disabled={!isPlayerTurn} style={{ gridColumn: "1/-1", textAlign: "center", padding: "4px" }}>
              <span style={{ fontSize: 9 }}>🧘 Focus (+25 MP)</span>
            </button>
          </div>
        )}

        {battleOver && (
          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
            <button className="btn btn-primary" onClick={() => startBattle()} style={{ flex: 1, fontSize: 12 }}>⚔️ FIGHT AGAIN</button>
            <button className="btn" onClick={() => setScreen("hub")} style={{ flex: 1, fontSize: 12 }}>🏠 RETURN</button>
          </div>
        )}
      </div>
    );
  }

  return null;
}
