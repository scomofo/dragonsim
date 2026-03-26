import { useEffect, useRef } from "react";

// ─── XBOX / USB GAMEPAD SUPPORT ───
// Standard Gamepad API mapping (Xbox One / Xbox Series controllers):
//   Button 0 = A      Button 1 = B      Button 2 = X      Button 3 = Y
//   Button 4 = LB     Button 5 = RB     Button 6 = LT     Button 7 = RT
//   Button 8 = Back   Button 9 = Start  Button 12 = DPad Up
//   Button 13 = DPad Down  Button 14 = DPad Left  Button 15 = DPad Right
//   Axes 0/1 = Left Stick  Axes 2/3 = Right Stick
export const GP = { A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7, BACK: 8, START: 9,
             UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15 };

export function useGamepad(callback) {
  const cbRef = useRef(callback);
  cbRef.current = callback;
  const prevRef = useRef({});

  useEffect(() => {
    let raf;
    const poll = () => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      for (const gp of gamepads) {
        if (!gp) continue;
        const prev = prevRef.current[gp.index] || {};
        const pressed = {};
        // Detect button presses (rising edge only — not held)
        for (let i = 0; i < gp.buttons.length; i++) {
          const btn = gp.buttons[i];
          const isDown = typeof btn === "object" ? btn.pressed : btn > 0.5;
          if (isDown && !prev[i]) pressed[i] = true;
        }
        // Left stick as d-pad (with deadzone)
        const lx = gp.axes[0] || 0, ly = gp.axes[1] || 0;
        const plx = prev.lx || 0, ply = prev.ly || 0;
        if (lx < -0.5 && plx >= -0.5) pressed[GP.LEFT] = true;
        if (lx > 0.5 && plx <= 0.5) pressed[GP.RIGHT] = true;
        if (ly < -0.5 && ply >= -0.5) pressed[GP.UP] = true;
        if (ly > 0.5 && ply <= 0.5) pressed[GP.DOWN] = true;

        // Store current state
        const state = {};
        for (let i = 0; i < gp.buttons.length; i++) {
          const btn = gp.buttons[i];
          state[i] = typeof btn === "object" ? btn.pressed : btn > 0.5;
        }
        state.lx = lx; state.ly = ly;
        prevRef.current[gp.index] = state;

        // Fire callback for any pressed buttons
        const keys = Object.keys(pressed);
        if (keys.length > 0) cbRef.current(keys.map(Number));
      }
      raf = requestAnimationFrame(poll);
    };
    raf = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(raf);
  }, []);
}
