// utils/api.js
export function postTagForm(url, formData, { onUploadProgress } = {}) {
  // If onUploadProgress provided, use XHR to get upload progress (file upload)
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);

    xhr.responseType = 'json';
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.response);
      } else {
        reject(new Error(xhr.statusText || `HTTP ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.onabort = () => reject(new Error('Request aborted'));

    if (xhr.upload && typeof onUploadProgress === 'function') {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          onUploadProgress(pct);
        }
      };
    }

    xhr.send(formData);
  });
}

// POST JSON body to /api/download which returns MP3 blob
export async function postDownloadWithEdits(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Download failed: ' + res.statusText);
  const blob = await res.blob();
  return blob;
}
