import { ELEMENTS } from "../data/elements.js";
import { ABILITIES, TECHNIQUES } from "../data/abilities.js";
import { ENEMY_NAMES, CORRUPTED_NPCS, BOSSES } from "../data/creatures.js";
import { rand, pick } from "../utils/helpers.js";

export function generateEnemy(playerLevel, currentWeather = "clear") {
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

export function generateBoss(bossIndex) {
  const b = BOSSES[bossIndex];
  const abs = [...(ABILITIES[b.element] || ABILITIES.shadow), b.sig];
  return {
    name: b.name, element: b.element, level: b.level,
    hp: b.hp, maxHp: b.hp, mana: b.mana, maxMana: b.mana,
    attack: b.atk, defense: b.def, speed: b.spd,
    abilities: abs, gold: b.gold, xp: b.xp, isBoss: true,
  };
}
