// ─── AUDIO ENGINE ───
// Drop .wav files into /public/audio/ matching these names and they auto-play.
// No files = no errors, just silence.
export const SFX = {
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
export const ATK_SFX = {
  fire: SFX.atkFire, ice: SFX.atkIce, lightning: SFX.atkLightning,
  nature: SFX.atkGeneric, shadow: SFX.atkGeneric, stone: SFX.atkGeneric,
};
