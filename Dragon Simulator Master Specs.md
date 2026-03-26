# **DRAGON SIMULATOR: TECHNICAL ARCHITECTURE & ASSET MANIFEST**

**Supervisor:** Professor Felix (Mad/Benevolent)

**Aesthetic:** 16-Bit Retro RPG / Cyber-Retro Pixel Art

## **1\. PROFESSOR FELIX (NARRATOR)**

* **Portrait:** Gemini\_Generated\_Image\_ric0vkric0vkric0.jpg  
* **Role:** Guidance, commentary on evolution, and "Null Void" warnings.

## **2\. THE ELEMENTAL MATRIX & ARENAS**

Each element is now hard-linked to a specific high-fidelity battle environment.

| Element | Strength (+) | Weakness (-) | Battle Arena File |
| :---- | :---- | :---- | :---- |
| **Magma** | Ice, Stone | Solar, Static | fire.jpg |
| **Static** | Magma, Venom | Stone, Shadow | storm.jpg |
| **Ice** | Venom, Solar | Magma, Stone | ice.jpg |
| **Venom** | Shadow, Solar | Static, Ice | venom.jpg |
| **Stone** | Static, Ice | Magma, Shadow | stone.jpg |
| **Shadow** | Static, Stone | Venom, Solar | shadow.jpg |

## **3\. COMBAT LOGIC**

* **Backgrounds:** Set via backgroundImage: url(${ELEMENTS\[enemy.element\].bg}).  
* **Perspective:** Sprites are anchored to the ground-plane visible in the JPGs (approx. 70% down from top).

## **4\. ENDGAME: THE NULL VOID**

* **Trigger:** Collection of 3 Stage IV (Elder) dragons.  
* **Visuals:** Uses shadow.jpg with a CSS grayscale(1) invert(1) glitch filter to simulate a total system crash.