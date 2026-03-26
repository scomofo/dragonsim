// ─── SCANLINES OVERLAY ───
function Scanlines() {
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
      background: "linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.1) 50%), linear-gradient(90deg, rgba(255,0,0,0.03), rgba(0,255,0,0.01), rgba(0,0,255,0.03))",
      backgroundSize: "100% 3px, 3px 100%",
      pointerEvents: "none", zIndex: 1000,
    }} />
  );
}

export default Scanlines;
