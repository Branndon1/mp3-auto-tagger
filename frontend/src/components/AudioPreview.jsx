import { useRef, useEffect } from "react";

export default function AudioPreview({ src }) {
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const handleTimeUpdate = () => {
        if (audio.currentTime >= 10) {
          audio.pause();
          audio.currentTime = 0;
        }
      };
      audio.addEventListener("timeupdate", handleTimeUpdate);
      return () => {
        audio.removeEventListener("timeupdate", handleTimeUpdate);
      };
    }
  }, []);

  return (
    <div style={{ marginTop: "20px" }}>
      <p>Preview (first 10 seconds):</p>
      <audio ref={audioRef} controls src={src} />
    </div>
  );
}
