import React from 'react'
import DragonSimulator from './dragon_simulator'

class GameErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) return (
      <div style={{ padding: 40, textAlign: "center", fontFamily: "monospace", color: "#ff4444" }}>
        <h2>SYSTEM CRASH</h2>
        <p>{this.state.error.message}</p>
        <button onClick={() => { this.setState({ error: null }); window.location.reload(); }}>REBOOT</button>
      </div>
    );
    return this.props.children;
  }
}

export default function App() {
  return (
    <GameErrorBoundary>
      <DragonSimulator />
    </GameErrorBoundary>
  )
}
