import { UI } from "../utils/ui.js";

// ─── PROFESSOR FELIX COMMS ───
function FelixComms({ message, mood = "default" }) {
  return (
    <div style={{
      ...UI.panel,
      display: "flex", gap: 15, alignItems: "center",
      borderLeft: "4px solid #44ff88", marginBottom: 15,
    }}>
      <div style={{
        width: 64, height: 64, border: "1px solid #44ff88",
        background: "#050505", overflow: "hidden",
        flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <img src="/felix.png" alt="Professor Felix" style={{ width: "100%", height: "100%", objectFit: "cover", imageRendering: "pixelated" }} onError={(e) => { e.target.style.display = 'none'; }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, color: "#44ff88", marginBottom: 4 }}>[PROF_FELIX_COMMS]</div>
        <div style={{ fontSize: 11, lineHeight: 1.5 }}>"{message}"</div>
      </div>
    </div>
  );
}

export default FelixComms;
