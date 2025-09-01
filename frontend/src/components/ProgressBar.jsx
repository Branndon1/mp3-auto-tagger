export default function ProgressBar({ pct, show }) {
  if (!show) return null;  // hide bar if show is false

  return (
    <div style={{ margin: "15px 0", width: "100%" }}>
      <div
        style={{
          height: "10px",
          background: "#e0e0e0",
          borderRadius: "5px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: "#007bff",
            transition: "width 0.3s ease",
          }}
        />
      </div>
      <p style={{ fontSize: "12px", marginTop: "5px" }}>
        {pct > 0 && pct < 100 ? `${pct}%` : pct === 100 ? "Done!" : ""}
      </p>
    </div>
  );
}
