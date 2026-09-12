# LA RENAISSANCE — event website

**Public website:** https://edward-05.github.io/la-renaissance-webar/

This site uses the actual LA RENAISSANCE poster and welcome artwork from the Creative Media project. Visit opens the event experience in the browser. The native iPhone project is retained separately.

## Phone flow

1. Scan the verified QR code with the phone's normal Camera app, then tap the website link.
2. The LA RENAISSANCE welcome page opens. Tap **Visit** to load the Unity event.
3. On iPhone, allow motion access when requested, or drag to look. Use the on-screen joystick to move.
4. Tap **Enable audio** if the browser has paused sound. **Recenter view** resets the view heading. **Exit** returns to the welcome page.

The Unity WebGL export is kept in `Creative Media/LA RENAISSANCE Web/Build` for local hosting. Its 204 MB data file is larger than GitHub's free per-file limit, so the public Pages site automatically opens the lightweight `experience.html` gallery instead. This keeps the QR-to-event flow working on free hosting.

## Scan the poster artwork instead

Open https://edward-05.github.io/la-renaissance-webar/scan.html, tap **Start camera**, allow camera access, and point at the complete **Poster 2 fix.png** artwork. Recognition opens the welcome page. Camera capture stops before leaving the scanner.

The website scanner recognizes the poster artwork using MindAR. The phone's built-in Camera app uses a QR code to open a URL; it does not perform MindAR recognition by itself.

- Event poster: `assets/event-poster.jpg`
- Compiled target: `assets/event-targets.mind`
- Verified QR PNG: `assets/event-qr.png`
- Verified QR SVG: `assets/event-qr.svg`
- Print page: `qr.html`

The decorative QR in the supplied poster did not decode in our test. Use the supplied verified QR beside the poster, or replace the QR in the editable poster design. Original poster artwork has not been overwritten.

## Unity web conversion

The source scene is `AR Indoor Event/AR INDOOR EVENT/Assets/Scenes/VirtualTour.unity` in Creative Media. The separate browser project and build logs are under `Creative Media/LA RENAISSANCE Web/`. The original iPhone project remains separate.

The web copy uses:

- The actual event rooms, materials, doors, room music, and player spawn from Unity.
- Joystick and drag-look controls, plus permission-based browser device orientation.
- Camera-relative movement on the ground plane.
- URL-streamed LED videos, shared by matching screens, with a two-decoder budget.
- A single WebGL scene instead of the native Vuforia scanning scene.
- Gzip with Unity decompression fallback for static GitHub Pages hosting.

Vuforia's native runtime is not embedded in this website. MindAR handles the initial poster recognition. After entering, Unity renders a virtual tour; the browser does not use real-world positional AR tracking to move through the scene.

## Deploy / update

GitHub Pages publishes the repository's `main` branch from its root. Keep relative asset paths for the `/la-renaissance-webar/` subpath.

Only the website and exported build belong in this repository. Do not add the Unity project, Library, caches, credentials, or build logs. Source changes are built with `WebEventBuild.Build` from the separate Unity web project, then exported files are placed in `tour/` and its loader settings are recorded in `tour/build.json`.

## Local preview

Double-click **Open WebAR.command** in this folder, or run:

```sh
python3 -m http.server 8766 --bind 127.0.0.1
```

Open `http://localhost:8766` on the same Mac. On a phone, use the public HTTPS URL. Do not open HTML files directly.

## Validation and practical limits

The supplied poster was compiled and recognized by real MindAR processing in isolated Chrome using a prerecorded camera feed. It redirected to the event welcome page. The supplied QR was decoded and matched the public website URL. Physical camera/lighting and motion performance on iPhone Safari and Android Chrome must still be checked on-device.

Browser permissions remain mandatory. Use Safari/Chrome directly, not a social-app embedded browser. Mobile GPU and memory limitations can affect the Unity tour; close other heavy tabs. Motion can be denied, so drag-look remains available.

## References

- https://hiukim.github.io/mind-ar-js-doc/examples/events-handling/
- https://docs.unity3d.com/6000.0/Documentation/Manual/webgl-browsercompatibility.html
- https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
