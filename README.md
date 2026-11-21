# PrepTrack

A responsive placement-preparation syllabus tracker generated from the provided syllabus sources.

## Run locally

On Windows, use:

```powershell
.\start-server.bat
```

Or start the server directly:

```powershell
cd C:\Users\adit\Desktop\track\diff
py -3 -m http.server 8000
```

Open `http://localhost:8000`.

## Deploy to GitHub Pages

1. Push this folder to a GitHub repository.
2. Open **Settings > Pages**.
3. Set **Source** to **GitHub Actions**.
4. Push to the repository's default branch.

Progress is stored privately in browser local storage. Search, section filters, dark mode, completion controls, and reset are available.
