import React, { useState } from "react";

export default function YoutubeInput({ onSubmit, disabled }) {
  const [url, setUrl] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    onSubmit(url.trim());
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        gap: "8px",
        alignItems: "center",
        marginTop: "10px",
      }}
    >
      <input
        type="url"
        placeholder="Paste YouTube song link here"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        disabled={disabled}
        style={{
          flex: 1,
          padding: "8px",
          border: "1px solid #ccc",
          borderRadius: "4px",
        }}
      />
      <button
        type="submit"
        disabled={disabled || !url.trim()}
        style={{
          padding: "8px 12px",
          background: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        Go
      </button>
    </form>
  );
}
