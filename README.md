<p align="center">
  <img src="https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/Vite-Latest-646cff?style=flat-square&logo=vite" />
  <img src="https://img.shields.io/badge/Art-16_Bit_Pixel-ff6b6b?style=flat-square" />
</p>

# DragonSim

> 16-bit retro RPG dragon simulator with hatching, combat, forging, and adventure — supervised by Professor Felix

---

### Highlights

| Feature | Description |
|:--------|:------------|
| **Dragon Hatching** | Hatch eggs from 6 elemental types with unique traits and shiny variants |
| **Combat Arena** | Turn-based battles against procedural NPC enemies across themed arenas |
| **Dragon Forge** | Combine dragons for evolution and stat enhancement |
| **Sprite Animations** | Custom pixel art sprite sheets for each dragon type |
| **Multiple Arenas** | Ice, Fire, Shadow, Storm, Venom, Stone, Quantum Forge, Asteroid Field |
| **Sound Design** | Original audio — attack SFX, hatch chimes, ambient music |
| **NPC Bestiary** | 10 enemy types: Bit Wraith, Crypto Crab, Glitch Hydra, and more |

---

### Tech Stack

```
Frontend        React 19  +  Vite
Art Style       16-Bit Cyber-Retro Pixel Art
Audio           WAV/MP3 — original attack, hatch, and UI sounds
Sprites         Custom PNG sprite sheets per dragon type
Assets          AI-generated with hand-tuned pixel art pipeline
```

### Dragon Types

| Element | Color | Strengths |
|:--------|:------|:----------|
| Fire | Red/Orange | High attack, burn damage |
| Ice | Blue/Cyan | Defensive, freeze effects |
| Shadow | Purple/Dark | Evasion, critical hits |
| Storm | Yellow/Electric | Speed, chain lightning |
| Venom | Green | DOT, poison stacks |
| Stone | Brown/Grey | Tank, high defense |

### Quick Start

```bash
cd app
npm install
npm run dev                    # Vite dev server
```

### Project Structure

```
dragonsim/
  app/
    src/
      dragon_simulator.jsx     # Main game component
      App.jsx                  # App wrapper
    public/
      arenas/                  # Arena background art (12 arenas)
      sprites/                 # Dragon sprite sheets (6 types + NPCs)
      eggs/                    # Hatchling egg art
      audio/                   # Sound effects (15+ SFX)
  assets/                      # Raw dragon art and reference images
  Dragon Simulator Master Specs.md
```

### Art Pipeline

Dragon assets are generated using a structured prompt system (`asset_generation_prompts.json`) with extraction scripts for sprite sheets, arenas, and sound generation.

---

*Built by Scott Morley | Supervised by Professor Felix*
