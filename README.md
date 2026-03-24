# 🐉 Dragon Forge — Dragon Simulator

**Build · Train · Evolve · Battle**

A feature-rich dragon simulator game built with React. Create your own dragon, train it, buy gear, learn techniques, evolve through stages, and battle enemies and epic bosses!

![Dragon Forge](https://img.shields.io/badge/Dragon-Forge-ff4422?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHRleHQgeT0iMjAiIGZvbnQtc2l6ZT0iMjAiPvCfkok8L3RleHQ+PC9zdmc+)

## Features

- **🐉 Dragon Creation** — Choose from 5 elements (Fire, Ice, Lightning, Nature, Shadow), 5 body types, 10 color schemes, and custom titles
- **⚔️ Turn-Based Combat** — Elemental strengths/weaknesses, unique abilities per element, floating damage numbers, and spell particle effects
- **🏋️ Training System** — Spend gold to train Attack, Defense, Speed, HP, and Mana
- **🛒 Shop** — 10 weapons and gear items that permanently boost stats
- **📚 Techniques** — 10 learnable combat moves including Frenzy (multi-hit), Venom Bite (poison DOT), Life Steal, Meteor Strike, and more
- **💀 Boss Battles** — 5 unique boss dragons with signature abilities and massive rewards
- **🦎 Evolution System** — Evolve through Hatchling → Juvenile → Adult → Elder → Mythic stages with stat bonuses
- **🎭 Battle Arenas** — 6 animated arena environments (Volcanic Crater, Frozen Tundra, Storm Peaks, Ancient Forest, Shadow Realm, Colosseum)
- **✨ Spell Effects** — Particle animations for every ability type
- **💾 Persistent Save** — Auto-saves progress between sessions
- **🧘 Balanced Mana System** — Rest restores HP+MP, Focus restores MP, passive mana regen each turn

## Running Locally

This is a React component (JSX). To run it:

### Option 1: Use with Vite + React

```bash
npm create vite@latest dragon-forge -- --template react
cd dragon-forge
# Copy dragon_simulator.jsx into src/
# Update src/App.jsx to import and render DragonSimulator
npm install
npm run dev
```

### Option 2: Use in any React project

```jsx
import DragonSimulator from './dragon_simulator';

function App() {
  return <DragonSimulator />;
}
```

## Tech Stack

- React (hooks-based, no class components)
- Inline SVG dragon sprites with procedural generation
- CSS animations for spell effects and battle feedback
- Web Storage API for persistent saves

## Game Guide

1. **Create** your dragon — pick element, body type, color, and name
2. **Train** at the hub to boost stats (costs gold)
3. **Battle** random enemies to earn gold and XP
4. **Buy gear** in the Shop for permanent stat boosts
5. **Learn techniques** for powerful new combat moves
6. **Challenge bosses** when you reach their level requirement
7. **Evolve** at levels 5, 10, 15, and 20 for major power spikes

### Elemental Matchups

| Element   | Strong Against | Weak Against |
|-----------|---------------|--------------|
| 🔥 Fire   | 🌿 Nature     | ❄️ Ice       |
| ❄️ Ice    | 🔥 Fire       | ⚡ Lightning |
| ⚡ Lightning | ❄️ Ice     | 🌿 Nature    |
| 🌿 Nature | ⚡ Lightning   | 🔥 Fire      |
| 🌑 Shadow | 🔥 Fire       | 🌿 Nature    |

## License

MIT
