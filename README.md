# MP3 Auto-Tagger

A full-stack web app that automatically recognizes audio from a youtube song link, converts it to an MP3 file, and tags it with metadata (title, artist, album, cover art)

<img width="1919" height="934" alt="Screenshot 2025-09-01 163300" src="https://github.com/user-attachments/assets/555d611d-994c-42c2-9768-f495a3ecb1c5" />

<img width="1917" height="927" alt="Screenshot 2025-09-01 163136" src="https://github.com/user-attachments/assets/2254ce28-7adb-44ee-8d65-df203055ad97" />

<img width="1329" height="595" alt="Screenshot 2025-09-01 163225" src="https://github.com/user-attachments/assets/653f188f-4c41-439f-94e9-e82b82ba5b13" />




## Features
- Paste a YouTube link to automatically recognize, download, & tag audio
- Recognition done via ACRCloud API
- Automatic metadata fetching (title, artist, album, cover art)
- Fallbacks via Spotify and Last.fm for missing info
- Progress bar for processing status
- Preview of tagged MP3 before download
- One-click download of the final MP3



---

# Setup

## 1. Clone the repo
git clone https://github.com/Branndon1/mp3-auto-tagger.git

cd mp3-auto-tagger

## 2. Navigate to the backend:
cd backend

## 3. Install the dependencies
pip install -r requirements.txt

## 4. Create an .env file in the backend folder:

### ACRCloud credentials
ACR_ACCESS_KEY=your_acr_access_key
ACR_ACCESS_SECRET=your_acr_access_secret

### Last.fm API
LASTFM_API_KEY=your_lastfm_api_key

### Spotify API
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

### Optional: FFMPEG path (only needed if ffmpeg is not already in PATH)
FFMPEG_PATH=/path/to/ffmpeg/bin



## 5. Run the backend
python app.py

## 6. Install Dependencies and Run The Frontend
npm install

cd frontend

npm run dev






