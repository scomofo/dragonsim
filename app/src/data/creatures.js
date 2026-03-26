// ─── BODY TYPES ───
export const BODY_TYPES = [
  { id: "serpent",  name: "Serpentine", desc: "+Speed",        statMod: { speed: 3 } },
  { id: "tank",     name: "Hulking",    desc: "+Defense, +HP", statMod: { defense: 3, maxHp: 20 } },
  { id: "balanced", name: "Balanced",   desc: "All-round",    statMod: {} },
  { id: "wyvern",   name: "Wyvern",     desc: "+Attack",      statMod: { attack: 3 } },
  { id: "mystic",   name: "Mystic",     desc: "+Mana",        statMod: { maxMana: 20 } },
];

// ─── TITLES ───
export const TITLES = ["", "the Fierce", "the Mighty", "Dragonborn", "Flamecaller", "Stormbringer", "the Ancient", "Worldeater", "the Unyielding", "Shadowbane", "Skyscourge"];

// ─── EVOLUTION STAGES ───
export const EVOLUTIONS = [
  { stage: "Hatchling", level: 1,  desc: "A young dragon",       bonus: { attack: 0,  defense: 0,  speed: 0, maxHp: 0,   maxMana: 0 } },
  { stage: "Juvenile",  level: 5,  desc: "Growing stronger",     bonus: { attack: 3,  defense: 2,  speed: 2, maxHp: 20,  maxMana: 15 } },
  { stage: "Adult",     level: 10, desc: "A formidable beast",   bonus: { attack: 5,  defense: 4,  speed: 3, maxHp: 40,  maxMana: 25 } },
  { stage: "Elder",     level: 15, desc: "Ancient and powerful",  bonus: { attack: 8,  defense: 6,  speed: 5, maxHp: 60,  maxMana: 40 } },
  { stage: "Mythic",    level: 20, desc: "Legendary dragon",      bonus: { attack: 12, defense: 10, speed: 8, maxHp: 100, maxMana: 60 } },
];

// ─── ENEMY NAMES ───
export const ENEMY_NAMES = ["Drakon", "Wyrmtail", "Scalefang", "Emberclaw", "Frostmaw", "Thunderwing", "Thornback", "Nightshade", "Ashfury", "Glacius", "Stormcrest", "Venomtooth"];

// ─── WORLD BOSS ───
export const WORLD_BOSS = { name: "THE_SINGULARITY", maxHp: 50000 };

// ─── BOSSES ───
export const BOSSES = [
  { name: "Infernax the World Burner", element: "fire",      level: 5,  hp: 200, atk: 14, def: 8,  spd: 10, mana: 100, sig: { name: "World Fire",     dmg: 40, cost: 30, type: "attack", icon: "\u{1F30B}",        fx: "fire" },      gold: 150, xp: 80 },
  { name: "Glaciara the Frozen Queen", element: "ice",       level: 8,  hp: 280, atk: 16, def: 12, spd: 9,  mana: 120, sig: { name: "Absolute Zero",   dmg: 50, cost: 35, type: "attack", icon: "\u{1F9CA}",        fx: "ice" },       gold: 250, xp: 140 },
  { name: "Voltharion the Storm King", element: "lightning",  level: 12, hp: 350, atk: 20, def: 10, spd: 18, mana: 140, sig: { name: "Judgement Bolt",   dmg: 60, cost: 40, type: "attack", icon: "\u26A1",            fx: "lightning" }, gold: 400, xp: 220 },
  { name: "Yggdraxis the Ancient Root", element: "nature",   level: 16, hp: 450, atk: 18, def: 22, spd: 7,  mana: 160, sig: { name: "Nature's Wrath",   dmg: 55, cost: 35, type: "attack", icon: "\u{1F30D}",        fx: "nature" },    gold: 550, xp: 320 },
  { name: "Nihiloth the Void Dragon",  element: "shadow",    level: 20, hp: 600, atk: 25, def: 18, spd: 15, mana: 200, sig: { name: "Void Collapse",    dmg: 75, cost: 50, type: "attack", icon: "\u{1F573}\uFE0F", fx: "shadow" },    gold: 800, xp: 500 },
];

// ─── CORRUPTED BESTIARY (Singularity NPCs) ───
export const CORRUPTED_NPCS = [
  { name: "Bit-Wraith",         element: "shadow",    emoji: "\u{1F47B}", level: 3,  hp: 80,  atk: 12, def: 4,  spd: 16, mana: 80,
    sig: { name: "Data Leak",   dmg: 15, cost: 10, type: "poison", turns: 3, icon: "\u{1F4BE}", fx: "shadow" }, gold: 40, xp: 25,
    sprite: "/sprites/npc/bit_wraith_sprites.png", filter: "hue-rotate(120deg) contrast(1.4) brightness(0.8)", desc: "Uninstalls your data" },
  { name: "Recursive Golem",    element: "stone",     emoji: "\u{1F9F1}", level: 6,  hp: 180, atk: 10, def: 20, spd: 4,  mana: 60,
    sig: { name: "Stack Overflow", dmg: 25, cost: 15, type: "attack", icon: "\u{1F4A5}", fx: "stone" }, gold: 80, xp: 50,
    sprite: "/sprites/npc/recursive_golem_sprites.png", filter: "hue-rotate(200deg) contrast(1.3)", desc: "Splits when destroyed" },
  { name: "Thermal Overloader",  element: "fire",      emoji: "\u{1F441}\uFE0F", level: 8,  hp: 150, atk: 22, def: 6,  spd: 8,  mana: 100,
    sig: { name: "System Purge", dmg: 45, cost: 25, type: "attack", icon: "\u{1F525}", fx: "fire" }, gold: 120, xp: 70,
    sprite: "/sprites/npc/thermal_overloader_sprites.png", filter: "hue-rotate(30deg) contrast(1.5) saturate(1.5)", desc: "Overheats and explodes" },
  { name: "Logic Bomb",         element: "lightning",  emoji: "\u{1F4A3}", level: 10, hp: 120, atk: 0,  def: 15, spd: 1,  mana: 50,
    sig: { name: "Countdown",   dmg: 0,  cost: 0,  type: "buff", value: 5, icon: "\u23F0", fx: "lightning" }, gold: 200, xp: 100,
    sprite: "/sprites/npc/logic_bomb_sprites.png", filter: "hue-rotate(60deg) contrast(1.6) brightness(1.2)", desc: "5 turns or it detonates" },
  { name: "Glitch-Hydra",       element: "nature",    emoji: "\u{1F40D}", level: 12, hp: 250, atk: 16, def: 10, spd: 12, mana: 120,
    sig: { name: "Triple Fault", dmg: 18, cost: 20, type: "multi", hits: 3, icon: "\u{1F40D}", fx: "nature" }, gold: 180, xp: 110,
    sprite: "/sprites/npc/glitch_hydra_sprites.png", filter: "hue-rotate(90deg) contrast(1.4) saturate(2)", desc: "Three heads, three errors" },
  { name: "Crypto-Crab",        element: "ice",       emoji: "\u{1F980}", level: 14, hp: 300, atk: 14, def: 25, spd: 5,  mana: 80,
    sig: { name: "Brute Force",  dmg: 35, cost: 20, type: "attack", icon: "\u{1F510}", fx: "ice" }, gold: 220, xp: 130,
    sprite: "/sprites/npc/crypto_crab_sprites.png", filter: "hue-rotate(180deg) contrast(1.3) brightness(0.9)", desc: "256-bit encrypted shell" },
  { name: "Protocol Vulture",   element: "shadow",    emoji: "\u{1F985}", level: 16, hp: 200, atk: 20, def: 8,  spd: 20, mana: 100,
    sig: { name: "Downgrade Strike", dmg: 30, cost: 15, type: "attack", icon: "\u2B07\uFE0F", fx: "shadow" }, gold: 260, xp: 150,
    sprite: "/sprites/npc/protocol_vulture_sprites.png", filter: "hue-rotate(270deg) contrast(1.5)", desc: "Feeds on experience" },
  { name: "Phishing Siren",     element: "nature",    emoji: "\u{1F9DC}", level: 18, hp: 220, atk: 18, def: 10, spd: 22, mana: 140,
    sig: { name: "Confusion.exe", dmg: 20, cost: 20, type: "poison", turns: 3, icon: "\u{1F48E}", fx: "nature" }, gold: 300, xp: 180,
    sprite: "/sprites/npc/phishing_siren_sprites.png", filter: "hue-rotate(330deg) contrast(1.2) saturate(1.8)", desc: "Beauty masks a virus" },
  { name: "Buffer Overflow",    element: "fire",      emoji: "\u{1F30B}", level: 20, hp: 400, atk: 12, def: 6,  spd: 8,  mana: 200,
    sig: { name: "Memory Flood", dmg: 50, cost: 30, type: "attack", icon: "\u{1F4A7}", fx: "fire" }, gold: 400, xp: 250,
    sprite: "/sprites/npc/buffer_overflow_sprites.png", filter: "hue-rotate(10deg) contrast(2) saturate(2) brightness(1.3)", desc: "Grows every turn" },
  { name: "Firewall Sentinel",  element: "lightning",  emoji: "\u{1F6E1}\uFE0F", level: 22, hp: 500, atk: 22, def: 30, spd: 10, mana: 160,
    sig: { name: "Hard-Coded Defense", dmg: 40, cost: 25, type: "attack", icon: "\u{1F6AB}", fx: "lightning" }, gold: 500, xp: 350,
    sprite: "/sprites/npc/firewall_sentinel_sprites.png", filter: "hue-rotate(45deg) contrast(1.8) brightness(1.1)", desc: "The final gatekeeper" },
];
