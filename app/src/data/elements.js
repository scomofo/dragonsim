// ─── ELEMENTAL MATRIX (Master Specs) ───
// 6 core elements with strengths/weaknesses per spec + void endgame
export const ELEMENTS = {
  fire:      { name: "Magma",   emoji: "\u{1F525}", color: "#ff4422", accent: "#ff8844", bg: "#331108", weakness: "ice",       strong: ["nature", "stone"],         arena: "/arenas/fire.png",
    lore: "Scorchers of the Depths. Born from cracked lava, they serve as the Forge's thermal reactors. Their sustained magma breath regulates the simulation's core temperature.",
    role: "Thermal Reactor" },
  ice:       { name: "Ice",     emoji: "\u2744\uFE0F",  color: "#44bbff", accent: "#88ddff", bg: "#081828", weakness: "fire",      strong: ["venom", "lightning"],    arena: "/arenas/ice.png",
    lore: "Hunters of the Frost. Guardians of the Forge's cold-storage archives. Their cryo-breath stabilizes critical sectors during high-stress simulation events.",
    role: "Cryo-Stabilizer" },
  lightning: { name: "Static",  emoji: "\u26A1",    color: "#ffdd00", accent: "#ffee66", bg: "#282008", weakness: "stone",     strong: ["fire", "venom"],         arena: "/arenas/storm.png",
    lore: "Masters of Energy. The electrical conduits of the Forge, channeling power between Solar sources and Magma reactors. Fast, unpredictable, and devastating.",
    role: "Energy Conduit" },
  nature:    { name: "Venom",   emoji: "\u{1F40D}", color: "#76ff03", accent: "#88ff99", bg: "#082810", weakness: "lightning", strong: ["shadow", "stone"],   arena: "/arenas/venom.png",
    lore: "The Corrosive Ones. They emerged from the swamps of corrupted data, dissolving unstable code with their acid. Patient predators who outlast their prey.",
    role: "Code Purifier" },
  shadow:    { name: "Shadow",  emoji: "\u{1F311}", color: "#9944ff", accent: "#bb88ff", bg: "#180828", weakness: "nature",    strong: ["lightning", "stone"],     arena: "/arenas/shadow.png",
    lore: "Keepers of the Void. Shadow stalkers that inhabit the spaces between processed data. They move through the simulation's blind spots, unseen until they strike.",
    role: "Void Walker" },
  stone:     { name: "Stone",   emoji: "\u{1FAA8}", color: "#a1887f", accent: "#bcaaa4", bg: "#1a1008", weakness: "fire",      strong: ["lightning", "ice"],       arena: "/arenas/stone.png",
    lore: "The Unyielding Foundation. Carved from the bedrock of the Forge's architecture, they anchor reality itself. What they lack in speed, they repay in endurance.",
    role: "Foundation Anchor" },
};

// Void element for endgame
export const VOID_ELEMENT = { name: "Void", emoji: "\u{1F47E}", color: "#ffffff", accent: "#cccccc", bg: "#000000", arena: "/arenas/shadow.png" };
export const BONUS_ARENAS = ["/arenas/quantum_forge.png", "/arenas/asteroid_field.png", "/arenas/gravity_chamber.png"];
