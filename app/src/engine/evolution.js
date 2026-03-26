import { EVOLUTIONS } from "../data/creatures.js";

export function getEvolution(level) {
  let evo = EVOLUTIONS[0];
  for (const e of EVOLUTIONS) { if (level >= e.level) evo = e; }
  return evo;
}
