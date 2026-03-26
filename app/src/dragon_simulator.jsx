import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════
// DRAGON FORGE — Full Feature Dragon Simulator
// Build · Splice · Evolve · Battle · Conquer
// Cyber-Retro Aesthetic · Arena Image Backgrounds · Professor Felix
// ═══════════════════════════════════════════════════════════════

// ─── XBOX / USB GAMEPAD SUPPORT ───
// Standard Gamepad API mapping (Xbox One / Xbox Series controllers):
//   Button 0 = A      Button 1 = B      Button 2 = X      Button 3 = Y
//   Button 4 = LB     Button 5 = RB     Button 6 = LT     Button 7 = RT
//   Button 8 = Back   Button 9 = Start  Button 12 = DPad Up
//   Button 13 = DPad Down  Button 14 = DPad Left  Button 15 = DPad Right
//   Axes 0/1 = Left Stick  Axes 2/3 = Right Stick
const GP = { A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7, BACK: 8, START: 9,
             UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15 };

function useGamepad(callback) {
  const cbRef = useRef(callback);
  cbRef.current = callback;
  const prevRef = useRef({});

  useEffect(() => {
    let raf;
    const poll = () => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      for (const gp of gamepads) {
        if (!gp) continue;
        const prev = prevRef.current[gp.index] || {};
        const pressed = {};
        // Detect button presses (rising edge only — not held)
        for (let i = 0; i < gp.buttons.length; i++) {
          const btn = gp.buttons[i];
          const isDown = typeof btn === "object" ? btn.pressed : btn > 0.5;
          if (isDown && !prev[i]) pressed[i] = true;
        }
        // Left stick as d-pad (with deadzone)
        const lx = gp.axes[0] || 0, ly = gp.axes[1] || 0;
        const plx = prev.lx || 0, ply = prev.ly || 0;
        if (lx < -0.5 && plx >= -0.5) pressed[GP.LEFT] = true;
        if (lx > 0.5 && plx <= 0.5) pressed[GP.RIGHT] = true;
        if (ly < -0.5 && ply >= -0.5) pressed[GP.UP] = true;
        if (ly > 0.5 && ply <= 0.5) pressed[GP.DOWN] = true;

        // Store current state
        const state = {};
        for (let i = 0; i < gp.buttons.length; i++) {
          const btn = gp.buttons[i];
          state[i] = typeof btn === "object" ? btn.pressed : btn > 0.5;
        }
        state.lx = lx; state.ly = ly;
        prevRef.current[gp.index] = state;

        // Fire callback for any pressed buttons
        const keys = Object.keys(pressed);
        if (keys.length > 0) cbRef.current(keys.map(Number));
      }
      raf = requestAnimationFrame(poll);
    };
    raf = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(raf);
  }, []);
}

const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = (arr) => arr[rand(0, arr.length - 1)];

// ─── AUDIO ENGINE ───
// Drop .wav files into /public/audio/ matching these names and they auto-play.
// No files = no errors, just silence.
const SFX = {
  // System
  boot:          "/audio/sys_boot_resonant.wav",
  textBlip:      "/audio/sys_text_blip.wav",
  confirm:       "/audio/ui_select_ping.wav",
  error:         "/audio/ui_denied_buzz.wav",
  // Hatchery
  hatchStart:    "/audio/hatch_molecular_hum.wav",
  hatchSuccess:  "/audio/hatch_complete_chime.wav",
  shinyAlert:    "/audio/hatch_shiny_sting.wav",
  // Evolution
  evolve:        "/audio/forge_energy_surge.wav",
  ultraShiny:    "/audio/forge_quantum_break.wav",
  // Combat attacks
  atkFire:       "/audio/atk_fire_slash.wav",
  atkLightning:  "/audio/atk_static_discharge.wav",
  atkIce:        "/audio/atk_glacier_crack.wav",
  atkGeneric:    "/audio/atk_fire_slash.wav",
  critHit:       "/audio/hit_crit_thud.wav",
  npcDeath:      "/audio/mob_decompile.wav",
  // Boss
  bossRoar:      "/audio/boss_void_glitch.wav",
  bossPulse:     "/audio/boss_low_heartbeat.wav",
};

// Element-to-attack-sound mapping
const ATK_SFX = {
  fire: SFX.atkFire, ice: SFX.atkIce, lightning: SFX.atkLightning,
  nature: SFX.atkGeneric, shadow: SFX.atkGeneric, stone: SFX.atkGeneric,
};

const _audioCache = {};
function playSound(key, opts = {}) {
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

// ─── ELEMENTAL MATRIX (Master Specs) ───
// 6 core elements with strengths/weaknesses per spec + void endgame
const ELEMENTS = {
  fire:      { name: "Magma",   emoji: "\u{1F525}", color: "#ff4422", accent: "#ff8844", bg: "#331108", weakness: "ice",       strong: ["ice", "stone"],         arena: "/arenas/fire.png" },
  ice:       { name: "Ice",     emoji: "\u2744\uFE0F",  color: "#44bbff", accent: "#88ddff", bg: "#081828", weakness: "fire",      strong: ["venom", "lightning"],    arena: "/arenas/ice.png" },
  lightning: { name: "Static",  emoji: "\u26A1",    color: "#ffdd00", accent: "#ffee66", bg: "#282008", weakness: "stone",     strong: ["fire", "venom"],         arena: "/arenas/storm.png" },
  nature:    { name: "Venom",   emoji: "\u{1F40D}", color: "#76ff03", accent: "#88ff99", bg: "#082810", weakness: "lightning", strong: ["shadow", "lightning"],   arena: "/arenas/venom.png" },
  shadow:    { name: "Shadow",  emoji: "\u{1F311}", color: "#9944ff", accent: "#bb88ff", bg: "#180828", weakness: "nature",    strong: ["lightning", "stone"],     arena: "/arenas/shadow.png" },
  stone:     { name: "Stone",   emoji: "\u{1FAA8}", color: "#a1887f", accent: "#bcaaa4", bg: "#1a1008", weakness: "fire",      strong: ["lightning", "ice"],       arena: "/arenas/stone.png" },
};

// Void element for endgame
const VOID_ELEMENT = { name: "Void", emoji: "\u{1F47E}", color: "#ffffff", accent: "#cccccc", bg: "#000000", arena: "/arenas/shadow.png" };
const BONUS_ARENAS = ["/arenas/quantum_forge.png", "/arenas/asteroid_field.png", "/arenas/gravity_chamber.png"];

// ─── BODY TYPES ───
const BODY_TYPES = [
  { id: "serpent",  name: "Serpentine", desc: "+Speed",        statMod: { speed: 3 } },
  { id: "tank",     name: "Hulking",    desc: "+Defense, +HP", statMod: { defense: 3, maxHp: 20 } },
  { id: "balanced", name: "Balanced",   desc: "All-round",    statMod: {} },
  { id: "wyvern",   name: "Wyvern",     desc: "+Attack",      statMod: { attack: 3 } },
  { id: "mystic",   name: "Mystic",     desc: "+Mana",        statMod: { maxMana: 20 } },
];

// ─── TITLES ───
const TITLES = ["", "the Fierce", "the Mighty", "Dragonborn", "Flamecaller", "Stormbringer", "the Ancient", "Worldeater", "the Unyielding", "Shadowbane", "Skyscourge"];

// ─── ABILITIES ───
const ABILITIES = {
  fire: [
    { name: "Magma Bolt", dmg: 18, cost: 15, type: "attack", icon: "\u{1F525}", fx: "fire", desc: "Hurl a blazing fireball" },
    { name: "Inferno", dmg: 30, cost: 28, type: "attack", icon: "\u{1F30B}", fx: "fire", desc: "Unleash a firestorm" },
    { name: "Flame Shield", dmg: 0, cost: 12, type: "buff", value: 3, icon: "\u{1F6E1}\uFE0F", fx: "buff", desc: "+3 DEF this fight" },
    { name: "Searing Drain", dmg: 14, cost: 18, type: "drain", healPct: 0.4, icon: "\u{1F480}", fx: "fire", desc: "Drain life from foe" },
  ],
  ice: [
    { name: "Frost Bolt", dmg: 16, cost: 13, type: "attack", icon: "\u2744\uFE0F", fx: "ice", desc: "Launch a bolt of ice" },
    { name: "Blizzard", dmg: 28, cost: 26, type: "attack", icon: "\u{1F328}\uFE0F", fx: "ice", desc: "Summon a blizzard" },
    { name: "Ice Armor", dmg: 0, cost: 14, type: "buff", value: 4, icon: "\u{1F9CA}", fx: "buff", desc: "+4 DEF this fight" },
    { name: "Glacial Heal", dmg: 0, cost: 20, type: "heal", value: 25, icon: "\u{1F48E}", fx: "heal", desc: "Restore 25 HP" },
  ],
  lightning: [
    { name: "Static Spark", dmg: 14, cost: 10, type: "attack", icon: "\u26A1", fx: "lightning", desc: "Quick lightning strike" },
    { name: "Thunder Crash", dmg: 32, cost: 30, type: "attack", icon: "\u{1F329}\uFE0F", fx: "lightning", desc: "Devastating thunder" },
    { name: "Static Charge", dmg: 0, cost: 12, type: "buff", value: 3, icon: "\u{1F4AB}", fx: "buff", desc: "+3 ATK this fight" },
    { name: "Chain Lightning", dmg: 20, cost: 22, type: "attack", icon: "\u{1F517}", fx: "lightning", desc: "Chaining shock" },
  ],
  nature: [
    { name: "Venom Spit", dmg: 15, cost: 12, type: "attack", icon: "\u{1F40D}", fx: "nature", desc: "Spit corrosive venom" },
    { name: "Toxic Quake", dmg: 26, cost: 25, type: "attack", icon: "\u{1F30D}", fx: "nature", desc: "Shake the ground" },
    { name: "Regenerate", dmg: 0, cost: 18, type: "heal", value: 30, icon: "\u{1F331}", fx: "heal", desc: "Restore 30 HP" },
    { name: "Thorn Armor", dmg: 0, cost: 14, type: "buff", value: 4, icon: "\u{1F335}", fx: "buff", desc: "+4 DEF this fight" },
  ],
  shadow: [
    { name: "Shadow Bolt", dmg: 17, cost: 14, type: "attack", icon: "\u{1F311}", fx: "shadow", desc: "Dark energy blast" },
    { name: "Void Rend", dmg: 34, cost: 32, type: "attack", icon: "\u{1F573}\uFE0F", fx: "shadow", desc: "Tear through reality" },
    { name: "Dark Pact", dmg: 0, cost: 10, type: "buff", value: 4, icon: "\u{1F4FF}", fx: "buff", desc: "+4 ATK this fight" },
    { name: "Soul Siphon", dmg: 16, cost: 20, type: "drain", healPct: 0.5, icon: "\u{1F441}\uFE0F", fx: "shadow", desc: "Steal life force" },
  ],
  stone: [
    { name: "Rock Hurl", dmg: 16, cost: 13, type: "attack", icon: "\u{1FAA8}", fx: "stone", desc: "Launch a boulder" },
    { name: "Avalanche", dmg: 29, cost: 27, type: "attack", icon: "\u{1F3D4}\uFE0F", fx: "stone", desc: "Crush with rocks" },
    { name: "Stone Skin", dmg: 0, cost: 12, type: "buff", value: 5, icon: "\u{1F6E1}\uFE0F", fx: "buff", desc: "+5 DEF this fight" },
    { name: "Earth Mend", dmg: 0, cost: 18, type: "heal", value: 28, icon: "\u{1F33F}", fx: "heal", desc: "Restore 28 HP" },
  ],
};

// ─── SHOP ITEMS ───
const SHOP_ITEMS = [
  { name: "Iron Claws",      cost: 50,  stat: "attack",  value: 2,  icon: "\u{1F5E1}\uFE0F", desc: "+2 ATK", req: 1 },
  { name: "Razorfang",       cost: 120, stat: "attack",  value: 4,  icon: "\u2694\uFE0F",     desc: "+4 ATK", req: 5 },
  { name: "Scale Mail",      cost: 60,  stat: "defense", value: 2,  icon: "\u{1F6E1}\uFE0F",  desc: "+2 DEF", req: 1 },
  { name: "Obsidian Plate",  cost: 150, stat: "defense", value: 5,  icon: "\u{1FAA8}",        desc: "+5 DEF", req: 7 },
  { name: "Swift Boots",     cost: 70,  stat: "speed",   value: 3,  icon: "\u{1F462}",        desc: "+3 SPD", req: 3 },
  { name: "Amulet of Life",  cost: 100, stat: "maxHp",   value: 20, icon: "\u{1F49A}",        desc: "+20 HP", req: 4 },
  { name: "Mana Crystal",    cost: 90,  stat: "maxMana", value: 15, icon: "\u{1F48E}",        desc: "+15 MP", req: 3 },
  { name: "Crown of Elements", cost: 200, stat: "attack", value: 6, icon: "\u{1F451}",        desc: "+6 ATK", req: 10 },
  { name: "Dragon Heart",    cost: 250, stat: "maxHp",   value: 40, icon: "\u2764\uFE0F\u200D\u{1F525}", desc: "+40 HP", req: 12 },
  { name: "Arcane Orb",      cost: 180, stat: "maxMana", value: 25, icon: "\u{1F52E}",        desc: "+25 MP", req: 8 },
];

// ─── TECHNIQUES ───
const TECHNIQUES = [
  { name: "Tail Cleave",   dmg: 22, cost: 16, type: "attack", icon: "\u{1F98E}", fx: "fire",    desc: "Sweep with tail",    req: 3,  price: 80 },
  { name: "Frenzy",        dmg: 10, cost: 22, type: "multi", hits: 3, icon: "\u{1F4A2}", fx: "fire", desc: "3-hit combo",   req: 6,  price: 150 },
  { name: "Venom Bite",    dmg: 12, cost: 15, type: "poison", dot: 5, turns: 3, icon: "\u{1F40D}", fx: "nature", desc: "Poison for 3 turns", req: 4, price: 100 },
  { name: "Battle Roar",   dmg: 0,  cost: 18, type: "roar", atkVal: 3, defVal: 2, icon: "\u{1F981}", fx: "buff", desc: "+3 ATK +2 DEF", req: 5, price: 120 },
  { name: "Life Steal",    dmg: 20, cost: 22, type: "drain", healPct: 0.5, icon: "\u{1F9DB}", fx: "shadow", desc: "Steal 50% as HP", req: 7, price: 160 },
  { name: "Dragon Breath", dmg: 35, cost: 35, type: "attack", icon: "\u{1F409}", fx: "fire",    desc: "Devastating breath", req: 9,  price: 200 },
  { name: "Iron Scales",   dmg: 0,  cost: 15, type: "buff", value: 6, icon: "\u{1FAA8}", fx: "buff", desc: "+6 DEF this fight", req: 8, price: 140 },
  { name: "War Cry",       dmg: 0,  cost: 12, type: "buff", value: 5, icon: "\u{1F4EF}", fx: "buff", desc: "+5 ATK this fight", req: 6, price: 130 },
  { name: "Meteor Strike",  dmg: 45, cost: 45, type: "attack", icon: "\u2604\uFE0F", fx: "fire", desc: "Call down a meteor", req: 14, price: 350 },
  { name: "Healing Surge",  dmg: 0,  cost: 25, type: "heal", value: 40, icon: "\u2728", fx: "heal", desc: "Restore 40 HP",   req: 10, price: 220 },
];

// ─── BOSSES ───
const BOSSES = [
  { name: "Infernax the World Burner", element: "fire",      level: 5,  hp: 200, atk: 14, def: 8,  spd: 10, mana: 100, sig: { name: "World Fire",     dmg: 40, cost: 30, type: "attack", icon: "\u{1F30B}",        fx: "fire" },      gold: 150, xp: 80 },
  { name: "Glaciara the Frozen Queen", element: "ice",       level: 8,  hp: 280, atk: 16, def: 12, spd: 9,  mana: 120, sig: { name: "Absolute Zero",   dmg: 50, cost: 35, type: "attack", icon: "\u{1F9CA}",        fx: "ice" },       gold: 250, xp: 140 },
  { name: "Voltharion the Storm King", element: "lightning",  level: 12, hp: 350, atk: 20, def: 10, spd: 18, mana: 140, sig: { name: "Judgement Bolt",   dmg: 60, cost: 40, type: "attack", icon: "\u26A1",            fx: "lightning" }, gold: 400, xp: 220 },
  { name: "Yggdraxis the Ancient Root", element: "nature",   level: 16, hp: 450, atk: 18, def: 22, spd: 7,  mana: 160, sig: { name: "Nature's Wrath",   dmg: 55, cost: 35, type: "attack", icon: "\u{1F30D}",        fx: "nature" },    gold: 550, xp: 320 },
  { name: "Nihiloth the Void Dragon",  element: "shadow",    level: 20, hp: 600, atk: 25, def: 18, spd: 15, mana: 200, sig: { name: "Void Collapse",    dmg: 75, cost: 50, type: "attack", icon: "\u{1F573}\uFE0F", fx: "shadow" },    gold: 800, xp: 500 },
];

// ─── WORLD BOSS ───
const WORLD_BOSS = { name: "THE_SINGULARITY", maxHp: 50000 };

// ─── EVOLUTION STAGES ───
const EVOLUTIONS = [
  { stage: "Hatchling", level: 1,  desc: "A young dragon",       bonus: { attack: 0,  defense: 0,  speed: 0, maxHp: 0,   maxMana: 0 } },
  { stage: "Juvenile",  level: 5,  desc: "Growing stronger",     bonus: { attack: 3,  defense: 2,  speed: 2, maxHp: 20,  maxMana: 15 } },
  { stage: "Adult",     level: 10, desc: "A formidable beast",   bonus: { attack: 5,  defense: 4,  speed: 3, maxHp: 40,  maxMana: 25 } },
  { stage: "Elder",     level: 15, desc: "Ancient and powerful",  bonus: { attack: 8,  defense: 6,  speed: 5, maxHp: 60,  maxMana: 40 } },
  { stage: "Mythic",    level: 20, desc: "Legendary dragon",      bonus: { attack: 12, defense: 10, speed: 8, maxHp: 100, maxMana: 60 } },
];

// ─── ENEMY NAMES ───
const ENEMY_NAMES = ["Drakon", "Wyrmtail", "Scalefang", "Emberclaw", "Frostmaw", "Thunderwing", "Thornback", "Nightshade", "Ashfury", "Glacius", "Stormcrest", "Venomtooth"];

// ─── WEATHER SYSTEM (SNES-Style) ───
const WEATHER_TYPES = {
  clear:       { name: "Clear",        emoji: "\u2600\uFE0F", desc: "Normal conditions", buffs: {}, debuffs: {} },
  thunderstorm:{ name: "Thunderstorm", emoji: "\u26C8\uFE0F", desc: "Lightning cracks the sky", buffs: { lightning: 1.25, ice: 1.15 }, debuffs: { fire: 0.8 } },
  downpour:    { name: "Downpour",     emoji: "\u{1F327}\uFE0F", desc: "Torrential rain floods the arena", buffs: { ice: 1.3, nature: 1.15 }, debuffs: { fire: 0.7, lightning: 0.85 } },
  heatwave:    { name: "Heat Wave",    emoji: "\u{1F525}", desc: "Scorching temperatures", buffs: { fire: 1.3, stone: 1.1 }, debuffs: { ice: 0.7, nature: 0.85 } },
  voidstorm:   { name: "Void Storm",   emoji: "\u{1F30C}", desc: "Reality destabilizes", buffs: { shadow: 1.3 }, debuffs: { stone: 0.8, nature: 0.8 } },
  sandstorm:   { name: "Sandstorm",    emoji: "\u{1F32A}\uFE0F", desc: "Blinding winds carry stone shards", buffs: { stone: 1.3, fire: 1.1 }, debuffs: { lightning: 0.8, shadow: 0.85 } },
};
const WEATHER_KEYS = Object.keys(WEATHER_TYPES).filter(k => k !== "clear");

function WeatherOverlay({ weather, lightning }) {
  if (weather === "clear") return null;

  const isRain = weather === "thunderstorm" || weather === "downpour";
  const isSand = weather === "sandstorm";
  const isVoid = weather === "voidstorm";
  const isHeat = weather === "heatwave";

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 8, overflow: "hidden" }}>
      {/* Lightning flash */}
      {lightning && <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.7)", zIndex: 10 }} />}

      {/* Rain layers (Super Metroid / DKC style) */}
      {isRain && <>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "repeating-linear-gradient(100deg, transparent, transparent 4px, rgba(180,210,255,0.15) 4px, rgba(180,210,255,0.15) 5px)",
          backgroundSize: "8px 30px",
          animation: "weather-rain 0.15s linear infinite",
        }} />
        {weather === "downpour" && <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "repeating-linear-gradient(105deg, transparent, transparent 3px, rgba(150,190,255,0.1) 3px, rgba(150,190,255,0.1) 4px)",
          backgroundSize: "6px 20px",
          animation: "weather-rain 0.25s linear infinite",
          filter: "blur(1px)",
        }} />}
      </>}

      {/* Sand particles */}
      {isSand && <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "repeating-linear-gradient(80deg, transparent, transparent 6px, rgba(200,170,100,0.15) 6px, rgba(200,170,100,0.15) 7px)",
        backgroundSize: "12px 8px",
        animation: "weather-sand 0.3s linear infinite",
      }} />}

      {/* Void flicker */}
      {isVoid && <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 50% 50%, rgba(100,0,200,0.08), transparent 70%)",
        animation: "pulse 3s ease-in-out infinite",
      }} />}

      {/* Heat shimmer */}
      {isHeat && <div style={{
        position: "absolute", inset: 0, bottom: "40%",
        background: "linear-gradient(transparent, rgba(255,100,0,0.06), transparent)",
        animation: "weather-heat 2s ease-in-out infinite",
      }} />}

      {/* Weather label */}
      <div style={{
        position: "absolute", top: 8, right: 10, fontSize: 8,
        color: "#aaa", background: "rgba(0,0,0,0.6)", padding: "2px 6px", zIndex: 11,
      }}>
        {WEATHER_TYPES[weather]?.emoji} {WEATHER_TYPES[weather]?.name?.toUpperCase()}
      </div>
    </div>
  );
}

// ─── CORRUPTED BESTIARY (Singularity NPCs) ───
const CORRUPTED_NPCS = [
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

// ─── FELIX MESSAGES ───
const FELIX_MSGS = {
  hatchery: "DRAGON_FORGE v1.0: System Online. Load essence into the splicing tray to begin recombination.",
  compiling: "CRITICAL: Synthesizing recombinant DNA strands. Do not power off.",
  successPure: "SUCCESS: Pure-blood strain compiled. Optimal data-structure achieved.",
  successHybrid: "SUCCESS: Hybridization complete. Minor instability detected, but the code is holding!",
  combat: "Simulation parameters locked. Initiating combat sub-routines...",
  victory: "TARGET_DELETED: Extraction complete. Salvaging data-fragments...",
  defeat: "CRITICAL_FAILURE: Subject integrity compromised. Recommend immediate repair cycle.",
  journal: "Accessing specimen database. All data-streams nominal.",
  boss: "The Singularity has breached the firewall. Deploy full roster!",
  nullVoid: "WARNING: Null Void detected. System stability critical.",
};

// ═══════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════

// ─── SCANLINES OVERLAY ───
function Scanlines() {
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
      background: "linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.1) 50%), linear-gradient(90deg, rgba(255,0,0,0.03), rgba(0,255,0,0.01), rgba(0,0,255,0.03))",
      backgroundSize: "100% 3px, 3px 100%",
      pointerEvents: "none", zIndex: 1000,
    }} />
  );
}

// ─── PROFESSOR FELIX COMMS ───
function FelixComms({ message, mood = "default" }) {
  return (
    <div style={{
      ...UI.panel,
      display: "flex", gap: 15, alignItems: "center",
      borderLeft: "4px solid #44ff88", marginBottom: 15,
    }}>
      <div style={{
        width: 64, height: 64, border: "1px solid #44ff88",
        background: "#050505", overflow: "hidden",
        flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <img src="/felix.png" alt="Professor Felix" style={{ width: "100%", height: "100%", objectFit: "cover", imageRendering: "pixelated" }} onError={(e) => { e.target.style.display = 'none'; }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, color: "#44ff88", marginBottom: 4 }}>[PROF_FELIX_COMMS]</div>
        <div style={{ fontSize: 11, lineHeight: 1.5 }}>"{message}"</div>
      </div>
    </div>
  );
}

// ─── UI CONSTANTS ───
const UI = {
  panel: { background: "#111", border: "1px solid #333", padding: 12, position: "relative" },
  heading: { fontWeight: "bold", fontSize: 12, letterSpacing: 1, color: "#eee", marginBottom: 8, textTransform: "uppercase" },
  text: { fontSize: 11, color: "#888" },
  btn: { background: "#1a1a1a", border: "1px solid #444", color: "#ccc", cursor: "pointer", transition: "0.15s", padding: "8px 12px", fontSize: 10, textTransform: "uppercase" },
  btnActive: (color = "#44ff88") => ({
    padding: "8px 12px", background: color, color: "#000",
    border: `1px solid ${color}`, fontSize: 10, cursor: "pointer",
    fontWeight: "bold", textTransform: "uppercase",
  }),
};

// ─── HEALTH BAR ───
function HealthBar({ current, max, color, label, height = 14 }) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  return (
    <div style={{ marginBottom: 3 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#aaa", marginBottom: 1 }}>
        <span>{label}</span><span>{current}/{max}</span>
      </div>
      <div style={{ background: "#1a1a1a", height, overflow: "hidden", border: "1px solid #333" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg,${color},${color}88)`, transition: "width 0.5s ease" }} />
      </div>
    </div>
  );
}

// ─── BATTLE LOG ───
function BattleLog({ log }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [log]);
  return (
    <div ref={ref} style={{ ...UI.panel, background: "#080808", maxHeight: 100, overflowY: "auto", marginTop: 8 }}>
      {log.map((l, i) => (
        <div key={i} style={{ fontSize: 10, color: l.color || "#888", marginBottom: 2 }}>
          {l.icon && <span style={{ marginRight: 4 }}>{l.icon}</span>}{l.text}
        </div>
      ))}
      {log.length === 0 && <div style={{ fontSize: 10, color: "#444" }}>Battle begins...</div>}
    </div>
  );
}

// ─── SPRITE SHEET CONFIG ───
const SPRITE_SHEETS = {
  fire:      "/sprites/fire.png",
  ice:       "/sprites/ice.png",
  lightning: "/sprites/storm.png",
  nature:    "/sprites/venom.png",
  shadow:    "/sprites/shadow.png",
  stone:     "/sprites/stone.png",
};
const ATTACK_SPRITE_SHEETS = {
  fire:      "/sprites/fire_attack.png",
  ice:       "/sprites/ice_attack.png",
  lightning: "/sprites/storm_attack.png",
  nature:    "/sprites/venom_attack.png",
  shadow:    "/sprites/shadow_attack.png",
};
const SPRITE_COLS = 4;
const SPRITE_ROWS = 2;
const SPRITE_FRAMES = SPRITE_COLS * SPRITE_ROWS;
// Attack sprite sheets: only the top row (frames 0-3) contains valid battle
// animation. The bottom row holds lifecycle/hatch/projectile art that should
// NOT play during combat.
const ATTACK_FRAME_COUNT = SPRITE_COLS; // use only the first row (4 frames)
const FRAME_W = 352;
const FRAME_H = 384;

// Shared image + chroma-keyed frame cache
const _spriteCache = {};
function getSpriteFrames(key) {
  if (_spriteCache[key]) return _spriteCache[key];
  const entry = { img: null, frames: [], ready: false, loading: false, listeners: [] };
  _spriteCache[key] = entry;
  return entry;
}
function _loadSheet(sheetUrl, cacheKey, onReady) {
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
function loadSpriteSheet(element, onReady) {
  _loadSheet(SPRITE_SHEETS[element] || SPRITE_SHEETS.fire, element, onReady);
}
function loadAttackSheet(element, onReady) {
  const url = ATTACK_SPRITE_SHEETS[element];
  if (!url) { onReady(); return; }
  _loadSheet(url, element + "_attack", onReady);
}

// ─── DRAGON SPRITE (Sprite Sheet) ───
// ─── CORRUPTED NPC SPRITE (single image, no sheet) ───
function CorruptedNpcSprite({ sprite, filter, size = 80, flip = false }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div style={{
      width: size, height: size * (FRAME_H / FRAME_W), position: "relative", display: "inline-block",
      filter: failed ? filter : undefined,
      animation: "pulse 2s ease-in-out infinite",
    }}>
      {!failed ? (
        <img
          src={sprite}
          alt="Corrupted NPC"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          style={{
            width: "100%", height: "100%", objectFit: "contain",
            transform: flip ? "scaleX(-1)" : "none",
            imageRendering: "pixelated",
            filter: "drop-shadow(0 0 6px rgba(255,0,100,0.5))",
            display: loaded ? "block" : "none",
          }}
        />
      ) : (
        <div style={{
          width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: Math.max(16, size * 0.4), color: "#ff4444",
        }}>
          {"\u{1F47E}"}
        </div>
      )}
      {!loaded && !failed && (
        <div style={{
          width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: Math.max(16, size * 0.4), color: "#ff4444",
        }}>
          {"\u{1F47E}"}
        </div>
      )}
    </div>
  );
}

// ─── DRAGON SPRITE (Sprite Sheet) ───
function DragonSprite({ element, size = 80, stage = 0, animate = false, flip = false, attacking = false }) {
  const [frame, setFrame] = useState(0);
  const [ready, setReady] = useState(false);
  const [attackReady, setAttackReady] = useState(false);
  const el = ELEMENTS[element] || ELEMENTS.fire;
  const spriteElement = SPRITE_SHEETS[element] ? element : "fire";

  useEffect(() => {
    loadSpriteSheet(spriteElement, () => setReady(true));
    loadAttackSheet(spriteElement, () => setAttackReady(true));
  }, [spriteElement]);

  const useAttack = attacking && attackReady && ATTACK_SPRITE_SHEETS[spriteElement];
  // Attack sheets: only cycle top row (0..ATTACK_FRAME_COUNT-1)
  // Idle sheets: cycle all frames
  const maxFrames = useAttack ? ATTACK_FRAME_COUNT : SPRITE_FRAMES;

  useEffect(() => {
    if (!animate || !ready) return;
    const id = setInterval(() => {
      setFrame(f => (f + 1) % maxFrames);
    }, 300);
    return () => clearInterval(id);
  }, [animate, ready, maxFrames]);

  const cacheKey = useAttack ? spriteElement + "_attack" : spriteElement;
  const entry = getSpriteFrames(cacheKey);
  const glow = stage >= 3;
  const src = entry.ready ? entry.frames[frame % maxFrames] : null;

  return (
    <div style={{
      width: size, height: size * (FRAME_H / FRAME_W), position: "relative", display: "inline-block",
      imageRendering: "pixelated",
    }}>
      {glow && (
        <div style={{
          position: "absolute", inset: -4, borderRadius: "50%",
          boxShadow: `0 0 ${8 + stage * 2}px ${el.color}66, 0 0 ${14 + stage * 3}px ${el.color}33`,
          animation: "pulse 2s ease-in-out infinite",
          pointerEvents: "none",
        }} />
      )}
      {src ? (
        <img
          src={src}
          alt={`${el.name} dragon`}
          style={{
            width: "100%", height: "100%", objectFit: "contain",
            transform: flip ? "scaleX(-1)" : "none",
            imageRendering: "pixelated",
            filter: `drop-shadow(0 0 ${2 + stage}px ${el.color}88)`,
          }}
        />
      ) : (
        <div style={{
          width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: Math.max(16, size * 0.4), color: el.color,
        }}>
          {el.emoji}
        </div>
      )}
    </div>
  );
}

// ─── FLOATING TEXT ───
function FloatText({ texts }) {
  return texts.map((t, i) => (
    <div key={t.id || i} style={{
      position: "absolute", left: t.side === "player" ? "20%" : "65%", top: "30%",
      fontSize: 14, fontWeight: 900, color: t.color, pointerEvents: "none",
      animation: "floatUp 1.2s ease forwards",
      textShadow: `0 0 8px ${t.color}`,
    }}>{t.text}</div>
  ));
}

// ─── SPELL PARTICLES ───
function SpellParticles({ fx, side }) {
  if (!fx) return null;
  const colors = {
    fire: ["#ff4422","#ff8844","#ffcc00"], ice: ["#44bbff","#88ddff","#ffffff"],
    lightning: ["#ffdd00","#ffee66","#ffffff"], nature: ["#76ff03","#88ff99","#aaffcc"],
    shadow: ["#9944ff","#bb88ff","#dd88ff"], stone: ["#a1887f","#bcaaa4","#d7ccc8"],
    heal: ["#44ff88","#88ffaa","#ccffdd"], buff: ["#ffaa00","#ffcc44","#ffee88"],
  };
  const cs = colors[fx] || colors.fire;
  const x = side === "player" ? 70 : 25;
  const dir = side === "player" ? 1 : -1;

  // Distinct particle shapes and motion per element
  if (fx === "fire") {
    return (
      <div style={{ position: "absolute", left: `${x}%`, top: "30%", pointerEvents: "none" }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            width: rand(6, 14), height: rand(8, 18),
            borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
            background: `radial-gradient(ellipse, ${pick(cs)}, transparent)`,
            left: rand(-20, 20), top: rand(-40, 10),
            animation: `fireRise ${rand(4,8)/10}s ease-out forwards`,
            animationDelay: `${i * 0.04}s`, opacity: 0,
          }} />
        ))}
      </div>
    );
  }
  if (fx === "ice") {
    return (
      <div style={{ position: "absolute", left: `${x}%`, top: "35%", pointerEvents: "none" }}>
        {Array.from({ length: 10 }).map((_, i) => {
          const size = rand(3, 8);
          return (
            <div key={i} style={{
              position: "absolute",
              width: size, height: size,
              background: pick(cs), borderRadius: i % 3 === 0 ? "2px" : "50%",
              boxShadow: `0 0 ${rand(4,8)}px ${pick(cs)}`,
              left: rand(-35, 35), top: rand(-35, 35),
              animation: `iceShatter ${rand(5,9)/10}s ease-out forwards`,
              animationDelay: `${i * 0.03}s`, opacity: 0,
              transform: `rotate(${rand(0,360)}deg)`,
            }} />
          );
        })}
      </div>
    );
  }
  if (fx === "lightning") {
    return (
      <div style={{ position: "absolute", left: `${x}%`, top: "20%", pointerEvents: "none" }}>
        {/* Lightning bolt segments */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            width: 2, height: rand(15, 30),
            background: pick(cs), boxShadow: `0 0 8px ${pick(cs)}, 0 0 16px #ffdd0066`,
            left: rand(-15, 15), top: i * 12,
            transform: `skewX(${rand(-30, 30)}deg)`,
            animation: `lightningFlash ${rand(1,3)/10}s ease-in-out ${3 + i}`,
            animationDelay: `${i * 0.02}s`, opacity: 0,
          }} />
        ))}
        {/* Sparks */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={`s${i}`} style={{
            position: "absolute",
            width: 3, height: 3, borderRadius: "50%",
            background: "#ffee66", boxShadow: "0 0 6px #ffdd00",
            left: rand(-25, 25), top: rand(0, 60),
            animation: `sparkFly ${rand(3,6)/10}s ease-out forwards`,
            animationDelay: `${i * 0.04}s`, opacity: 0,
          }} />
        ))}
      </div>
    );
  }
  if (fx === "nature") {
    return (
      <div style={{ position: "absolute", left: `${x}%`, top: "30%", pointerEvents: "none" }}>
        {/* Venom drops */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            width: rand(5, 10), height: rand(7, 14),
            borderRadius: "50% 50% 50% 50% / 30% 30% 70% 70%",
            background: pick(cs), boxShadow: `0 0 6px ${pick(cs)}`,
            left: rand(-30, 30), top: rand(-20, 30),
            animation: `venomDrip ${rand(5,9)/10}s ease-in forwards`,
            animationDelay: `${i * 0.06}s`, opacity: 0,
          }} />
        ))}
      </div>
    );
  }
  if (fx === "shadow") {
    return (
      <div style={{ position: "absolute", left: `${x}%`, top: "30%", pointerEvents: "none" }}>
        {/* Shadow wisps */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            width: rand(12, 24), height: rand(4, 8),
            borderRadius: "50%",
            background: `radial-gradient(ellipse, ${pick(cs)}88, transparent)`,
            left: rand(-40, 40), top: rand(-30, 30),
            animation: `shadowWisp ${rand(6,10)/10}s ease-in-out forwards`,
            animationDelay: `${i * 0.05}s`, opacity: 0,
          }} />
        ))}
      </div>
    );
  }
  if (fx === "stone") {
    return (
      <div style={{ position: "absolute", left: `${x}%`, top: "35%", pointerEvents: "none" }}>
        {/* Rock shards */}
        {Array.from({ length: 8 }).map((_, i) => {
          const w = rand(4, 10); const h = rand(4, 12);
          return (
            <div key={i} style={{
              position: "absolute",
              width: w, height: h, borderRadius: rand(1, 3),
              background: pick(cs), boxShadow: `1px 1px 2px #0004`,
              left: rand(-25, 25), top: rand(-25, 25),
              animation: `rockBlast ${rand(4,7)/10}s ease-out forwards`,
              animationDelay: `${i * 0.04}s`, opacity: 0,
              transform: `rotate(${rand(0, 180)}deg)`,
            }} />
          );
        })}
      </div>
    );
  }
  // heal / buff / generic fallback
  return (
    <div style={{ position: "absolute", left: `${x}%`, top: "35%", pointerEvents: "none" }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          width: rand(4,8), height: rand(4,8), borderRadius: "50%",
          background: pick(cs), boxShadow: fx === "heal" ? `0 0 8px ${pick(cs)}` : "none",
          left: rand(-30,30), top: rand(-30,30),
          animation: `${fx === "heal" ? "healRise" : "particleBurst"} 0.8s ease forwards`,
          animationDelay: `${i*0.05}s`, opacity: 0,
        }} />
      ))}
    </div>
  );
}

// ─── INTRO SEQUENCE: "THE SINGULARITY BREACH" ───
const INTRO_LINES = [
  { tag: "SYSTEM", text: "INITIALIZING FORGE_OS_V9.0...", delay: 800 },
  { tag: "SYSTEM", text: "LOADING ELEMENTAL CORE MATRIX...", delay: 600 },
  { tag: "SYSTEM", text: "WARNING: THE SINGULARITY HAS BREACHED THE SECTOR 7 FIREWALL.", delay: 1200 },
  { tag: "SYSTEM", text: "REALITY STABILITY AT 14% AND DROPPING.", delay: 1000 },
  { tag: "SYSTEM", text: "EMERGENCY PROTOCOL ACTIVATED.", delay: 800 },
  { tag: "COMMS",  text: "PROFESSOR FELIX HERE. IF YOU CAN READ THIS, YOU ARE OUR LAST NODE.", delay: 1400 },
  { tag: "COMMS",  text: "THE BREACH IS CONSUMING EVERYTHING. ALL DATA IS BEING CORRUPTED.", delay: 1200 },
  { tag: "COMMS",  text: "WE ARE CONVERTING REMAINING DATA INTO ELEMENTAL CORES.", delay: 1000 },
  { tag: "COMMS",  text: "HATCH THE DRAGONS. FIGHT THE CODE. SAVE THE WORLD.", delay: 1400 },
  { tag: "SYSTEM", text: "SIMULATION READY. AWAITING OPERATOR INPUT...", delay: 1000 },
];

function IntroSequence({ onComplete }) {
  const [visibleLines, setVisibleLines] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [glitch, setGlitch] = useState(false);
  const [done, setDone] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [felixVisible, setFelixVisible] = useState(false);

  // Typewriter effect
  useEffect(() => {
    if (visibleLines >= INTRO_LINES.length) {
      setDone(true);
      setTimeout(() => setShowButton(true), 600);
      return;
    }
    const line = INTRO_LINES[visibleLines];
    if (charIndex < line.text.length) {
      const speed = 25 + Math.random() * 20;
      playSound("textBlip", { volume: 0.15, pitchShift: true });
      const tid = setTimeout(() => setCharIndex(c => c + 1), speed);
      return () => clearTimeout(tid);
    } else {
      const tid = setTimeout(() => {
        setVisibleLines(v => v + 1);
        setCharIndex(0);
      }, line.delay);
      return () => clearTimeout(tid);
    }
  }, [visibleLines, charIndex]);

  // Show Felix portrait when COMMS lines start
  useEffect(() => {
    if (visibleLines >= 5 && !felixVisible) setFelixVisible(true);
  }, [visibleLines, felixVisible]);

  // Random glitch effects
  useEffect(() => {
    if (done) return;
    const glitchInterval = setInterval(() => {
      if (Math.random() < 0.15) {
        setGlitch(true);
        setTimeout(() => setGlitch(false), 50 + Math.random() * 80);
      }
    }, 800);
    return () => clearInterval(glitchInterval);
  }, [done]);

  const bgmRef = useRef(null);
  const handleLaunch = () => {
    playSound("boot");
    if (bgmRef.current) bgmRef.current.pause();
    setTransitioning(true);
    setTimeout(onComplete, 800);
  };

  // Skip intro on click/key
  const handleSkip = () => {
    if (done) return;
    setVisibleLines(INTRO_LINES.length);
    setCharIndex(0);
  };

  // Keyboard support
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        if (showButton) handleLaunch();
        else handleSkip();
      } else if (e.key === "Escape") handleSkip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showButton, done]);

  // Gamepad support
  useGamepad((buttons) => {
    if (buttons.includes(GP.A) || buttons.includes(GP.START)) {
      if (showButton) handleLaunch();
      else handleSkip();
    }
  });

  // Background music
  useEffect(() => {
    const audio = new Audio("/Crystal_Shell.mp3");
    audio.loop = true; audio.volume = 0.3;
    audio.play().catch(() => {});
    bgmRef.current = audio;
    return () => { audio.pause(); audio.src = ""; };
  }, []);

  return (
    <div onClick={handleSkip} style={{
      width: "100%", minHeight: "100vh", background: "#000", color: "#eee",
      fontFamily: "'Fira Code', monospace", padding: 0, overflow: "hidden",
      position: "relative", cursor: done ? "default" : "pointer",
      filter: glitch ? `skewX(${Math.random() * 4 - 2}deg) hue-rotate(${Math.random() * 60}deg)` : "none",
      transition: transitioning ? "filter 0.8s" : "none",
      ...(transitioning ? { filter: "brightness(10) blur(20px)" } : {}),
    }}>
      {/* Video backdrop */}
      <video autoPlay muted loop playsInline style={{
        position: "absolute", inset: 0, width: "100%", height: "100%",
        objectFit: "cover", zIndex: 0, opacity: 0.25,
        filter: "brightness(0.5) saturate(1.5) hue-rotate(10deg)",
      }}>
        <source src="/Crystal_Shell.mp4" type="video/mp4" />
      </video>

      {/* Scanlines overlay */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 100,
        background: "repeating-linear-gradient(transparent 0px, rgba(0,0,0,0.15) 2px, transparent 4px)",
      }} />

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "40px 20px", position: "relative", zIndex: 2 }}>
        {/* Felix portrait — appears during COMMS lines */}
        {felixVisible && (
          <div style={{
            float: "right", marginLeft: 20, marginBottom: 15,
            width: 100, height: 120, border: "1px solid #44ff88",
            overflow: "hidden", position: "relative",
            animation: "slideIn 0.5s ease",
          }}>
            <img src="/felix.png" alt="Professor Felix" onError={(e) => { e.target.style.display = 'none'; }} style={{
              width: "100%", height: "100%", objectFit: "cover", objectPosition: "top",
              imageRendering: "pixelated",
              filter: "contrast(1.3) brightness(0.9)",
            }} />
            {/* Static/degraded feed overlay */}
            <div style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background: "repeating-linear-gradient(transparent 0px, rgba(0,255,100,0.06) 1px, transparent 3px)",
              mixBlendMode: "overlay",
            }} />
            <div style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background: "linear-gradient(transparent 80%, rgba(0,0,0,0.6) 100%)",
            }} />
            <div style={{
              position: "absolute", bottom: 2, left: 4, fontSize: 7,
              color: "#44ff88", textShadow: "0 0 4px #44ff88",
            }}>LIVE FEED</div>
          </div>
        )}

        {/* Terminal header */}
        <div style={{ fontSize: 9, color: "#333", marginBottom: 20, letterSpacing: 2 }}>
          FORGE_OS v9.0 // SECTOR_7 TERMINAL // {new Date().toISOString().split("T")[0]}
        </div>

        {/* Typed lines */}
        {INTRO_LINES.slice(0, visibleLines + (done ? 0 : 1)).map((line, i) => {
          const isCurrentLine = i === visibleLines && !done;
          const displayText = isCurrentLine ? line.text.slice(0, charIndex) : line.text;
          const tagColor = line.tag === "COMMS" ? "#44ff88" : "#ff4422";

          return (
            <div key={i} style={{
              marginBottom: 8, fontSize: 12, lineHeight: 1.6,
              opacity: i < visibleLines ? 0.7 : 1,
            }}>
              <span style={{ color: tagColor, fontWeight: 700 }}>[{line.tag}]</span>
              <span style={{ color: line.tag === "COMMS" ? "#ccffcc" : "#ccc" }}> {displayText}</span>
              {isCurrentLine && (
                <span style={{
                  color: "#44ff88",
                  animation: "pulse 1s step-end infinite",
                }}>{"\u2588"}</span>
              )}
            </div>
          );
        })}

        {/* Launch button */}
        {showButton && (
          <div style={{ textAlign: "center", marginTop: 40, animation: "slideIn 0.6s ease" }}>
            <button onClick={(e) => { e.stopPropagation(); handleLaunch(); }} style={{
              background: "linear-gradient(135deg, #cc3300, #ff5522)",
              border: "2px solid #ff6633", color: "#fff", fontWeight: 700,
              fontFamily: "'Fira Code', monospace", fontSize: 16,
              padding: "14px 44px", cursor: "pointer", letterSpacing: 3,
              animation: "pulse 2s ease-in-out infinite",
              textShadow: "0 0 10px rgba(255,100,0,0.5)",
              boxShadow: "0 0 20px rgba(255,80,0,0.3), inset 0 0 20px rgba(255,255,255,0.05)",
            }}>
              [ INITIALIZE_SIMULATION.EXE ]
            </button>
            <div style={{ fontSize: 9, color: "#555", marginTop: 12, letterSpacing: 1 }}>
              CLICK ANYWHERE TO SKIP // PRESS A OR ENTER TO LAUNCH
            </div>
          </div>
        )}

        {/* Skip hint */}
        {!done && (
          <div style={{
            position: "fixed", bottom: 20, right: 20, fontSize: 9,
            color: "#333", letterSpacing: 1,
          }}>
            CLICK TO SKIP
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ENEMY GENERATION
// ═══════════════════════════════════════════════════════════════
function generateEnemy(playerLevel, currentWeather = "clear") {
  // Corrupted NPC chance: base 20%, +30% during non-clear weather
  const npcChance = currentWeather !== "clear" ? 0.5 : 0.2;
  const eligible = CORRUPTED_NPCS.filter(n => n.level <= playerLevel + 4);
  if (eligible.length > 0 && Math.random() < npcChance) {
    const npc = pick(eligible);
    const abs = [...(ABILITIES[npc.element] || ABILITIES.fire), npc.sig];
    return {
      name: npc.name, element: npc.element, level: npc.level,
      hp: npc.hp, maxHp: npc.hp, mana: npc.mana, maxMana: npc.mana,
      attack: npc.atk, defense: npc.def, speed: npc.spd,
      abilities: abs, gold: npc.gold, xp: npc.xp, isBoss: false,
      isCorrupted: true, corruptedFilter: npc.filter, corruptedEmoji: npc.emoji, corruptedSprite: npc.sprite,
    };
  }
  const l = Math.max(1, playerLevel + rand(-1, 2));
  const el = pick(Object.keys(ELEMENTS));
  const mh = 60 + l * 15 + rand(0, 20);
  const mm = 60 + l * 10;
  const abs = [...ABILITIES[el]];
  if (l >= 6) { const t = TECHNIQUES.filter(t => t.req <= l); if (t.length) abs.push(pick(t)); }
  return {
    name: pick(ENEMY_NAMES), element: el, level: l,
    hp: mh, maxHp: mh, mana: mm, maxMana: mm,
    attack: 6 + l*2 + rand(0,3), defense: 4 + l*2 + rand(0,2),
    speed: 5 + l + rand(0,3), abilities: abs,
    gold: 15 + l*8 + rand(0,10), xp: 10 + l*5 + rand(0,5), isBoss: false,
  };
}

function generateBoss(bossIndex) {
  const b = BOSSES[bossIndex];
  const abs = [...(ABILITIES[b.element] || ABILITIES.shadow), b.sig];
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
  // Core state
  const [screen, setScreen] = useState("intro");
  const [titleArena] = useState(() => {
    const arenas = Object.values(ELEMENTS).map(e => e.arena);
    return arenas[Math.floor(Math.random() * arenas.length)];
  });
  const [dragon, setDragon] = useState(null);
  const [enemy, setEnemy] = useState(null);
  const [battleLog, setBattleLog] = useState([]);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [battleOver, setBattleOver] = useState(false);
  const [battleArena, setBattleArena] = useState(null);
  const [gold, setGold] = useState(0);
  const [scraps, setScraps] = useState(100);
  const [xp, setXp] = useState(0);
  const [xpNeeded, setXpNeeded] = useState(30);
  const [inventory, setInventory] = useState([]);
  const [techniques, setTechniques] = useState([]);
  const [bossesDefeated, setBossesDefeated] = useState([]);
  const [floatTexts, setFloatTexts] = useState([]);
  const [particles, setParticles] = useState(null);
  const [showEvo, setShowEvo] = useState(null);
  const [hubTab, setHubTab] = useState("stats");
  const [poison, setPoison] = useState({ player: 0, enemy: 0 });

  // Hatchery state
  const [essences, setEssences] = useState({ fire: 25, ice: 15, lightning: 10, nature: 10, shadow: 5, stone: 8 });
  const [slotA, setSlotA] = useState(null);
  const [slotB, setSlotB] = useState(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [collection, setCollection] = useState([]);

  // World boss state
  const [worldBossHp, setWorldBossHp] = useState(WORLD_BOSS.maxHp);

  // Chromatic Hall
  const [hall, setHall] = useState([]);

  // Felix
  const [felixMsg, setFelixMsg] = useState(FELIX_MSGS.hatchery);
  const [felixMood, setFelixMood] = useState("default");

  // Null Void trigger
  const [nullVoidActive, setNullVoidActive] = useState(false);

  // Weather system
  const [weather, setWeather] = useState("clear");
  const [lightning, setLightning] = useState(false);

  // Create screen state
  const [createName, setCreateName] = useState("");
  const [createElement, setCreateElement] = useState("fire");
  const [createBody, setCreateBody] = useState("balanced");
  const [createTitle, setCreateTitle] = useState("");

  const floatId = useRef(0);
  const actionLock = useRef(false); // prevents double-fire on enemy turn

  // ─── GAMEPAD (Xbox One / USB Controller) ───
  const [gpCursor, setGpCursor] = useState(0);
  // Refs for functions defined later — gamepad hook needs access
  const createDragonRef = useRef(null);
  const startBattleRef = useRef(null);
  const playerActionRef = useRef(null);

  useGamepad(useCallback((buttons) => {
    const has = (b) => buttons.includes(b);

    // ── INTRO ──
    if (screen === "intro") return; // handled by its own component

    // ── TITLE SCREEN ──
    if (screen === "title") {
      if (has(GP.A) || has(GP.START)) setScreen("create");
      return;
    }

    // ── CREATE SCREEN ──
    if (screen === "create") {
      const elKeys = Object.keys(ELEMENTS);
      const curIdx = elKeys.indexOf(createElement);
      if (has(GP.LEFT))  setCreateElement(elKeys[(curIdx - 1 + elKeys.length) % elKeys.length]);
      if (has(GP.RIGHT)) setCreateElement(elKeys[(curIdx + 1) % elKeys.length]);
      if (has(GP.UP)) {
        const bi = BODY_TYPES.findIndex(b => b.id === createBody);
        setCreateBody(BODY_TYPES[(bi - 1 + BODY_TYPES.length) % BODY_TYPES.length].id);
      }
      if (has(GP.DOWN)) {
        const bi = BODY_TYPES.findIndex(b => b.id === createBody);
        setCreateBody(BODY_TYPES[(bi + 1) % BODY_TYPES.length].id);
      }
      if (has(GP.A) && createName.trim()) createDragonRef.current?.();
      if (has(GP.B)) setScreen("title");
      return;
    }

    // ── HUB / NAV SCREENS ──
    if (screen === "hub" || screen === "hatchery" || screen === "journal" || screen === "world_boss" || screen === "chromatic_hall") {
      const navScreens = ["hub", "hatchery", "journal", "world_boss", "chromatic_hall"];
      const navIdx = navScreens.indexOf(screen);
      if (has(GP.LB) && navIdx > 0) setScreen(navScreens[navIdx - 1]);
      if (has(GP.RB) && navIdx < navScreens.length - 1) setScreen(navScreens[navIdx + 1]);

      // Hub tab switching with X/Y
      if (screen === "hub") {
        const tabs = ["stats", "shop", "tech", "bosses"];
        const tabIdx = tabs.indexOf(hubTab);
        if (has(GP.X) && tabIdx > 0) setHubTab(tabs[tabIdx - 1]);
        if (has(GP.Y) && tabIdx < tabs.length - 1) setHubTab(tabs[tabIdx + 1]);
        // A = start battle (when on stats/bosses tab)
        if (has(GP.A) && hubTab === "stats") startBattleRef.current?.();
      }
      return;
    }

    // ── BATTLE SCREEN ──
    if (screen === "battle" && dragon && enemy) {
      if (battleOver) {
        if (has(GP.A)) startBattleRef.current?.();
        if (has(GP.B)) setScreen("hub");
        return;
      }
      if (!isPlayerTurn) return;

      const abilities = dragon.abilities || [];
      const totalOptions = abilities.length + 2; // +Rest +Focus

      if (has(GP.UP))    setGpCursor(c => (c - 2 + totalOptions) % totalOptions);
      if (has(GP.DOWN))  setGpCursor(c => (c + 2) % totalOptions);
      if (has(GP.LEFT))  setGpCursor(c => (c - 1 + totalOptions) % totalOptions);
      if (has(GP.RIGHT)) setGpCursor(c => (c + 1) % totalOptions);

      const pa = playerActionRef.current;
      if (has(GP.A) && pa) {
        if (gpCursor < abilities.length) {
          const a = abilities[gpCursor];
          if (dragon.mana >= a.cost) pa(a);
        } else if (gpCursor === abilities.length) {
          pa({ name: "Rest", dmg: 0, cost: 0, type: "rest", value: 10, manaValue: 12, icon: "\u{1F4A4}", fx: "heal" });
        } else {
          pa({ name: "Focus", dmg: 0, cost: 0, type: "focus", manaValue: 25, icon: "\u{1F9D8}", fx: "buff" });
        }
      }
      // Quick-cast: X=ability 0, Y=ability 1, LT=Rest, RT=Focus
      if (pa && has(GP.X) && abilities[0] && dragon.mana >= abilities[0].cost) pa(abilities[0]);
      if (pa && has(GP.Y) && abilities[1] && dragon.mana >= abilities[1].cost) pa(abilities[1]);
      if (pa && has(GP.LT)) pa({ name: "Rest", dmg: 0, cost: 0, type: "rest", value: 10, manaValue: 12, icon: "\u{1F4A4}", fx: "heal" });
      if (pa && has(GP.RT)) pa({ name: "Focus", dmg: 0, cost: 0, type: "focus", manaValue: 25, icon: "\u{1F9D8}", fx: "buff" });

      if (has(GP.B)) setScreen("hub");
      return;
    }
  }, [screen, createElement, createBody, createName, hubTab, dragon, enemy, isPlayerTurn, battleOver, gpCursor]));

  // Check Null Void trigger: 3+ Stage IV (Elder) dragons
  useEffect(() => {
    const elders = collection.filter(d => d.stage >= 3);
    if (elders.length >= 3 && !nullVoidActive) {
      setNullVoidActive(true);
      setFelixMsg(FELIX_MSGS.nullVoid);
      setFelixMood("danger");
    }
  }, [collection, nullVoidActive]);

  // Weather cycle: roll new weather every 60 seconds
  useEffect(() => {
    const weatherTick = setInterval(() => {
      const roll = Math.random();
      if (roll < 0.35) setWeather("clear");
      else setWeather(pick(WEATHER_KEYS));
    }, 60000);
    // Initial roll on mount
    if (Math.random() < 0.5) setWeather(pick(WEATHER_KEYS));
    return () => clearInterval(weatherTick);
  }, []);

  // Lightning flashes during thunderstorm
  useEffect(() => {
    if (weather !== "thunderstorm") { setLightning(false); return; }
    const id = setInterval(() => {
      if (Math.random() < 0.3) {
        setLightning(true);
        setTimeout(() => setLightning(false), 50);
      }
    }, 5000 + Math.random() * 5000);
    return () => clearInterval(id);
  }, [weather]);

  // ─── SAVE / LOAD ───
  const saveGame = useCallback(() => {
    if (!dragon) return;
    try {
      const data = { dragon, gold, scraps, xp, xpNeeded, inventory, techniques, bossesDefeated, collection, essences, worldBossHp, hall };
      localStorage.setItem("dragonforge-save", JSON.stringify(data));
    } catch (e) { console.error("Save failed", e); }
  }, [dragon, gold, scraps, xp, xpNeeded, inventory, techniques, bossesDefeated, collection, essences, worldBossHp, hall]);

  const loadGame = useCallback(() => {
    try {
      const raw = localStorage.getItem("dragonforge-save");
      if (raw) {
        const d = JSON.parse(raw);
        setDragon(d.dragon); setGold(d.gold); setScraps(d.scraps || 100);
        setXp(d.xp); setXpNeeded(d.xpNeeded);
        setInventory(d.inventory || []); setTechniques(d.techniques || []);
        setBossesDefeated(d.bossesDefeated || []);
        setCollection(d.collection || []); setEssences(d.essences || essences);
        setWorldBossHp(d.worldBossHp ?? WORLD_BOSS.maxHp);
        setHall(d.hall || []);
        return true;
      }
    } catch (e) { console.error("Load failed", e); }
    return false;
  }, []);

  const deleteSave = useCallback(() => {
    localStorage.removeItem("dragonforge-save");
    setDragon(null); setGold(0); setScraps(100); setXp(0); setXpNeeded(30);
    setInventory([]); setTechniques([]); setBossesDefeated([]);
    setCollection([]); setWorldBossHp(WORLD_BOSS.maxHp); setHall([]);
    setScreen("intro");
  }, []);

  useEffect(() => { if (screen === "hub" && dragon) saveGame(); }, [screen, saveGame, dragon]);
  useEffect(() => { if (loadGame()) setScreen("hub"); }, []);

  const addFloat = useCallback((text, color, side) => {
    const id = ++floatId.current;
    setFloatTexts(p => [...p, { id, text, color, side }]);
    setTimeout(() => setFloatTexts(p => p.filter(f => f.id !== id)), 1200);
  }, []);

  const getEvolution = (level) => {
    let evo = EVOLUTIONS[0];
    for (const e of EVOLUTIONS) { if (level >= e.level) evo = e; }
    return evo;
  };

  // ─── CREATE DRAGON ───
  const createDragon = () => {
    if (!createName.trim()) return;
    const body = BODY_TYPES.find(b => b.id === createBody);
    const d = {
      name: createName.trim(), title: createTitle, element: createElement,
      body: createBody, level: 1,
      hp: 100 + (body.statMod.maxHp || 0), maxHp: 100 + (body.statMod.maxHp || 0),
      mana: 70 + (body.statMod.maxMana || 0), maxMana: 70 + (body.statMod.maxMana || 0),
      attack: 8 + (body.statMod.attack || 0), defense: 6 + (body.statMod.defense || 0),
      speed: 7 + (body.statMod.speed || 0),
      abilities: [...ABILITIES[createElement]], stage: 0,
    };
    setDragon(d); setGold(30); setXp(0); setXpNeeded(30);
    setCollection([{ ...d, id: `DF-${rand(1000,9999)}` }]);
    setScreen("hub");
  };

  // ─── HATCHERY: COMPILE DNA ───
  const compileDNA = async () => {
    if (!slotA || !slotB || isCompiling) return;
    if (essences[slotA] < 5 || essences[slotB] < 5) return;
    setIsCompiling(true); playSound("hatchStart");
    setFelixMsg(FELIX_MSGS.compiling);
    setFelixMood("default");
    await new Promise(r => setTimeout(r, 2500));

    const isHybrid = slotA !== slotB;
    const newUnit = {
      id: `DF-${rand(1000,9999)}`,
      name: `${ELEMENTS[slotA].name.toUpperCase()}_UNIT`,
      element: slotA,
      body: "balanced", level: 1, stage: 0,
      hp: isHybrid ? 110 : 100, maxHp: isHybrid ? 110 : 100,
      mana: 70, maxMana: 70,
      attack: isHybrid ? 30 : 25, defense: isHybrid ? 8 : 10,
      speed: 7, abilities: [...ABILITIES[slotA]],
    };

    setEssences(prev => ({ ...prev, [slotA]: prev[slotA]-5, [slotB]: prev[slotB]-5 }));
    setScraps(prev => prev + rand(10, 30));
    setCollection(prev => [...prev, newUnit]);
    setIsCompiling(false); playSound("hatchSuccess");
    setSlotA(null); setSlotB(null);
    setFelixMsg(isHybrid ? FELIX_MSGS.successHybrid : FELIX_MSGS.successPure);
    setFelixMood("success");
  };

  // ─── WORLD BOSS ATTACK ───
  const launchRosterAttack = () => {
    const totalDps = collection.reduce((acc, d) => acc + (d.attack || 25), 0);
    const newHp = Math.max(0, worldBossHp - totalDps);
    setWorldBossHp(newHp);
    setScraps(prev => prev + Math.floor(totalDps / 10));
    setFelixMsg(`Direct hit! Total DPS: ${totalDps}. Scavenging data-dust from the impact.`);
    setFelixMood("success");
    if (newHp <= 0) {
      setHall(prev => [...prev, { name: "SINGULARITY_CORE", element: "shadow", date: new Date().toLocaleDateString() }]);
      setWorldBossHp(WORLD_BOSS.maxHp);
      setFelixMsg("THE SINGULARITY HAS BEEN BREACHED! A new cycle begins...");
    }
  };

  // ─── DO ABILITY (combat logic) ───
  const doAbility = (attacker, defender, ab, isPlayer) => {
    let nA = { ...attacker }; let nD = { ...defender };
    let log = []; let nEP = poison.enemy; let nPP = poison.player;
    nA.mana -= ab.cost;

    const atkStat = nA.attack + rand(-2, 2);
    const defStat = nD.defense + rand(-1, 1);
    const elA = ELEMENTS[nA.element]; const elD = ELEMENTS[nD.element];
    let mult = 1;
    if (elA?.strong?.includes(nD.element)) mult = 1.5;
    else if (elA?.weakness === nD.element) mult = 0.65;
    // Weather buffs/debuffs
    const w = WEATHER_TYPES[weather] || {};
    if (w.buffs?.[nA.element]) mult *= w.buffs[nA.element];
    if (w.debuffs?.[nA.element]) mult *= w.debuffs[nA.element];

    if (ab.type === "attack") {
      playSound(ATK_SFX[nA.element] || SFX.atkGeneric, { volume: 0.4 });
      let dmg = Math.max(1, Math.round((ab.dmg + atkStat - defStat * 0.5) * mult));
      nD.hp = Math.max(0, nD.hp - dmg);
      const eff = mult > 1 ? " Super effective!" : mult < 1 ? " Not very effective..." : "";
      log.push({ text: `${nA.name} uses ${ab.name}! ${dmg} DMG!${eff}`, color: mult > 1 ? "#ff8844" : mult < 1 ? "#8888aa" : "#ffffff", icon: ab.icon });
      addFloat(`-${dmg}`, mult > 1 ? "#ff4444" : "#ff8888", isPlayer ? "enemy" : "player");
    } else if (ab.type === "multi") {
      playSound(ATK_SFX[nA.element] || SFX.atkGeneric, { volume: 0.4 });
      let total = 0;
      for (let h = 0; h < (ab.hits || 3); h++) {
        let dmg = Math.max(1, Math.round((ab.dmg + atkStat * 0.6 - defStat * 0.3) * mult));
        nD.hp = Math.max(0, nD.hp - dmg); total += dmg;
      }
      log.push({ text: `${nA.name} unleashes ${ab.name}! ${ab.hits}x for ${total} DMG!`, color: "#ff6644", icon: ab.icon });
      addFloat(`-${total}`, "#ff4444", isPlayer ? "enemy" : "player");
    } else if (ab.type === "heal") {
      const h = ab.value + rand(-3, 5);
      nA.hp = Math.min(nA.maxHp, nA.hp + h);
      log.push({ text: `${nA.name} uses ${ab.name}! +${h} HP!`, color: "#44ff88", icon: ab.icon });
      addFloat(`+${h}`, "#44ff88", isPlayer ? "player" : "enemy");
    } else if (ab.type === "buff") {
      const isStat = ab.name.toLowerCase().includes("atk") || ab.name.toLowerCase().includes("cry") || ab.name.toLowerCase().includes("charge") || ab.name.toLowerCase().includes("pact");
      if (isStat) { nA.attack += ab.value; } else { nA.defense += ab.value; }
      log.push({ text: `${nA.name} uses ${ab.name}! +${ab.value} ${isStat ? "ATK" : "DEF"}!`, color: "#ffaa00", icon: ab.icon });
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
      log.push({ text: `${nA.name} uses ${ab.name}! ${dmg} DMG + Poisoned!`, color: "#88ff44", icon: ab.icon });
      addFloat(`-${dmg} \u{1F40D}`, "#88ff44", isPlayer ? "enemy" : "player");
    } else if (ab.type === "roar") {
      nA.attack += (ab.atkVal || 3); nA.defense += (ab.defVal || 2);
      log.push({ text: `${nA.name} roars! +${ab.atkVal}ATK +${ab.defVal}DEF!`, color: "#ffaa00", icon: ab.icon });
      addFloat("+ATK +DEF", "#ffaa00", isPlayer ? "player" : "enemy");
    } else if (ab.type === "rest") {
      const h = (ab.value || 10) + rand(-2, 4);
      const m = (ab.manaValue || 12) + rand(-2, 4);
      nA.hp = Math.min(nA.maxHp, nA.hp + h);
      nA.mana = Math.min(nA.maxMana, nA.mana + m);
      log.push({ text: `${nA.name} rests: +${h} HP, +${m} MP!`, color: "#88ccff", icon: "\u{1F4A4}" });
      addFloat(`+${h}HP +${m}MP`, "#88ccff", isPlayer ? "player" : "enemy");
    } else if (ab.type === "focus") {
      const m = (ab.manaValue || 25) + rand(-3, 5);
      nA.mana = Math.min(nA.maxMana, nA.mana + m);
      log.push({ text: `${nA.name} focuses: +${m} MP!`, color: "#aa88ff", icon: "\u{1F9D8}" });
      addFloat(`+${m} MP`, "#aa88ff", isPlayer ? "player" : "enemy");
    }
    nA.mana = Math.min(nA.maxMana, nA.mana + 3);
    return { a: nA, d: nD, log, ep: nEP, pp: nPP };
  };

  const applyPoison = (target, turns) => {
    if (turns <= 0) return { target, turns: 0, log: [] };
    const dmg = 5 + rand(0, 3);
    return {
      target: { ...target, hp: Math.max(0, target.hp - dmg) },
      turns: turns - 1,
      log: [{ text: `${target.name} takes ${dmg} poison damage!`, color: "#88aa44", icon: "\u{1F40D}" }],
    };
  };

  // ─── PLAYER ACTION ───
  const playerAction = (ability) => {
    if (!isPlayerTurn || battleOver || actionLock.current) return;
    actionLock.current = true;
    setIsPlayerTurn(false);
    setParticles({ fx: ability.fx || null, side: "enemy" });
    setTimeout(() => setParticles(null), 800);

    let res;
    try {
      res = doAbility(dragon, enemy, ability, true);
    } catch (err) {
      console.error("Player action error:", err);
      actionLock.current = false;
      setIsPlayerTurn(true);
      return;
    }
    let d = res.a; let e = res.d;
    let log = [...battleLog, ...res.log];
    let ep = res.ep; let pp = res.pp;

    if (pp > 0) { const pr = applyPoison(d, pp); d = pr.target; pp = pr.turns; log = [...log, ...pr.log]; }

    setDragon(d); setEnemy(e); setBattleLog(log);
    setPoison({ player: pp, enemy: ep });

    if (e.hp <= 0) {
      log.push({ text: `\u{1F389} ${e.name} defeated! +${e.gold}g +${e.xp}xp`, color: "#ffdd44", icon: "\u{1F3C6}" });
      playSound(e.isCorrupted ? "npcDeath" : "confirm");
      setBattleLog(log); setBattleOver(true);
      setGold(prev => prev + e.gold);
      setScraps(prev => prev + rand(5, 15));
      if (e.isBoss) setBossesDefeated(prev => [...prev, e.name]);
      setFelixMsg(FELIX_MSGS.victory); setFelixMood("success");

      const newXp = xp + e.xp;
      if (newXp >= xpNeeded) {
        const n = { ...d, level: d.level+1, attack: d.attack+rand(1,3), defense: d.defense+rand(1,3), speed: d.speed+rand(1,3), maxHp: d.maxHp+rand(8,15), maxMana: d.maxMana+rand(6,12) };
        n.hp = n.maxHp; n.mana = n.maxMana;
        const newEvo = getEvolution(n.level);
        const oldEvo = getEvolution(d.level);
        if (newEvo.stage !== oldEvo.stage) {
          const ei = EVOLUTIONS.indexOf(newEvo);
          n.stage = ei;
          n.attack += newEvo.bonus.attack; n.defense += newEvo.bonus.defense;
          n.speed += newEvo.bonus.speed; n.maxHp += newEvo.bonus.maxHp;
          n.maxMana += newEvo.bonus.maxMana; n.hp = n.maxHp; n.mana = n.maxMana;
          setShowEvo(newEvo); playSound("evolve"); setTimeout(() => setShowEvo(null), 3000);
        }
        setDragon(n); setXp(newXp - xpNeeded); setXpNeeded(Math.round(xpNeeded * 1.4));
        // Update in collection
        setCollection(prev => prev.map(c => c.id === n.id ? n : c));
        log.push({ text: `\u2B06\uFE0F LEVEL UP! Now level ${n.level}!`, color: "#ffee44", icon: "\u2B06\uFE0F" });
        setBattleLog(log);
      } else { setXp(newXp); }
      actionLock.current = false;
      return;
    }

    // Enemy turn
    setTimeout(() => {
      try {
        const eAbilities = (e.abilities || []).filter(a => e.mana >= a.cost);
        const eAb = eAbilities.length > 0 ? pick(eAbilities) : { name: "Rest", dmg: 0, cost: 0, type: "rest", value: 10, manaValue: 12, icon: "\u{1F4A4}", fx: "heal" };
        setParticles({ fx: eAb.fx || null, side: "player" });
        setTimeout(() => setParticles(null), 800);

        const eres = doAbilityRef.current(e, d, eAb, false);
        let ne = eres.a; let nd = eres.d;
        let elog = [...log, ...eres.log];
        let nep2 = eres.ep; let npp2 = eres.pp;

        if (nep2 > 0) { const pr = applyPoison(ne, nep2); ne = pr.target; nep2 = pr.turns; elog = [...elog, ...pr.log]; }

        setDragon(nd); setEnemy(ne); setBattleLog(elog);
        setPoison({ player: npp2, enemy: nep2 });

        if (nd.hp <= 0) {
          elog.push({ text: `\u{1F480} ${nd.name} has fallen...`, color: "#ff4444", icon: "\u{1F480}" });
          setBattleLog(elog); setBattleOver(true);
          setFelixMsg(FELIX_MSGS.defeat); setFelixMood("danger");
        } else {
          setIsPlayerTurn(true);
        }
        actionLock.current = false;
      } catch (err) {
        console.error("Enemy turn error:", err);
        setIsPlayerTurn(true);
        actionLock.current = false;
      }
    }, 1200);
  };

  const startBattle = (bossIndex = null) => {
    const e = bossIndex !== null ? generateBoss(bossIndex) : generateEnemy(dragon.level, weather);
    const d = { ...dragon, hp: dragon.maxHp, mana: dragon.maxMana };
    d.abilities = [...ABILITIES[dragon.element], ...techniques.map(t => TECHNIQUES.find(te => te.name === t)).filter(Boolean)];
    setDragon(d); setEnemy(e); setBattleLog([]); setIsPlayerTurn(d.speed >= e.speed);
    setBattleOver(false); setFloatTexts([]); setParticles(null);
    setPoison({ player: 0, enemy: 0 }); actionLock.current = false; setScreen("battle");
    setBattleArena(e.isCorrupted ? pick(BONUS_ARENAS) : (ELEMENTS[e.element] || ELEMENTS.fire).arena);
    playSound(e.isBoss ? "bossRoar" : "confirm");
    setFelixMsg(FELIX_MSGS.combat); setFelixMood("default");

    // If enemy is faster, run their opening move
    if (d.speed < e.speed) {
      setTimeout(() => {
        try {
          const eAbilities = (e.abilities || []).filter(a => e.mana >= a.cost);
          const eAb = eAbilities.length > 0 ? pick(eAbilities) : { name: "Rest", dmg: 0, cost: 0, type: "rest", value: 10, manaValue: 12, icon: "\u{1F4A4}", fx: "heal" };
          setParticles({ fx: eAb.fx || null, side: "player" });
          setTimeout(() => setParticles(null), 800);
          const eres = doAbilityRef.current(e, d, eAb, false);
          let ne = eres.a; let nd = eres.d;
          let elog = [...eres.log];
          setDragon(nd); setEnemy(ne); setBattleLog(elog);
          if (nd.hp <= 0) {
            elog.push({ text: `\u{1F480} ${nd.name} has fallen...`, color: "#ff4444", icon: "\u{1F480}" });
            setBattleLog(elog); setBattleOver(true);
            setFelixMsg(FELIX_MSGS.defeat); setFelixMood("danger");
          } else {
            setIsPlayerTurn(true);
          }
        } catch (err) {
          console.error("Enemy opening move error:", err);
          setIsPlayerTurn(true);
        }
      }, 1200);
    }
  };

  const train = (stat, cost) => {
    if (gold < cost) return;
    setGold(gold - cost);
    const d = { ...dragon };
    const g = rand(1, 3);
    if (stat === "attack") d.attack += g;
    else if (stat === "defense") d.defense += g;
    else if (stat === "speed") d.speed += g;
    else if (stat === "maxHp") { d.maxHp += g*5; d.hp = d.maxHp; }
    else if (stat === "maxMana") { d.maxMana += g*3; d.mana = d.maxMana; }
    setDragon(d);
  };

  const buyItem = (item) => {
    if (gold < item.cost || inventory.includes(item.name) || dragon.level < item.req) return;
    setGold(gold - item.cost); setInventory([...inventory, item.name]);
    const d = { ...dragon };
    if (item.stat === "maxHp") { d.maxHp += item.value; d.hp = d.maxHp; }
    else if (item.stat === "maxMana") { d.maxMana += item.value; d.mana = d.maxMana; }
    else d[item.stat] = (d[item.stat] || 0) + item.value;
    setDragon(d);
  };

  const learnTech = (tech) => {
    if (gold < tech.price || techniques.includes(tech.name) || dragon.level < tech.req) return;
    setGold(gold - tech.price); setTechniques([...techniques, tech.name]);
  };

  // ─── CSS ───
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Fira Code', monospace; }
    @keyframes floatUp { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(-40px); opacity: 0; } }
    @keyframes particleBurst { 0% { transform: scale(0); opacity: 0.8; } 50% { transform: scale(1.5); opacity: 0.5; } 100% { transform: scale(0) translateY(-20px); opacity: 0; } }
    @keyframes fireRise { 0% { opacity: 0.9; transform: translateY(0) scale(0.5); } 40% { opacity: 1; transform: translateY(-15px) scale(1.2); } 100% { opacity: 0; transform: translateY(-45px) scale(0.3); } }
    @keyframes iceShatter { 0% { opacity: 0; transform: scale(0); } 20% { opacity: 1; transform: scale(1.3); } 100% { opacity: 0; transform: scale(0.5) translate(var(--sx,10px), var(--sy,10px)); } }
    @keyframes lightningFlash { 0% { opacity: 0; } 10% { opacity: 1; } 30% { opacity: 0; } 50% { opacity: 1; } 70% { opacity: 0.3; } 100% { opacity: 0; } }
    @keyframes sparkFly { 0% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(0) translateY(-20px) translateX(var(--sx,15px)); } }
    @keyframes venomDrip { 0% { opacity: 0; transform: translateY(-10px) scale(0.5); } 30% { opacity: 0.9; transform: translateY(0) scale(1); } 100% { opacity: 0; transform: translateY(25px) scale(0.6); } }
    @keyframes shadowWisp { 0% { opacity: 0; transform: scale(0.3) rotate(0deg); } 40% { opacity: 0.7; transform: scale(1) rotate(10deg); } 100% { opacity: 0; transform: scale(1.5) rotate(-10deg) translateY(-15px); } }
    @keyframes rockBlast { 0% { opacity: 0; transform: scale(0) rotate(0deg); } 20% { opacity: 1; transform: scale(1.2); } 100% { opacity: 0; transform: translateY(30px) translateX(var(--sx,20px)) rotate(180deg); } }
    @keyframes healRise { 0% { opacity: 0; transform: translateY(10px) scale(0.5); } 50% { opacity: 1; transform: translateY(-5px) scale(1); } 100% { opacity: 0; transform: translateY(-25px) scale(0.3); } }
    @keyframes slideIn { 0% { transform: translateY(20px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
    @keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }
    @keyframes evoFlash { 0% { opacity: 0; transform: scale(0.5); } 50% { opacity: 1; transform: scale(1.2); } 100% { opacity: 0; transform: scale(2); } }
    @keyframes s-glow { 0% { filter: drop-shadow(0 0 5px #0f0); } 50% { filter: drop-shadow(0 0 10px #fff); } 100% { filter: drop-shadow(0 0 5px #0f0); } }
    @keyframes weather-rain { 0% { transform: translateY(-30px) skewX(-15deg); } 100% { transform: translateY(30px) skewX(-15deg); } }
    @keyframes weather-sand { 0% { transform: translateX(-20px) skewY(2deg); } 100% { transform: translateX(20px) skewY(2deg); } }
    @keyframes weather-heat { 0%,100% { transform: scaleY(1); opacity: 0.3; } 50% { transform: scaleY(1.02); opacity: 0.6; } }
    @keyframes u-glow { 0% { filter: drop-shadow(0 0 10px #f0f) hue-rotate(0deg); } 50% { filter: drop-shadow(0 0 20px #0ff) hue-rotate(180deg); } 100% { filter: drop-shadow(0 0 10px #f0f) hue-rotate(360deg); } }
    .shiny-glow { animation: s-glow 2s linear infinite; }
    .ultra-glow { animation: u-glow 1s linear infinite; }
    .btn { background: #1a1a1a; border: 1px solid #333; color: #ccc; cursor: pointer; font-family: 'Fira Code', monospace; transition: all 0.2s; padding: 8px 12px; font-size: 10px; }
    .btn:hover:not(:disabled) { background: #252525; border-color: #555; }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-primary { background: linear-gradient(135deg,#cc3300,#ff5522); border-color: #ff6633; color: #fff; font-weight: 700; }
    .btn-primary:hover:not(:disabled) { background: linear-gradient(135deg,#dd4411,#ff6633); }
    .btn-boss { background: linear-gradient(135deg,#551100,#882200); border-color: #aa3311; color: #ff8844; }
    .nav-btn { background: none; border: none; color: #888; cursor: pointer; padding: 8px 14px; font-size: 11px; font-family: 'Fira Code', monospace; border-bottom: 2px solid transparent; }
    .nav-btn.active { color: #44ff88; border-bottom-color: #44ff88; }
    .nav-btn:hover { color: #aaa; }
    .tab { background: none; border: none; border-bottom: 2px solid transparent; color: #666; cursor: pointer; padding: 6px 12px; font-size: 10px; font-family: 'Fira Code', monospace; text-transform: uppercase; letter-spacing: 1px; }
    .tab.active { color: #44ff88; border-bottom-color: #44ff88; }
    .tab:hover { color: #aaa; }
    input, select { background: #111; border: 1px solid #333; color: #eee; padding: 6px 10px; font-family: 'Fira Code', monospace; font-size: 12px; outline: none; }
    input:focus, select:focus { border-color: #44ff88; }
  `;

  const pg = { width: "100%", minHeight: "100vh", background: "#000", color: "#eee", fontFamily: "'Fira Code', monospace", padding: 0, overflow: "auto", position: "relative" };

  // ─── EVOLUTION OVERLAY ───
  const EvoOverlay = showEvo && (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
      <div style={{ textAlign: "center", animation: "evoFlash 3s ease forwards" }}>
        <div style={{ fontSize: 48, marginBottom: 10 }}>{"\u{1F409}"}</div>
        <h2 style={{ fontSize: 24, color: "#ffdd44", marginBottom: 6 }}>EVOLUTION!</h2>
        <div style={{ fontSize: 18, color: "#44ff88", fontWeight: 700, marginBottom: 6 }}>{showEvo.stage}</div>
        <div style={{ fontSize: 13, color: "#aaa" }}>{showEvo.desc}</div>
        <div style={{ fontSize: 11, color: "#88ff88", marginTop: 10 }}>
          +{showEvo.bonus.attack}ATK +{showEvo.bonus.defense}DEF +{showEvo.bonus.speed}SPD +{showEvo.bonus.maxHp}HP +{showEvo.bonus.maxMana}MP
        </div>
      </div>
    </div>
  );

  // Keep refs in sync with latest closures
  createDragonRef.current = createDragon;
  startBattleRef.current = startBattle;
  playerActionRef.current = playerAction;
  const doAbilityRef = useRef(doAbility);
  doAbilityRef.current = doAbility;

  // ═══════════════════════════════════════════════════════════
  // SCREENS
  // ═══════════════════════════════════════════════════════════

  // ─── INTRO: "THE SINGULARITY BREACH" ───
  if (screen === "intro") return <IntroSequence onComplete={() => setScreen("title")} />;

  // ─── TITLE ───
  if (screen === "title") return (
    <div style={{ ...pg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      <style>{css}</style><Scanlines />
      {/* Arena background */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundColor: "#1a1a2e",
        backgroundImage: `url(${titleArena})`,
        backgroundSize: "cover", backgroundPosition: "center top", backgroundRepeat: "no-repeat",
        filter: "brightness(0.3) contrast(1.3) saturate(1.2)",
        zIndex: 0,
      }} />
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 35%, transparent 70%, rgba(0,0,0,0.3) 100%)",
        zIndex: 1, pointerEvents: "none",
      }} />
      <div style={{ animation: "slideIn 1s ease", textAlign: "center", padding: 20, position: "relative", zIndex: 2 }}>
        <div style={{ fontSize: 11, letterSpacing: 6, color: "#44ff88", marginBottom: 10 }}>// SYSTEM_BOOT</div>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: "#eee", lineHeight: 1.1, marginBottom: 6, letterSpacing: 2 }}>DRAGON FORGE</h1>
        <div style={{ fontSize: 11, color: "#555", marginBottom: 28, letterSpacing: 3 }}>BUILD \u00B7 SPLICE \u00B7 EVOLVE \u00B7 BATTLE</div>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", marginBottom: 28, flexWrap: "wrap" }}>
          {Object.entries(ELEMENTS).map(([k]) => (<div key={k}><DragonSprite element={k} size={90} animate /></div>))}
        </div>
        <button className="btn btn-primary" style={{ fontSize: 14, padding: "12px 36px", letterSpacing: 2 }} onClick={() => { playSound("confirm"); setScreen("create"); }}>
          INITIALIZE_NEW_INSTANCE
        </button>
      </div>
    </div>
  );

  // ─── CREATE ───
  if (screen === "create") {
    const se = ELEMENTS[createElement];
    return (
      <div style={{ ...pg, maxWidth: 520, margin: "0 auto", padding: 20 }}>
        <style>{css}</style><Scanlines />
        <FelixComms message="Welcome, Overseer. Configure your initial specimen and we shall begin the simulation." />
        <h2 style={{ fontSize: 14, textAlign: "center", marginBottom: 16, color: "#44ff88" }}>// FORGE_YOUR_DRAGON</h2>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <DragonSprite element={createElement} size={100} animate />
        </div>
        <div style={{ ...UI.panel, marginBottom: 12 }}>
          <label style={{ fontSize: 10, color: "#888", display: "block", marginBottom: 4 }}>SPECIMEN_NAME</label>
          <input value={createName} onChange={e => setCreateName(e.target.value)} placeholder="Enter designation..." style={{ width: "100%" }} maxLength={20} />
        </div>
        <div style={{ ...UI.panel, marginBottom: 12 }}>
          <label style={{ fontSize: 10, color: "#888", display: "block", marginBottom: 4 }}>TITLE_PREFIX</label>
          <select value={createTitle} onChange={e => setCreateTitle(e.target.value)} style={{ width: "100%" }}>
            {TITLES.map(t => <option key={t} value={t}>{t || "(none)"}</option>)}
          </select>
        </div>
        <div style={{ ...UI.panel, marginBottom: 12 }}>
          <label style={{ fontSize: 10, color: "#888", display: "block", marginBottom: 6 }}>ELEMENT_CLASS</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {Object.entries(ELEMENTS).map(([k, v]) => (
              <button key={k} className="btn" onClick={() => setCreateElement(k)} style={{
                flex: 1, minWidth: 60, padding: "8px 4px", textAlign: "center",
                borderColor: createElement === k ? v.color : "#333", background: createElement === k ? v.bg : "#1a1a1a",
              }}>
                <div style={{ fontSize: 16 }}>{v.emoji}</div>
                <div style={{ fontSize: 8, color: createElement === k ? v.color : "#888" }}>{v.name}</div>
              </button>
            ))}
          </div>
        </div>
        <div style={{ ...UI.panel, marginBottom: 16 }}>
          <label style={{ fontSize: 10, color: "#888", display: "block", marginBottom: 6 }}>BODY_ARCHITECTURE</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {BODY_TYPES.map(b => (
              <button key={b.id} className="btn" onClick={() => setCreateBody(b.id)} style={{
                flex: 1, minWidth: 70, padding: "6px 4px", textAlign: "center",
                borderColor: createBody === b.id ? "#44ff88" : "#333",
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: createBody === b.id ? "#44ff88" : "#ccc" }}>{b.name}</div>
                <div style={{ fontSize: 8, color: "#888" }}>{b.desc}</div>
              </button>
            ))}
          </div>
        </div>
        <button className="btn btn-primary" onClick={createDragon} disabled={!createName.trim()} style={{ width: "100%", padding: 12, fontSize: 13, letterSpacing: 2 }}>
          COMPILE_SPECIMEN.EXE
        </button>
      </div>
    );
  }

  // ─── HUB (Main navigation wrapper) ───
  if ((screen === "hub" || screen === "hatchery" || screen === "journal" || screen === "world_boss" || screen === "chromatic_hall") && dragon) {
    const pEl = ELEMENTS[dragon.element];
    const evo = getEvolution(dragon.level);
    const currentView = screen === "hub" ? "hub" : screen;

    return (
      <div style={pg}>
        <style>{css}</style><Scanlines />{EvoOverlay}

        {/* HEADER with Felix */}
        <header style={{ padding: 15, borderBottom: "1px solid #333", display: "flex", gap: 15, alignItems: "center", background: "#080808" }}>
          <div style={{ width: 48, height: 48, border: "1px solid #44ff88", overflow: "hidden", flexShrink: 0, background: "#050505" }}>
            <img src="/felix.png" alt="Felix" style={{ width: "100%", height: "100%", objectFit: "cover", imageRendering: "pixelated" }} onError={(e) => { e.target.style.display = 'none'; }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div style={{ fontSize: 10, color: "#44ff88" }}>[FORGE_OVERSEER_v2.0]</div>
              <div style={{ fontSize: 10, color: "#ffee00" }}>
                {WEATHER_TYPES[weather]?.emoji} {"\u{1F4B0}"}{gold}g {"\u2699\uFE0F"}{scraps}
              </div>
            </div>
            <div style={{ fontSize: 11, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>"{felixMsg}"</div>
          </div>
        </header>

        {/* NAVIGATION */}
        <nav style={{ display: "flex", background: "#0a0a0a", borderBottom: "1px solid #333", overflowX: "auto" }}>
          {[
            ["hub", "COMMAND"],
            ["hatchery", "HATCHERY"],
            ["journal", "JOURNAL"],
            ["world_boss", "WORLD BOSS"],
            ["chromatic_hall", "HALL"],
          ].map(([v, label]) => (
            <button key={v} className={`nav-btn ${currentView === v ? "active" : ""}`}
              onClick={() => {
                setScreen(v);
                if (v === "hatchery") { setFelixMsg(FELIX_MSGS.hatchery); setFelixMood("default"); }
                if (v === "journal") { setFelixMsg(FELIX_MSGS.journal); setFelixMood("default"); }
                if (v === "world_boss") { setFelixMsg(FELIX_MSGS.boss); setFelixMood("danger"); }
              }}>
              [ {label} ]
            </button>
          ))}
          <button className="nav-btn" style={{ marginLeft: "auto", color: "#ff4422" }}
            onClick={() => { saveGame(); setScreen("title"); }}>
            [ MENU ]
          </button>
          <button className="nav-btn" style={{ color: "#ff2222" }}
            onClick={() => { if (window.confirm("DELETE all save data and restart?")) deleteSave(); }}>
            [ RESET ]
          </button>
        </nav>

        <main style={{ maxWidth: 900, margin: "0 auto", padding: 15 }}>

          {/* ══════ COMMAND HUB ══════ */}
          {currentView === "hub" && (
            <div style={{ maxWidth: 500, margin: "0 auto" }}>
              {/* Dragon card */}
              <div style={{ ...UI.panel, background: `linear-gradient(135deg,${pEl.bg},#111)`, borderColor: `${pEl.color}33`, textAlign: "center", marginBottom: 12 }}>
                <DragonSprite element={dragon.element} size={90} stage={dragon.stage} animate />
                <h2 style={{ fontSize: 14, color: pEl.color, marginTop: 6 }}>{dragon.name} {dragon.title}</h2>
                <div style={{ fontSize: 10, color: "#888" }}>{pEl.emoji} {pEl.name} {evo.stage} \u00B7 Lv.{dragon.level}</div>
                <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 6, fontSize: 10, color: "#aaa", flexWrap: "wrap" }}>
                  <span>{"\u2694\uFE0F"}{dragon.attack}</span><span>{"\u{1F6E1}\uFE0F"}{dragon.defense}</span>
                  <span>{"\u{1F4A8}"}{dragon.speed}</span><span>{"\u2764\uFE0F"}{dragon.maxHp}</span>
                  <span>{"\u{1F48E}"}{dragon.maxMana}</span>
                </div>
                <div style={{ marginTop: 6, fontSize: 10, color: "#ffcc44" }}>
                  {"\u{1F4B0}"} {gold}g \u00B7 {"\u2B50"} {xp}/{xpNeeded} XP
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #222", marginBottom: 10 }}>
                {["stats", "shop", "tech", "bosses"].map(t => (
                  <button key={t} className={`tab ${hubTab === t ? "active" : ""}`} onClick={() => setHubTab(t)}>{t}</button>
                ))}
              </div>

              {hubTab === "stats" && (
                <div>
                  <HealthBar current={dragon.hp} max={dragon.maxHp} color="#44dd66" label="HP" />
                  <HealthBar current={dragon.mana} max={dragon.maxMana} color="#4488ff" label="MP" />
                  <HealthBar current={xp} max={xpNeeded} color="#ffcc44" label="XP" />
                  <div style={{ fontSize: 10, color: "#888", marginTop: 10, marginBottom: 6 }}>Training ({10 + dragon.level*3}g each)</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {[["attack","\u2694\uFE0F Attack"],["defense","\u{1F6E1}\uFE0F Defense"],["speed","\u{1F4A8} Speed"],["maxHp","\u2764\uFE0F Vitality"],["maxMana","\u{1F48E} Arcane"]].map(([s,l]) => (
                      <button key={s} className="btn" onClick={() => train(s, 10+dragon.level*3)} disabled={gold < 10+dragon.level*3} style={{ padding: 8, fontSize: 10 }}>{l}</button>
                    ))}
                    <button className="btn" onClick={() => { const d = {...dragon, hp: dragon.maxHp, mana: dragon.maxMana}; setDragon(d); }} style={{ padding: 8, fontSize: 10 }}>
                      {"\u{1F3D5}\uFE0F"} Rest at Camp
                    </button>
                  </div>
                  <button className="btn" onClick={deleteSave} style={{ marginTop: 12, width: "100%", fontSize: 9, color: "#aa4444", padding: 6 }}>
                    {"\u{1F5D1}\uFE0F"} Delete Save & Restart
                  </button>
                </div>
              )}

              {hubTab === "shop" && (
                <div style={{ display: "grid", gap: 6 }}>
                  {SHOP_ITEMS.map(item => {
                    const owned = inventory.includes(item.name);
                    const canBuy = gold >= item.cost && dragon.level >= item.req && !owned;
                    return (
                      <button key={item.name} className="btn" onClick={() => buyItem(item)} disabled={!canBuy} style={{
                        padding: "8px 10px", textAlign: "left", display: "flex", justifyContent: "space-between",
                        borderColor: owned ? "#44dd6644" : canBuy ? "#44ff8844" : "#333",
                      }}>
                        <div><span>{item.icon}</span> <span style={{ fontWeight: 700, color: owned ? "#44dd66" : "#eee" }}>{item.name}</span> <span style={{ fontSize: 9, color: "#888" }}>{item.desc} Req Lv.{item.req}</span></div>
                        <span style={{ color: owned ? "#44dd66" : "#ffcc44" }}>{owned ? "\u2713" : `${item.cost}g`}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {hubTab === "tech" && (
                <div style={{ display: "grid", gap: 6 }}>
                  {TECHNIQUES.map(tech => {
                    const learned = techniques.includes(tech.name);
                    const canLearn = gold >= tech.price && dragon.level >= tech.req && !learned;
                    return (
                      <button key={tech.name} className="btn" onClick={() => learnTech(tech)} disabled={!canLearn} style={{
                        padding: "8px 10px", textAlign: "left", display: "flex", justifyContent: "space-between",
                        borderColor: learned ? "#44dd6644" : canLearn ? "#44ff8844" : "#333",
                      }}>
                        <div><span>{tech.icon}</span> <span style={{ fontWeight: 700, color: learned ? "#44dd66" : "#eee" }}>{tech.name}</span> <span style={{ fontSize: 9, color: "#888" }}>{tech.desc} {tech.dmg > 0 ? `${tech.dmg}dmg ` : ""}{tech.cost}mp Req Lv.{tech.req}</span></div>
                        <span style={{ color: learned ? "#44dd66" : "#ffcc44" }}>{learned ? "\u2713" : `${tech.price}g`}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {hubTab === "bosses" && (
                <div style={{ display: "grid", gap: 6 }}>
                  {BOSSES.map((b, i) => {
                    const defeated = bossesDefeated.includes(b.name);
                    const available = dragon.level >= b.level && !defeated;
                    return (
                      <button key={b.name} className={available ? "btn btn-boss" : "btn"} onClick={() => available && startBattle(i)} disabled={!available} style={{
                        padding: 10, textAlign: "left", borderColor: defeated ? "#44dd6644" : available ? "#aa3311" : "#333",
                      }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: defeated ? "#44dd66" : available ? "#ff8844" : "#666" }}>
                          {"\u{1F480}"} {b.name} {defeated && "\u2713 SLAIN"}
                        </div>
                        <div style={{ fontSize: 9, color: "#888" }}>{ELEMENTS[b.element]?.emoji} Lv.{b.level} \u00B7 {b.hp}HP \u00B7 {b.gold}g</div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <button className="btn btn-primary" onClick={() => startBattle()} style={{ flex: 1, padding: 12, fontSize: 12, letterSpacing: 1 }}>
                  {"\u2694\uFE0F"} EXECUTE_BATTLE.EXE
                </button>
              </div>
            </div>
          )}

          {/* ══════ HATCHERY ══════ */}
          {currentView === "hatchery" && (
            <div>
              <FelixComms message={felixMsg} mood={felixMood} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15 }}>
                {/* Essence Inventory */}
                <div style={UI.panel}>
                  <div style={UI.heading}>// ESSENCE_INVENTORY</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {Object.entries(ELEMENTS).map(([key, el]) => (
                      <button key={key} onClick={() => { if (essences[key] >= 5 && !isCompiling) { if (!slotA) setSlotA(key); else if (!slotB) setSlotB(key); } }}
                        className="btn" style={{
                          borderColor: slotA === key || slotB === key ? el.color : "#333",
                          opacity: essences[key] < 5 ? 0.3 : 1, padding: "8px 10px",
                        }}>
                        <span style={{ fontSize: 14 }}>{el.emoji}</span>
                        <span style={{ fontSize: 10, color: el.color, marginLeft: 6 }}>{essences[key]}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {/* DNA Editor */}
                <div style={{ ...UI.panel, textAlign: "center" }}>
                  <div style={UI.heading}>// DNA_SPLICER.EXE</div>
                  <div style={{ display: "flex", gap: 15, justifyContent: "center", margin: "20px 0" }}>
                    {[slotA, slotB].map((slot, i) => (
                      <div key={i} style={{
                        width: 70, height: 70, background: "#080808",
                        border: `1px dashed ${slot ? ELEMENTS[slot].color : "#333"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 24, boxShadow: slot ? `0 0 15px ${ELEMENTS[slot].color}22` : "none",
                      }}>
                        {slot ? ELEMENTS[slot].emoji : "\u2610"}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                    <button className="btn" onClick={() => { setSlotA(null); setSlotB(null); }}>CLEAR</button>
                    <button className="btn btn-primary" onClick={compileDNA} disabled={!slotA || !slotB || isCompiling} style={{ padding: "10px 20px" }}>
                      {isCompiling ? "COMPILING..." : "COMPILE_SEQUENCE.SH"}
                    </button>
                  </div>
                </div>
              </div>
              {/* Hatched collection */}
              {collection.length > 0 && (
                <div style={{ ...UI.panel, marginTop: 15 }}>
                  <div style={UI.heading}>// SPECIMEN_ROSTER ({collection.length})</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
                    {collection.map(d => (
                      <div key={d.id} style={{ ...UI.panel, background: "#080808", textAlign: "center", padding: 10 }}>
                        <DragonSprite element={d.element} size={44} stage={d.stage} animate />
                        <div style={{ fontSize: 9, fontWeight: "bold", marginTop: 4, color: ELEMENTS[d.element]?.color }}>{d.name}</div>
                        <div style={{ fontSize: 8, color: "#666" }}>ATK:{d.attack} HP:{d.hp}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════ JOURNAL ══════ */}
          {currentView === "journal" && (
            <JournalView collection={collection} />
          )}

          {/* ══════ WORLD BOSS ══════ */}
          {currentView === "world_boss" && (
            <div style={{ maxWidth: 700, margin: "0 auto" }}>
              <FelixComms message={felixMsg} mood="danger" />
              <div style={{ ...UI.panel, textAlign: "center", border: "1px solid #ff4422", marginBottom: 15 }}>
                <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle, #ff442222 0%, transparent 70%)", pointerEvents: "none" }} />
                <h1 style={{ fontSize: 28, margin: "10px 0", color: "#fff", textShadow: "0 0 10px #f00", position: "relative" }}>{WORLD_BOSS.name}</h1>
                <div style={{ width: "100%", height: 20, background: "#111", border: "1px solid #333", marginTop: 15, position: "relative" }}>
                  <div style={{ height: "100%", width: `${(worldBossHp / WORLD_BOSS.maxHp) * 100}%`, background: "#ff4422", transition: "width 0.3s" }} />
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>
                    {worldBossHp.toLocaleString()} / {WORLD_BOSS.maxHp.toLocaleString()}
                  </div>
                </div>
                <button onClick={launchRosterAttack} disabled={collection.length === 0} className="btn" style={{
                  ...UI.btnActive("#ff4422"), width: "100%", marginTop: 15, padding: 16,
                }}>
                  EXECUTE_FULL_ROSTER_BARRAGE ({collection.length} units)
                </button>
              </div>
              {/* Deployed roster */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10 }}>
                {collection.map(d => (
                  <div key={d.id} style={{ ...UI.panel, background: "#080808", textAlign: "center", padding: 8 }}>
                    <DragonSprite element={d.element} size={36} stage={d.stage} />
                    <div style={{ fontSize: 8, marginTop: 4, color: ELEMENTS[d.element]?.color }}>{d.name}</div>
                    <div style={{ fontSize: 8, color: "#ff8844" }}>ATK: {d.attack}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══════ CHROMATIC HALL ══════ */}
          {currentView === "chromatic_hall" && (
            <div>
              <h2 style={{ ...UI.heading, color: "#ff00ff", marginBottom: 15 }}>// CHROMATIC_HALL_OF_FAME</h2>
              {hall.length === 0 && <div style={{ ...UI.text, textAlign: "center", padding: 40 }}>No entries yet. Defeat the World Boss to earn a place here.</div>}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 15 }}>
                {hall.map((entry, i) => (
                  <div key={i} style={{ ...UI.panel, border: "1px solid #ff00ff" }}>
                    <div style={{ display: "flex", gap: 15 }}>
                      <div className="ultra-glow" style={{ fontSize: 40 }}>{ELEMENTS[entry.element]?.emoji || "\u{1F47E}"}</div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: "bold", color: "#ff00ff" }}>{entry.name}</div>
                        <div style={{ fontSize: 9, color: "#666" }}>DISCOVERED: {entry.date}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>
    );
  }

  // ─── BATTLE ───
  if (screen === "battle" && dragon && enemy) {
    const pEl = ELEMENTS[dragon.element] || ELEMENTS.fire;
    const eEl = ELEMENTS[enemy.element] || ELEMENTS.fire;
    const arenaImg = battleArena || eEl.arena;
    const isNullVoid = nullVoidActive && enemy.isBoss && enemy.name.includes("Nihiloth");

    return (
      <div style={{ ...pg, maxWidth: 600, margin: "0 auto", padding: "0 15px 15px" }}>
        <style>{css}</style><Scanlines />{EvoOverlay}

        {/* Felix combat comms */}
        <div style={{ padding: "10px 0" }}>
          <FelixComms message={felixMsg} mood={felixMood} />
        </div>

        {/* Arena with image background */}
        <div style={{
          ...UI.panel, height: 340, position: "relative", overflow: "hidden",
          display: "flex", justifyContent: "space-around", alignItems: "flex-end",
          paddingBottom: 40, marginBottom: 10,
        }}>
          {/* Background image layer */}
          <div style={{
            position: "absolute", inset: 0,
            backgroundColor: eEl.bg || "#1a1a2e",
            backgroundImage: `url(${arenaImg})`,
            backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat",
            filter: isNullVoid ? "grayscale(1) invert(1) contrast(1.5)" : "brightness(0.6) contrast(1.2)",
            zIndex: 1,
          }} />
          {/* Elemental glow overlay */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, width: "100%", height: "50%",
            background: `linear-gradient(to top, ${eEl.color}22, transparent)`,
            zIndex: 2, pointerEvents: "none",
            mixBlendMode: "color-dodge",
          }} />
          {/* Arena label */}
          <div style={{ position: "absolute", top: 8, left: 10, background: "rgba(0,0,0,0.7)", padding: "3px 8px", fontSize: 9, color: "#44ff88", zIndex: 12 }}>
            AREA: {eEl.name.toUpperCase()}_ZONE {isNullVoid && "// NULL_VOID"}
          </div>

          {/* Weather overlay */}
          <WeatherOverlay weather={weather} lightning={lightning} />

          {/* Player sprite */}
          <div style={{ zIndex: 5, position: "relative", textAlign: "center" }}>
            <DragonSprite element={dragon.element} size={100} stage={dragon.stage} animate attacking={!isPlayerTurn} />
            <div style={{ fontSize: 9, color: pEl.color, fontWeight: 700, marginTop: 4 }}>{dragon.name} Lv.{dragon.level}</div>
          </div>
          <div style={{ fontSize: 18, color: "#444", zIndex: 5, alignSelf: "center" }}>{"\u2694\uFE0F"}</div>
          {/* Enemy sprite — corrupted NPCs use dedicated sprites or glitch filter */}
          <div style={{ zIndex: 5, position: "relative", textAlign: "center" }}>
            {enemy.corruptedSprite ? (
              <CorruptedNpcSprite sprite={enemy.corruptedSprite} filter={enemy.corruptedFilter} size={100} flip animate />
            ) : (
              <div style={enemy.isCorrupted ? { filter: enemy.corruptedFilter, animation: "pulse 1.5s ease-in-out infinite" } : {}}>
                <DragonSprite element={enemy.element} size={100} flip animate attacking={isPlayerTurn} />
              </div>
            )}
            <div style={{ fontSize: 9, color: eEl.color, fontWeight: 700, marginTop: 4 }}>
              {enemy.isCorrupted && (enemy.corruptedEmoji + " ")}{enemy.name} Lv.{enemy.level} {enemy.isBoss && "\u{1F480}"}
            </div>
          </div>

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

        {!battleOver && (
          <div style={{ textAlign: "center", fontSize: 10, color: isPlayerTurn ? "#44ff88" : "#dd6644", marginBottom: 6 }}>
            {isPlayerTurn ? "\u25B6 YOUR TURN" : "\u23F3 ENEMY TURN..."}
          </div>
        )}

        <BattleLog log={battleLog} />

        {!battleOver && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, marginTop: 8 }}>
            {(dragon.abilities || []).map((a, i) => (
              <button key={i} className="btn" onClick={() => playerAction(a)} disabled={!isPlayerTurn || dragon.mana < a.cost} style={{
                textAlign: "left", padding: "6px 8px",
                borderColor: gpCursor === i ? "#44ff88" : isPlayerTurn && dragon.mana >= a.cost ? pEl.color + "88" : "#333",
                boxShadow: gpCursor === i ? "0 0 8px #44ff8844" : "none",
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: isPlayerTurn && dragon.mana >= a.cost ? "#eee" : "#555" }}>{gpCursor === i ? "\u25B6 " : ""}{a.icon || "\u{1F52E}"} {a.name}</div>
                <div style={{ fontSize: 8, color: "#666" }}>{a.dmg > 0 ? `${a.dmg}dmg ` : ""}{a.cost}mp</div>
              </button>
            ))}
            <button className="btn" onClick={() => playerAction({ name: "Rest", dmg: 0, cost: 0, type: "rest", value: 10, manaValue: 12, icon: "\u{1F4A4}", fx: "heal" })} disabled={!isPlayerTurn} style={{ gridColumn: "1/-1", textAlign: "center", padding: 4, borderColor: gpCursor === (dragon.abilities||[]).length ? "#44ff88" : undefined, boxShadow: gpCursor === (dragon.abilities||[]).length ? "0 0 8px #44ff8844" : "none" }}>
              <span style={{ fontSize: 9 }}>{gpCursor === (dragon.abilities||[]).length ? "\u25B6 " : ""}{"\u{1F4A4}"} Rest (+10 HP, +12 MP)</span>
            </button>
            <button className="btn" onClick={() => playerAction({ name: "Focus", dmg: 0, cost: 0, type: "focus", manaValue: 25, icon: "\u{1F9D8}", fx: "buff" })} disabled={!isPlayerTurn} style={{ gridColumn: "1/-1", textAlign: "center", padding: 4, borderColor: gpCursor === (dragon.abilities||[]).length + 1 ? "#44ff88" : undefined, boxShadow: gpCursor === (dragon.abilities||[]).length + 1 ? "0 0 8px #44ff8844" : "none" }}>
              <span style={{ fontSize: 9 }}>{gpCursor === (dragon.abilities||[]).length + 1 ? "\u25B6 " : ""}{"\u{1F9D8}"} Focus (+25 MP)</span>
            </button>
          </div>
        )}

        {battleOver && (
          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
            <button className="btn btn-primary" onClick={() => startBattle()} style={{ flex: 1, fontSize: 11 }}>{"\u2694\uFE0F"} FIGHT AGAIN</button>
            <button className="btn" onClick={() => setScreen("hub")} style={{ flex: 1, fontSize: 11 }}>{"\u{1F3E0}"} RETURN</button>
          </div>
        )}
      </div>
    );
  }

  return null;
}

// ─── JOURNAL SUB-VIEW ───
function JournalView({ collection }) {
  const [selected, setSelected] = useState(0);
  if (collection.length === 0) return <div style={{ ...UI.text, textAlign: "center", padding: 40 }}>No specimens in database.</div>;
  const active = collection[selected] || collection[0];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 15 }}>
      <div style={UI.panel}>
        <div style={UI.heading}>SPECIMEN_DATABASE</div>
        {collection.map((d, i) => (
          <div key={d.id} onClick={() => setSelected(i)} style={{
            display: "flex", alignItems: "center", padding: 10, borderBottom: "1px solid #222",
            cursor: "pointer", background: selected === i ? "#1a1a1a" : "transparent",
          }}>
            <div style={{ width: 30, fontSize: 16 }}>{ELEMENTS[d.element]?.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: selected === i ? "#44ff88" : "#eee", fontWeight: "bold" }}>{d.name}</div>
              <div style={{ fontSize: 9, color: "#888" }}>{d.id} // STAGE_{d.stage}</div>
            </div>
            <div style={{ color: selected === i ? "#44ff88" : "#333" }}>{"\u203A"}</div>
          </div>
        ))}
      </div>
      <div style={UI.panel}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 10, color: ELEMENTS[active.element]?.color }}>{active.element.toUpperCase()}_CLASS_ENTITY</div>
            <h2 style={{ fontSize: 22, fontWeight: 900, margin: "4px 0", letterSpacing: -1 }}>{active.name}</h2>
          </div>
          <div style={{ background: "#222", padding: "4px 10px", fontSize: 10, height: "fit-content" }}>UID: {active.id}</div>
        </div>
        <div style={{ height: 180, background: "#050505", border: "1px solid #222", margin: "15px 0", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
          <div style={{ position: "absolute", top: 8, right: 8, fontSize: 9, color: "#444" }}>[RENDER_V2.0]</div>
          <DragonSprite element={active.element} size={100} stage={active.stage} animate />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[
            ["VITALITY", active.hp, active.maxHp],
            ["POWER", active.attack, null],
            ["DEFENSE", active.defense, null],
          ].map(([label, val, max]) => (
            <div key={label} style={{ background: "#0a0a0a", padding: 10, border: "1px solid #222" }}>
              <div style={{ fontSize: 9, color: "#888", marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 16, fontWeight: "bold" }}>{val}{max ? <span style={{ fontSize: 10, color: "#555" }}> / {max}</span> : ""}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, fontSize: 10, color: "#666", lineHeight: 1.6, borderLeft: "2px solid #333", paddingLeft: 12, fontStyle: "italic" }}>
          "Subject shows significant cellular density in Stage {active.stage}. Data streams indicate high compatibility with current battle sub-routines."
        </div>
      </div>
    </div>
  );
}
