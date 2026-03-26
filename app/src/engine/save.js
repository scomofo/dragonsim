import { WORLD_BOSS } from '../data/creatures';

export function saveGameData(state) {
  try {
    localStorage.setItem("dragonforge-save", JSON.stringify(state));
  } catch (e) { console.error("Save failed", e); }
}

export function loadGameData() {
  try {
    const raw = localStorage.getItem("dragonforge-save");
    if (raw) return JSON.parse(raw);
  } catch (e) { console.error("Load failed", e); }
  return null;
}

export function deleteGameData() {
  localStorage.removeItem("dragonforge-save");
}
