export default function TagEditor({ metadata, onChange }) {
  if (!metadata) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ ...metadata, [name]: value });
  };

  return (
    <div className="tag-editor" style={{ marginBottom: 16 }}>
      <label>
        Title: <br />
        <input
          name="title"
          value={metadata.title}
          onChange={handleChange}
          style={{ width: '100%', padding: 6, fontSize: 16 }}
        />
      </label>
      <br />
      <label>
        Artist: <br />
        <input
          name="artist"
          value={metadata.artist}
          onChange={handleChange}
          style={{ width: '100%', padding: 6, fontSize: 16 }}
        />
      </label>
      <br />
      <label>
        Album: <br />
        <input
          name="album"
          value={metadata.album}
          onChange={handleChange}
          style={{ width: '100%', padding: 6, fontSize: 16 }}
        />
      </label>
      <br />
      <label>
        Cover Art URL: <br />
        <input
          name="coverArt"
          value={metadata.coverArt}
          onChange={handleChange}
          style={{ width: '100%', padding: 6, fontSize: 16 }}
        />
      </label>
    </div>
  );
}
