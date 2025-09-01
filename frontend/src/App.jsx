import { useState } from 'react';
import YoutubeInput from './components/YoutubeInput';
import ProgressBar from './components/ProgressBar';
import PreviewPlayer from './components/PreviewPlayer';
import TagEditor from './components/TagEditor';
import { postTagForm, postDownloadWithEdits } from './utils/api';

export default function App() {
  const [processing, setProcessing] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const [statusMsg, setStatusMsg] = useState('');
  const [serverResult, setServerResult] = useState(null); // metadata + urls from backend
  const [editedMetadata, setEditedMetadata] = useState(null);

  // Reset UI state
  const resetState = () => {
    setServerResult(null);
    setEditedMetadata(null);
    setProgressPct(0);
    setStatusMsg('');
  };

  // Called when user submits YouTube URL
  const handleProcess = async ({ youtubeUrl }) => {
    resetState();
    setProcessing(true);
    setProgressPct(5);
    setStatusMsg('Recognizing Audio and Tagging Your Song...');

    try {
      const onUploadProgress = (pct) => {
        setProgressPct(5 + Math.round(pct * 0.6));
      };

      const form = new FormData();
      form.append('youtubeUrl', youtubeUrl);

      const result = await postTagForm('/api/tag', form, { onUploadProgress });

      // result: { title, artist, album, coverArt, previewUrl?, downloadUrl? }
      setServerResult(result);
      setEditedMetadata({
        title: result.title || '',
        artist: result.artist || '',
        album: result.album || '',
        coverArt: result.coverArt || ''
      });

      setProgressPct(100);
      setStatusMsg('Successfully Tagged! — preview available');
    } catch (err) {
      console.error(err);
      setStatusMsg('Error processing: ' + (err?.message || err));
      setProgressPct(0);
    } finally {
      setProcessing(false);
    }
  };

  // When user edits metadata in TagEditor
  const handleMetadataUpdate = (newMeta) => {
    setEditedMetadata(newMeta);
  };

  // Download final MP3 with edits
  const handleDownload = async () => {
    if (!serverResult) return;

    setProcessing(true);
    setStatusMsg('Preparing download...');
    try {
      const source = serverResult?.downloadUrl || null;
      const blob = await postDownloadWithEdits('/api/download', {
        sourceDownloadUrl: source,
        editMetadata: editedMetadata
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (editedMetadata?.title || 'tagged') + '.mp3';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setStatusMsg('Download complete');
    } catch (err) {
      console.error(err);
      setStatusMsg('Download failed: ' + (err?.message || err));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="App">
      <h1>MP3 Auto-Tagger</h1>

      <div className="controls" style={{ marginBottom: 16 }}>
        <button onClick={resetState} disabled={processing}>
          Clear
        </button>
      </div>

      <YoutubeInput
        onSubmit={(url) => handleProcess({ youtubeUrl: url })}
        disabled={processing}
      />

      <ProgressBar pct={progressPct} show={processing || progressPct > 0} />

      <div className="status" style={{ marginTop: 8 }}>
        {statusMsg || (progressPct === 100 ? 'Done!' : '')}
      </div>

      {serverResult && (
        <div className="result" style={{ marginTop: 20 }}>
          <TagEditor
            metadata={editedMetadata}
            onChange={handleMetadataUpdate}
          />
          <PreviewPlayer
            previewUrl={serverResult.previewUrl || serverResult.downloadUrl}
            coverArt={editedMetadata?.coverArt}
            title={editedMetadata?.title}
            artist={editedMetadata?.artist}
          />
          <div style={{ marginTop: 12 }}>
            <button onClick={handleDownload} disabled={processing}>
              {processing ? 'Preparing...' : 'Download Tagged MP3'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

