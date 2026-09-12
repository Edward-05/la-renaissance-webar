# LA RENAISSANCE — classroom WebAR

Public site: https://edward-05.github.io/la-renaissance-webar/

Open the site on your phone. Tap Start camera, allow Camera, and scan the sample poster displayed on another screen or printed on paper.

Poster: https://edward-05.github.io/la-renaissance-webar/assets/poster.jpg

A static MindAR + A-Frame prototype. No Unity export, Vuforia key, paid AR platform, npm build, or installed mobile app is needed. Camera frames are processed in the browser. The two pinned AR libraries download from public CDNs when Start camera is tapped; internet access is required.

## Files

```text
webar/
├── index.html
├── assets/
│   ├── targets.mind         # Real, precompiled single-image target
│   ├── poster.jpg           # Image to print or show on a second screen
│   ├── poster-original.png  # Exact upstream target artwork, retained as reference
│   ├── video.mp4            # Original 6-second muted H.264 demo loop
│   ├── app.js               # Configuration and AR lifecycle
│   └── style.css
├── README.md
├── THIRD_PARTY_NOTICES.md
├── .nojekyll
└── .gitignore
```

## First test

1. Deploy using the instructions below. Open the resulting **HTTPS** URL directly in Safari on iPhone or Chrome on Android.
2. Print `assets/poster.jpg`, or display it on a laptop/another phone. The camera must see the supplied sample image; this is not yet your LA RENAISSANCE poster.
3. Tap **Start camera**, then allow camera access. There is no experience selector. No microphone permission is requested.
4. Point the rear camera at the complete poster in even light. The prototype AR content (a gold rotating cube on a plane) appears attached to the image. This is not yet the full Unity event.
5. **Visit** appears as a large screen-space button while the poster is tracked. It opens a local demo dialog until you configure your destination.
6. Move the poster out of view. MindAR hides the anchor; the video pauses and Visit disappears. Tracking uses a short tolerance, so disappearance is not necessarily instantaneous.
7. **Stop camera** releases the stream. Switching tabs/backgrounding pauses the session; tap Resume camera and then Start camera to initialize a fresh session.

The Visit control stays at the bottom of the screen for an easy mobile tap; the AR content itself follows the poster. This prototype is independent of the Unity/Vuforia application and does not convert its scenes or target database.

## Deploy free on GitHub Pages

### Recommended: make `webar/` the repository root

1. Create a **public** GitHub repository, for example `la-renaissance-webar`.
2. Upload the **contents** of `webar/` into its root. `index.html` and `assets/` should appear together at the repository's top level. Do not upload the Unity project or the validation tools.
3. In **Settings → Pages**, set Source to **Deploy from a branch**, branch `main`, folder **/(root)**, then Save.
4. Wait for the Pages deployment to succeed. Open the URL shown in Settings → Pages, normally:

   `https://YOUR-USERNAME.github.io/la-renaissance-webar/`

5. Keep HTTPS enabled and send this URL to students. The prototype needs no server or secret keys.

### If you keep `webar/` inside an existing repository

Publish `main` → **/(root)**, then open:

`https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/webar/`

GitHub's branch folder selector supports the root or `/docs`, not an arbitrary `/webar` source folder. Use the subpath above, or a Pages Actions workflow if you want to publish only this subfolder. All project asset URLs are relative so repository subpaths work.

This project is published from `main`. Commit and push future changes to redeploy it.

## Change the Visit destination

Edit the first configuration object in `assets/app.js`:

```js
visitUrl: 'https://your-website.example/virtual-tour/',
```

Or use `visitUrl: './tour.html'` for a page in the same folder. Navigation is in the same tab and releases the AR camera first. The default `#visit-info` opens the included explanatory dialog without leaving AR.

## Replace the target with your poster

Vuforia `.dat`/`.xml` targets cannot be renamed to `.mind`.

1. Export a sharp JPG or PNG of your poster. Use distinctive, non-repeating details and good contrast; avoid a mostly blank surface, glare, tiny text, and repetitive patterns.
2. Open the [official MindAR target compiler](https://hiukim.github.io/mind-ar-js-doc/tools/compile/).
3. Add **only your poster**, compile it, and download the generated `.mind` file.
4. Replace `assets/targets.mind` with the downloaded binary and `assets/poster.jpg` with the corresponding poster image. Keep the same crop/orientation/artwork in the printed copy. The first target remains `targetIndex: 0`.
5. Update the poster preview's `alt` text in `index.html`; remove `poster-original.png` if you no longer need the sample.
6. Redeploy and refresh the browser. If assets remain cached during class, open the page in a new private tab or clear this site's cache.

The current 3D backing plane has width 1 and height 0.552, matching the sample target's original aspect ratio. MindAR coordinates use target width as 1 unit. For a different poster, set the backing plane height to `imageHeight / imageWidth` in `makeScene()` in `assets/app.js`. The overlay video is 16:9; change its plane height when replacing it with a differently proportioned video.

## Replace the video / 3D content

Replace `assets/video.mp4` with a small **H.264 MP4, yuv420p, fast-start**, ideally 480p or 720p. The included clip is 640×360, 24 fps, 6 seconds, silent. Video playback is muted, inline, and looped. If Safari blocks playback (for example under power restrictions), a **Play video** button is shown. No audio is promised by this prototype.

Optional conversion with FFmpeg:

```sh
ffmpeg -i input.mov -vf 'scale=640:-2' -c:v libx264 -pix_fmt yuv420p \
  -crf 25 -movflags +faststart -an assets/video.mp4
```

The 3D mode uses built-in A-Frame geometry, so it downloads no models. To use your own model, add a small `.glb` to `assets/`, preload it with `<a-asset-item>`, and replace the `<a-box>` inside `makeScene()` with `<a-gltf-model>`. Keep the entity under the image target and use a modest polygon/texture budget.

## Local preview

On this Mac, double-click **Open WebAR.command**. Keep its Terminal window open, and use `http://localhost:8766`. This is a computer-only preview, not a public phone URL.

From inside this directory:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open `http://localhost:8000` **on that computer**. Do not double-click `index.html`; `file://` cannot reliably fetch the target. A phone visiting `http://192.168…:8000` is not a secure camera context. Use the HTTPS GitHub Pages URL for phones.

## Reliability and troubleshooting

- Test in current Safari on iPhone and Chrome on Android, directly, not an embedded Instagram/Facebook/QR-app browser.
- Camera denied: allow this site's camera permission in browser settings and reload. Another camera app may need to be closed.
- Loading fails: check connectivity/CDN blockers and that `assets/targets.mind` is a real binary returning HTTP 200, not a GitHub HTML page or Git LFS pointer. The README raw target link is not the scanner URL.
- Target never found: use the included poster, show its full edges, reduce glare, and move back until it fits. Recognition is image-based, not QR scanning.
- Black/frozen video: try Play video, then the 3D mode; check your replacement MP4's codec. Camera capture and video textures still depend on the device/browser.
- Rotating the phone, backgrounding, low memory, or browser camera interruptions can require restarting the session.
- The default startup watchdog is 90 seconds. Failed starts show recovery instructions. Camera grants that arrive after Stop/backgrounding are cleaned up.
- `releaseCamera()` and the guarded `_startAR` wrapper handle partial initialization in **MindAR 1.2.5**. Recheck them before upgrading the pinned library.

## Validation

Verified on 2026-09-12 using isolated desktop Chrome with a 390×844 viewport and a prerecorded camera feed of the supplied poster followed by blank frames:

- Real MindAR detection of the supplied JPEG using the bundled `.mind` binary.
- Anchor disappearance and Visit hiding when the target is lost.
- Visit dialog interaction; video playback on detection and pause on loss.
- Camera release on Stop, including a delayed permission grant after Stop.
- Clear recovery for denied camera permission, a missing target, and blocked CDN scripts.
- Start button visible at 390×844; no horizontal overflow at 320px width.
- No uncaught page errors in the main tracking/video test.
- The included MP4 probes as H.264/yuv420p, 640×360, 24 fps, 6 seconds.

Physical iPhone Safari and Android Chrome camera/lighting tests remain unverified. Desktop simulation does not establish device compatibility. GitHub Pages deployment is configured from the main branch at the public URL above.

## Sources

- [MindAR events and lifecycle](https://hiukim.github.io/mind-ar-js-doc/examples/events-handling/)
- [MindAR 1.2.5 source and examples](https://github.com/hiukim/mind-ar-js/tree/v1.2.5)
- [A-Frame documentation](https://aframe.io/docs/1.5.0/introduction/)
- [GitHub Pages setup and free public-repository hosting](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)
- [Camera secure-context requirements](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)

## Simplified scan flow

The visitor now taps Start camera and scans the poster without choosing a demo mode. Camera preview starts before library downloads. The prototype currently reveals the sample 3D content. Opening a separate event or virtual tour requires its public browser URL; the installed Unity app is not a WebAR scene. The optional video asset remains included for later development.
