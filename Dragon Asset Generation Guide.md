# **DRAGON FORGE: ASSET GENERATION GUIDE v1.2**

## **1\. CHARACTER KEY: PROFESSOR FELIX**

**Reference:** Gemini\_Generated\_Image\_ric0vkric0vkric0.jpg

* Maintain messy white hair and asymmetrical green glowing goggles.

## **2\. ARENA REFERENCE (512x256)**

**Reference:** Gemini\_Generated\_Image\_nuu7q0nuu7q0nuu7.jpg

* **Visual Style:** Low-angle perspective, atmospheric lighting, and high-contrast foreground silhouettes.  
* **Arena Mapping:**  
  * **Volcanic Crag (Magma):** Red-glowing lava fissures, dark basalt pillars.  
  * **Crystalline Abyss (Ice):** Translucent cyan pillars, glowing blue floor.  
  * **Storm Citadel (Static):** Electrified floating ruins, dark storm clouds.  
  * **Toxic Grove (Venom):** Murky green silhouettes, glowing bio-luminescent pools.  
  * **The Null Void (Endgame):** The black-and-white digital fragment landscape from the reference image. This triggers when the simulation stability drops below 10%.

## **3\. UI INTEGRATION SPECS**

* **Ground Plane:** All dragon sprites must be anchored exactly at the y=180px mark (in a 256px tall image) to align with the perspective lines in the provided arena assets.  
* **Lighting Overlay:** Apply a CSS mix-blend-mode: color-dodge overlay to the dragon sprites matching the primary color of the arena (e.g., \#ff4422 for Magma).