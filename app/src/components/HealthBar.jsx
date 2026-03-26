// ─── HEALTH BAR ───
function HealthBar({ current, max, color, label, height = 14 }) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  return (
    <div style={{ marginBottom: 3 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#aaa", marginBottom: 1 }}>
        <span>{label}</span><span>{current}/{max}</span>
      </div>
      <div style={{ background: "#1a1a1a", height, overflow: "hidden", border: "1px solid #333" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg,${color},${color}88)`, transition: "width 0.5s ease" }} />
      </div>
    </div>
  );
}

export default HealthBar;
