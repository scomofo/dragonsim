// ─── UI CONSTANTS ───
export const UI = {
  panel: { background: "#111", border: "1px solid #333", padding: 12, position: "relative" },
  heading: { fontWeight: "bold", fontSize: 12, letterSpacing: 1, color: "#eee", marginBottom: 8, textTransform: "uppercase" },
  text: { fontSize: 11, color: "#888" },
  btn: { background: "#1a1a1a", border: "1px solid #444", color: "#ccc", cursor: "pointer", transition: "0.15s", padding: "8px 12px", fontSize: 10, textTransform: "uppercase" },
  btnActive: (color = "#44ff88") => ({
    padding: "8px 12px", background: color, color: "#000",
    border: `1px solid ${color}`, fontSize: 10, cursor: "pointer",
    fontWeight: "bold", textTransform: "uppercase",
  }),
};
