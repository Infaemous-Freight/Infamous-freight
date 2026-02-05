export function UsageMeter({ used, included }: { used: number; included: number }) {
  const pct = Math.min(100, Math.round((used / included) * 100));
  const barStyle = {
    width: "100%",
    height: "8px",
    background: "#e4e7f0",
    borderRadius: "999px",
    overflow: "hidden",
  } as const;
  const fillStyle = {
    display: "block",
    height: "100%",
    width: `${pct}%`,
    background: "#14b97d",
  } as const;

  return (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      <div>
        {used} / {included} AI actions
      </div>
      <div style={barStyle}>
        <span style={fillStyle} />
      </div>
    </div>
  );
}
