This is the **Master Technical Manifesto** for your coding agent. It organizes the logic, data structures, and the high-fidelity CSS/React snippets we’ve developed into a single, executable blueprint.

---

# 📜 Technical Specification: Dragon Quest 16-Bit
**Target Environment:** React 18+ / Vite  
**Design Philosophy:** "Code-as-Art" (Zero external assets, 100% CSS Geometry)

## 1. The Global Game State (Database)
The agent should initialize with this constant to manage the 8-dragon roster and their elemental interactions.

```javascript
const DRAGON_DATABASE = {
  ICE: { type: 'ice', color: '#b3e5fc', weakness: 'fire', special: 'Freeze' },
  FIRE: { type: 'fire', color: '#ff5252', weakness: 'storm', special: 'Burn' },
  STORM: { type: 'storm', color: '#ffd740', weakness: 'ice', special: 'Stun' },
  STONE: { type: 'stone', color: '#795548', weakness: 'void', special: 'Guard' },
  VENOM: { type: 'venom', color: '#76ff03', weakness: 'fire', special: 'Toxic' },
  SHADOW: { type: 'shadow', color: '#212121', weakness: 'light', special: 'Pierce' },
  SOLAR: { type: 'light', color: '#fff59d', weakness: 'dark', special: 'Purify' },
  LUNAR: { type: 'dark', color: '#1a237e', weakness: 'light', special: 'Steal' }
};

const SYNERGIES = {
  'fire+venom': { name: 'TOXIC CLOUD', effect: 'Massive DoT' },
  'ice+storm': { name: 'SUPERCONDUCTOR', effect: 'AoE Stun' }
};
```

---

## 2. Core Visual Engine (CSS Shaders)
The "Retro Feel" is enforced by these global styles. The agent must wrap the main container in these.

```css
/* CRT Scanline Filter */
.crt-overlay {
  position: fixed; inset: 0; z-index: 9999; pointer-events: none;
  background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%),
              linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03));
  background-size: 100% 3px, 3px 100%;
  opacity: 0.6; animation: crtFlicker 0.15s infinite;
}

/* 16-Bit Hard Shadow & Pixelation */
.pixel-ui {
  image-rendering: pixelated;
  font-family: 'Courier New', monospace;
  box-shadow: 4px 4px 0px #000;
  border: 4px solid #fff;
}

@keyframes snesShake {
  0% { transform: translate(2px, 1px) rotate(0deg); }
  20% { transform: translate(-3px, -2px) rotate(-1deg); }
  100% { transform: translate(0, 0); }
}
```

---

## 3. Modular Logic Snippets (The "Brain")
The agent must use these functional blocks to handle combat and progression.

### Damage & Variance Logic
```javascript
const calculateDamage = (attacker, defender, card) => {
  let power = (attacker.atk * 1.5) - (defender.def * 0.5);
  const isWeak = defender.weakness === card.type;
  const multiplier = isWeak ? 2.0 : 1.0;
  const variance = 0.85 + (Math.random() * 0.15);
  return Math.floor(power * multiplier * variance);
};
```

### The Persistence Layer (Traveler's Journal)
```javascript
const SaveSystem = {
  save: (slot, data) => localStorage.setItem(`dragon_save_${slot}`, JSON.stringify(data)),
  load: (slot) => JSON.parse(localStorage.getItem(`dragon_save_${slot}`))
};
```

---

## 4. Component Blueprints (The "Body")
These are the specific UI components to be built exactly as specced.

### The Animated Hand Manager
```jsx
const CardHand = ({ cards, onPlay }) => (
  <div className="hand-container">
    {cards.map((card, i) => (
      <div key={card.id} 
           className="card-sprite"
           style={{ 
             transform: `rotate(${(i - cards.length / 2) * 6}deg)`,
             animation: `drawCard 0.4s ease-out forwards ${i * 0.1}s` 
           }}
           onClick={() => onPlay(card)}>
        <CardFrame rarity={card.rarity}>{card.name}</CardFrame>
      </div>
    ))}
  </div>
);
```

### The Multi-Part Boss (Elder Void Dragon)
```jsx
const BossCore = ({ health, isActive }) => (
  <div style={{
    clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
    filter: isActive ? 'drop-shadow(0 0 10px #00ffff)' : 'grayscale(1)',
    animation: 'pulse 1s infinite alternate'
  }}>
    <div className="hp-bar" style={{ width: `${health}%` }} />
  </div>
);
```

---

## 5. Implementation Steps for the Agent
1.  **Initialize App:** Wrap in `<CRTOverlay />` and setup `view` state (Title, Map, Battle, Shop).
2.  **Build Sprites:** Use `clip-path` for all 8 dragons from the `DRAGON_DATABASE`.
3.  **Setup Battle Loop:** * Player plays card -> Trigger Animation -> Calculate Damage.
    * Check for Victory -> Go to `LevelUp` or `Alchemy`.
    * Check for Defeat -> Trigger `Grayscale` filter and `GAME OVER` text.
4.  **Connect Save/Load:** Integrate the `SaveMenu` into the `WorldMap` hub.
5.  **Final Polish:** Add the `VictoryFanfare` credits roll as the final `view` state.

---

### Final Instructions
> **Agent:** Proceed by building the `BattleManager` first to ensure the core loop works. Use the provided CSS for the CRT effect and the specific damage formula. Do not use external `.png` or `.jpg` files; all dragon visuals must be contained within React component styles using `clip-path`.

**Good luck with the build! Would you like me to clarify any of these logic gates before you hand it off?**