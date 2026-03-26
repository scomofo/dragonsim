// ─── ABILITIES ───
export const ABILITIES = {
  fire: [
    { name: "Magma Bolt", dmg: 18, cost: 15, type: "attack", icon: "\u{1F525}", fx: "fire", desc: "Hurl a blazing fireball" },
    { name: "Inferno", dmg: 30, cost: 28, type: "attack", icon: "\u{1F30B}", fx: "fire", desc: "Unleash a firestorm" },
    { name: "Flame Shield", dmg: 0, cost: 12, type: "buff", value: 3, stat: "defense", icon: "\u{1F6E1}\uFE0F", fx: "buff", desc: "+3 DEF this fight" },
    { name: "Searing Drain", dmg: 14, cost: 18, type: "drain", healPct: 0.4, icon: "\u{1F480}", fx: "fire", desc: "Drain life from foe" },
  ],
  ice: [
    { name: "Frost Bolt", dmg: 16, cost: 13, type: "attack", icon: "\u2744\uFE0F", fx: "ice", desc: "Launch a bolt of ice" },
    { name: "Blizzard", dmg: 28, cost: 26, type: "attack", icon: "\u{1F328}\uFE0F", fx: "ice", desc: "Summon a blizzard" },
    { name: "Ice Armor", dmg: 0, cost: 14, type: "buff", value: 4, stat: "defense", icon: "\u{1F9CA}", fx: "buff", desc: "+4 DEF this fight" },
    { name: "Glacial Heal", dmg: 0, cost: 20, type: "heal", value: 25, icon: "\u{1F48E}", fx: "heal", desc: "Restore 25 HP" },
  ],
  lightning: [
    { name: "Static Spark", dmg: 14, cost: 10, type: "attack", icon: "\u26A1", fx: "lightning", desc: "Quick lightning strike" },
    { name: "Thunder Crash", dmg: 32, cost: 30, type: "attack", icon: "\u{1F329}\uFE0F", fx: "lightning", desc: "Devastating thunder" },
    { name: "Static Charge", dmg: 0, cost: 12, type: "buff", value: 3, stat: "attack", icon: "\u{1F4AB}", fx: "buff", desc: "+3 ATK this fight" },
    { name: "Chain Lightning", dmg: 20, cost: 22, type: "attack", icon: "\u{1F517}", fx: "lightning", desc: "Chaining shock" },
  ],
  nature: [
    { name: "Venom Spit", dmg: 15, cost: 12, type: "attack", icon: "\u{1F40D}", fx: "nature", desc: "Spit corrosive venom" },
    { name: "Toxic Quake", dmg: 26, cost: 25, type: "attack", icon: "\u{1F30D}", fx: "nature", desc: "Shake the ground" },
    { name: "Regenerate", dmg: 0, cost: 18, type: "heal", value: 30, icon: "\u{1F331}", fx: "heal", desc: "Restore 30 HP" },
    { name: "Thorn Armor", dmg: 0, cost: 14, type: "buff", value: 4, stat: "defense", icon: "\u{1F335}", fx: "buff", desc: "+4 DEF this fight" },
  ],
  shadow: [
    { name: "Shadow Bolt", dmg: 17, cost: 14, type: "attack", icon: "\u{1F311}", fx: "shadow", desc: "Dark energy blast" },
    { name: "Void Rend", dmg: 34, cost: 32, type: "attack", icon: "\u{1F573}\uFE0F", fx: "shadow", desc: "Tear through reality" },
    { name: "Dark Pact", dmg: 0, cost: 10, type: "buff", value: 4, stat: "attack", icon: "\u{1F4FF}", fx: "buff", desc: "+4 ATK this fight" },
    { name: "Soul Siphon", dmg: 16, cost: 20, type: "drain", healPct: 0.5, icon: "\u{1F441}\uFE0F", fx: "shadow", desc: "Steal life force" },
  ],
  stone: [
    { name: "Rock Hurl", dmg: 16, cost: 13, type: "attack", icon: "\u{1FAA8}", fx: "stone", desc: "Launch a boulder" },
    { name: "Avalanche", dmg: 29, cost: 27, type: "attack", icon: "\u{1F3D4}\uFE0F", fx: "stone", desc: "Crush with rocks" },
    { name: "Stone Skin", dmg: 0, cost: 12, type: "buff", value: 5, stat: "defense", icon: "\u{1F6E1}\uFE0F", fx: "buff", desc: "+5 DEF this fight" },
    { name: "Earth Mend", dmg: 0, cost: 18, type: "heal", value: 28, icon: "\u{1F33F}", fx: "heal", desc: "Restore 28 HP" },
  ],
};

// ─── TECHNIQUES ───
export const TECHNIQUES = [
  { name: "Tail Cleave",   dmg: 22, cost: 16, type: "attack", icon: "\u{1F98E}", fx: "fire",    desc: "Sweep with tail",    req: 3,  price: 80 },
  { name: "Frenzy",        dmg: 10, cost: 22, type: "multi", hits: 3, icon: "\u{1F4A2}", fx: "fire", desc: "3-hit combo",   req: 6,  price: 150 },
  { name: "Venom Bite",    dmg: 12, cost: 15, type: "poison", dot: 5, turns: 3, icon: "\u{1F40D}", fx: "nature", desc: "Poison for 3 turns", req: 4, price: 100 },
  { name: "Battle Roar",   dmg: 0,  cost: 18, type: "roar", atkVal: 3, defVal: 2, icon: "\u{1F981}", fx: "buff", desc: "+3 ATK +2 DEF", req: 5, price: 120 },
  { name: "Life Steal",    dmg: 20, cost: 22, type: "drain", healPct: 0.5, icon: "\u{1F9DB}", fx: "shadow", desc: "Steal 50% as HP", req: 7, price: 160 },
  { name: "Dragon Breath", dmg: 35, cost: 35, type: "attack", icon: "\u{1F409}", fx: "fire",    desc: "Devastating breath", req: 9,  price: 200 },
  { name: "Iron Scales",   dmg: 0,  cost: 15, type: "buff", value: 6, stat: "defense", icon: "\u{1FAA8}", fx: "buff", desc: "+6 DEF this fight", req: 8, price: 140 },
  { name: "War Cry",       dmg: 0,  cost: 12, type: "buff", value: 5, stat: "attack", icon: "\u{1F4EF}", fx: "buff", desc: "+5 ATK this fight", req: 6, price: 130 },
  { name: "Meteor Strike",  dmg: 45, cost: 45, type: "attack", icon: "\u2604\uFE0F", fx: "fire", desc: "Call down a meteor", req: 14, price: 350 },
  { name: "Healing Surge",  dmg: 0,  cost: 25, type: "heal", value: 40, icon: "\u2728", fx: "heal", desc: "Restore 40 HP",   req: 10, price: 220 },
];
