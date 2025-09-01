import os
import re
import time
import hmac
import json
import base64
import hashlib
import requests
from flask import Flask, request, jsonify, send_from_directory, abort
from flask_cors import CORS
from mutagen.mp3 import MP3
from mutagen.id3 import ID3, APIC, TIT2, TPE1, TALB
import yt_dlp
from dotenv import load_dotenv
from werkzeug.utils import secure_filename
from io import BytesIO

load_dotenv()

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

FFMPEG_BIN_PATH = os.getenv("FFMPEG_PATH", None)


# sanitize filenames
def unique_filename(name):
    base = secure_filename(name)
    timestamp = int(time.time() * 1000)
    return f"{timestamp}_{base}"

# download audio from YouTube URL

def download_audio(url, output_path):
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': output_path,
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        'quiet': True,
        'ffmpeg_location': FFMPEG_BIN_PATH or None

    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])
    return output_path + ".mp3"

def recognize(file_path):
    host = 'identify-us-west-2.acrcloud.com'
    access_key = os.getenv("ACR_ACCESS_KEY")
    access_secret = os.getenv("ACR_ACCESS_SECRET")
    http_method = "POST"
    http_uri = "/v1/identify"
    data_type = "audio"
    signature_version = "1"
    timestamp = str(int(time.time()))

    string_to_sign = "\n".join([
        http_method,
        http_uri,
        access_key,
        data_type,
        signature_version,
        timestamp
    ])
    sign = base64.b64encode(
        hmac.new(
            access_secret.encode('utf-8'),
            string_to_sign.encode('utf-8'),
            digestmod=hashlib.sha1
        ).digest()
    ).decode('utf-8')

    with open(file_path, 'rb') as f:
        sample_bytes = f.read(128 * 1024)

    data = {
        'access_key': access_key,
        'sample_bytes': str(len(sample_bytes)),
        'timestamp': timestamp,
        'signature': sign,
        'data_type': data_type,
        'signature_version': signature_version,
    }

    files = {
        'sample': ('sample.mp3', sample_bytes, 'audio/mpeg')
    }

    response = requests.post(f"http://{host}/v1/identify", files=files, data=data)
    return response.json()

def get_youtube_thumbnail(url):
    match = re.search(r'(?:v=|youtu\.be/)([^\s&]+)', url)
    if match:
        video_id = match.group(1)
        return f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"
    return None

def get_lastfm_album_cover(artist, title):
    api_key = os.getenv("LASTFM_API_KEY")
    if not api_key:
        return None
    try:
        params = {
            'method': 'track.getInfo',
            'api_key': api_key,
            'artist': artist,
            'track': title,
            'format': 'json'
        }
        response = requests.get("http://ws.audioscrobbler.com/2.0/", params=params)
        data = response.json()
        images = data.get('track', {}).get('album', {}).get('image', [])
        for img in reversed(images):
            if img.get('#text'):
                return img['#text']
    except:
        pass
    return None

_spotify_token = None
_spotify_token_expiry = 0

def get_spotify_token():
    global _spotify_token, _spotify_token_expiry
    if time.time() < _spotify_token_expiry:
        return _spotify_token

    client_id = os.getenv("SPOTIFY_CLIENT_ID")
    client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")
    if not client_id or not client_secret:
        return None

    try:
        auth_response = requests.post(
            "https://accounts.spotify.com/api/token",
            data={"grant_type": "client_credentials"},
            headers={
                "Authorization": "Basic " + base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
            }
        )
        auth_data = auth_response.json()
        _spotify_token = auth_data.get("access_token")
        _spotify_token_expiry = time.time() + auth_data.get("expires_in", 3600)
        return _spotify_token
    except:
        return None

def get_spotify_album_cover(artist, title):
    token = get_spotify_token()
    if not token:
        return None

    try:
        query = f"track:{title} artist:{artist}"
        response = requests.get(
            "https://api.spotify.com/v1/search",
            headers={"Authorization": f"Bearer {token}"},
            params={"q": query, "type": "track", "limit": 1}
        )
        data = response.json()
        items = data.get("tracks", {}).get("items", [])
        if items:
            images = items[0].get("album", {}).get("images", [])
            if images:
                return images[0].get("url")
    except:
        pass
    return None

def tag_mp3(file_path, title, artist, album, cover_url=None):
    audio = MP3(file_path, ID3=ID3)
    try:
        audio.add_tags()
    except:
        pass

    audio.tags.add(TIT2(encoding=3, text=title))
    audio.tags.add(TPE1(encoding=3, text=artist))
    audio.tags.add(TALB(encoding=3, text=album))

    if cover_url:
        try:
            image_data = requests.get(cover_url).content
            audio.tags.add(
                APIC(
                    encoding=3,
                    mime='image/jpeg',
                    type=3,
                    desc='Cover',
                    data=image_data
                )
            )
        except:
            pass

    audio.save()

# Main endpoint: tag mp3 from youtube or uploaded file
@app.route('/api/tag', methods=['POST'])
def api_tag():
    if 'file' in request.files:
        # Uploaded mp3 file
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        filename = unique_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        mp3_path = filepath
    else:
        # Expect JSON or form data with youtubeUrl
        youtube_url = request.form.get('youtubeUrl') or request.json.get('youtubeUrl')
        if not youtube_url:
            return jsonify({'error': 'No file or YouTube URL provided'}), 400
        filename = unique_filename("youtube_audio.mp3")
        mp3_path = os.path.join(UPLOAD_FOLDER, filename)
        try:
            download_audio(youtube_url, mp3_path[:-4])  # yt-dlp adds .mp3
        except Exception as e:
            return jsonify({'error': 'Failed to download YouTube audio', 'details': str(e)}), 500

    # Recognize & tag
    try:
        result = recognize(mp3_path)
    except Exception as e:
        return jsonify({'error': 'Failed to recognize audio', 'details': str(e)}), 500

    if 'metadata' not in result or 'music' not in result['metadata']:
        return jsonify({'error': 'Audio not recognized'}), 400

    metadata = result['metadata']['music'][0]
    title = metadata.get('title', 'Unknown Title')
    artist = metadata.get('artists', [{}])[0].get('name', 'Unknown Artist')
    album = metadata.get('album', {}).get('name', 'Unknown Album')

    image_url = metadata.get('album', {}).get('coverart', None)
    if not image_url:
        image_url = metadata.get('external_metadata', {}).get('spotify', {}).get('album', {}).get('images', [])
        if isinstance(image_url, list) and image_url:
            image_url = image_url[0].get('url')

    if not image_url and title != 'Unknown Title' and artist != 'Unknown Artist':
        image_url = get_lastfm_album_cover(artist, title)

    if not image_url and title != 'Unknown Title' and artist != 'Unknown Artist':
        image_url = get_spotify_album_cover(artist, title)

    if not image_url and 'youtubeUrl' in locals():
        image_url = get_youtube_thumbnail(youtube_url)

    tag_mp3(mp3_path, title, artist, album, image_url)

    download_url = f"/uploads/{filename}"
    preview_url = download_url  # For simplicity, preview same as download

    return jsonify({
        'title': title,
        'artist': artist,
        'album': album,
        'coverArt': image_url,
        'downloadUrl': download_url,
        'previewUrl': preview_url
    })


# Endpoint to download retagged mp3 with edits
@app.route('/api/download', methods=['POST'])
def api_download():
    data = request.get_json()
    source_url = data.get('sourceDownloadUrl')
    edit_metadata = data.get('editMetadata', {})

    if not source_url:
        return jsonify({'error': 'No sourceDownloadUrl provided'}), 400

    # Ensure source file is in uploads folder for security
    filename = os.path.basename(source_url)
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    if not os.path.isfile(file_path):
        return jsonify({'error': 'Source file not found'}), 404

    # Retag mp3 with edited metadata
    tag_mp3(
        file_path,
        edit_metadata.get('title', ''),
        edit_metadata.get('artist', ''),
        edit_metadata.get('album', ''),
        edit_metadata.get('coverArt', None)
    )

    # Return file for download
    return send_from_directory(
        UPLOAD_FOLDER,
        filename,
        as_attachment=True,
        download_name=f"{edit_metadata.get('title','tagged')}.mp3"
    )


# Serve files from uploads folder
@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


if __name__ == '__main__':
    app.run(debug=True, port=5000)
