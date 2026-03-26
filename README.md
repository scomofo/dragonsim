<p align="center">
  <img src="https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-6-646cff?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Art-16_Bit_Pixel-ff6b6b?style=for-the-badge&logo=aseprite&logoColor=white" />
  <img src="https://img.shields.io/badge/Audio-Original_SFX-f59e0b?style=for-the-badge&logo=audiomack&logoColor=white" />
</p>

<h1 align="center">🐉 DragonSim</h1>

<p align="center">
  <strong>16-bit retro RPG dragon simulator &mdash; hatch, battle, forge, and conquer</strong>
</p>

<p align="center">
  <em>Supervised by Professor Felix (Mad/Benevolent)</em>
</p>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🥚 Hatch & Raise
- **6 Elemental Types** &mdash; Fire, Ice, Shadow, Storm, Venom, Stone
- **Egg Hatching** &mdash; Unique traits and shiny variants
- **Dragon Forge** &mdash; Combine for evolution and stat boosts

</td>
<td width="50%">

### ⚔️ Battle
- **Turn-Based Combat** &mdash; Strategic elemental attacks
- **12 Arenas** &mdash; Themed battlegrounds with hazards
- **10 NPC Enemies** &mdash; Bit Wraith, Crypto Crab, Glitch Hydra...

</td>
</tr>
</table>

---

## 🐲 Dragon Types

| Element | Color | Specialty |
|:--------|:------|:----------|
| 🔥 **Fire** | Red / Orange | High attack, burn DoT |
| 🧊 **Ice** | Blue / Cyan | Defensive, freeze |
| 🌑 **Shadow** | Purple / Dark | Evasion, crits |
| ⚡ **Storm** | Yellow / Electric | Speed, chain lightning |
| 🧪 **Venom** | Green | Poison stacks |
| 🪨 **Stone** | Brown / Grey | Tank, high defense |

## 🗺️ Arenas

Fire Pit &bull; Ice Cavern &bull; Shadow Realm &bull; Storm Peak &bull; Venom Swamp &bull; Stone Temple &bull; Quantum Forge &bull; Asteroid Field &bull; Gravity Chamber &bull; and more...

---

## 🚀 Quick Start

```bash
cd app
npm install
npm run dev        # ⚡ Vite dev server
```

## 📁 Structure

```
dragonsim/
├── app/
│   ├── src/
│   │   ├── dragon_simulator.jsx    Main game component
│   │   └── App.jsx                 App wrapper
│   └── public/
│       ├── 🗺️ arenas/             Arena background art (12)
│       ├── 🐉 sprites/            Dragon sprite sheets (6 types)
│       │   └── npc/               Enemy sprite sheets (10)
│       ├── 🥚 eggs/               Hatchling art
│       └── 🔊 audio/              Sound effects (15+)
├── assets/                         Raw reference art
├── 📋 Dragon Simulator Master Specs.md
└── 🎨 asset_generation_prompts.json
```

## 🎨 Art Pipeline

Assets generated via structured AI prompts with extraction scripts:
- `extract_sprites.py` &mdash; Sprite sheet splitting
- `generate_arenas.py` &mdash; Arena art generation
- `generate_sounds.py` &mdash; Sound effect creation
- `standardize_dragons.py` &mdash; Sprite normalization

---

<p align="center">
  <sub>Built by Scott Morley &bull; Supervised by Professor Felix 🐱</sub>
</p>
