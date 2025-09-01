export default function PreviewPlayer({ coverArt, title, artist }) {
  return (
    <div className="preview-player" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {coverArt && (
        <img
          src={coverArt}
          alt={`${title} cover`}
          style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8 }}
        />
      )}
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 'bold', fontSize: 18 }}>{title}</div>
        <div style={{ fontSize: 14, color: '#555' }}>{artist}</div>
      </div>
    </div>
  );
}

