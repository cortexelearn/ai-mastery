# CortexEdge — AI Mastery (standalone track)

This is the **AI Mastery** track split out as its own standalone PWA, for deployment
to its own GitHub Pages repo at:

    https://cortexelearn.github.io/ai-mastery/

## What this build is
- The full v43 CortexEdge app, locked to the AI track only.
- The track-switcher UI (top indicator button + sidebar selector) is hidden.
- `currentTrack` stays "ai"; the other six tracks' data is still in the file but
  unreachable from the UI. (Size is unchanged — true extraction comes later.)
- Cache name is `cortexedge-ai-mastery-v1` so it won't collide with the
  multi-track app if both are installed on the same device.
- All paths are relative (`./`), so it works correctly under the /ai-mastery/ subpath.

## How to deploy
1. Create a new GitHub repo named exactly:  ai-mastery
2. Upload the CONTENTS of this folder (index.html, sw.js, manifest.json, icons/)
   to the repo root — not the folder itself.
3. Repo → Settings → Pages → Source: deploy from branch `main`, folder `/ (root)`.
4. Wait ~1 min, then open https://cortexelearn.github.io/ai-mastery/

## Smoke test once live
- [ ] Page loads, AI track lessons appear
- [ ] NO track-switcher button at top, NO track selector in sidebar
- [ ] Quizzes score correctly
- [ ] Final exam pulls from the 53-question AI pool
- [ ] Install to home screen (PWA), then turn off wifi and relaunch — loads offline
- [ ] Progress persists after closing/reopening

## Next deploys
Bump the cache version in sw.js (`cortexedge-ai-mastery-v1` → `-v2`) each time you push changes.
