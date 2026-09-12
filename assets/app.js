/* Change this one URL to connect Visit to your page or virtual tour.
   Relative paths such as './tour.html' work under a GitHub Pages repository. */
const CONFIG = Object.freeze({
  visitUrl: '#visit-info',
  targetUrl: './assets/event-targets.mind',
  videoUrl: './assets/video.mp4',
  aframeUrl: 'https://aframe.io/releases/1.5.0/aframe.min.js',
  mindarUrl: 'https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js'
});

const $ = (id) => document.getElementById(id);
let scene, system, clip, anchor, mode, cameraVideo, cameraStream, ready = false, found = false;
let started = false, interrupted = false, startupTimer;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const timeout = setTimeout(() => reject(new Error('Library download timed out. Check your connection, then retry.')), 45000);
    script.src = src;
    script.onload = () => { clearTimeout(timeout); resolve(); };
    script.onerror = () => { clearTimeout(timeout); reject(new Error('Could not load the AR libraries. Check your connection or content blocker.')); };
    document.head.appendChild(script);
  });
}

// MindAR 1.2.5 stop() assumes a fully initialized camera/controller.
// Guard partial startup too, including permission failures and tab changes.
function releaseCamera() {
  clearTimeout(startupTimer);
  found = false;
  ready = false;
  clip?.pause();
  if (anchor?.object3D) anchor.object3D.visible = false;
  try { system?.controller?.stopProcessVideo(); } catch (e) { console.debug(e); }
  cameraVideo?.pause();
  if (cameraVideo) cameraVideo.hidden = true;
  cameraStream?.getTracks().forEach(track => track.stop());
  if (scene?.hasLoaded) scene.pause();
  $('actions').hidden = true;
}

function showMessage(title, text, action = 'Try again') {
  interrupted = true;
  releaseCamera();
  $('welcome').hidden = true;
  $('hud').hidden = true;
  $('message').hidden = false;
  $('message-title').textContent = title;
  $('message-text').textContent = text;
  $('restart').textContent = action;
  document.body.classList.remove('running');
}

async function playClip() {
  if (!found || interrupted || mode !== 'video' || $('visit-info').open) return;
  try {
    await clip.play();
    // A pending play promise may settle after targetLost / backgrounding.
    if (!found || interrupted) clip.pause();
    else $('play-video').hidden = true;
  } catch {
    if (found && !interrupted) $('play-video').hidden = false;
  }
}

function setTracking(tracked) {
  if (!ready || interrupted) return;
  found = tracked;
  if (tracked) {
    interrupted = true;
    releaseCamera();
    location.replace('./?scanned=1');
    return;
  }
  $('actions').hidden = !tracked;
  $('scan-guide').hidden = tracked;
  $('status').textContent = tracked ? 'Poster found — explore your experience.' : 'Point your camera at the test poster.';
  if (tracked) {
    anchor.querySelector('#object')?.emit('tracking-resume');
    playClip();
  } else {
    clip?.pause();
    anchor.querySelector('#object')?.emit('tracking-pause');
    $('play-video').hidden = true;
    if ($('visit-info').open) $('visit-info').close();
  }
}

function makeScene() {
  scene = document.createElement('a-scene');
  scene.setAttribute('embedded', '');
  scene.setAttribute('mindar-image', `imageTargetSrc: ${CONFIG.targetUrl}; autoStart: false; maxTrack: 1; uiLoading: no; uiScanning: no; uiError: no;`);
  scene.setAttribute('color-space', 'sRGB');
  scene.setAttribute('renderer', 'colorManagement: true; physicallyCorrectLights: true; antialias: false; alpha: true; precision: mediump;');
  scene.setAttribute('vr-mode-ui', 'enabled: false');
  scene.setAttribute('xr-mode-ui', 'enabled: false');
  scene.setAttribute('device-orientation-permission-ui', 'enabled: false');
  scene.setAttribute('loading-screen', 'enabled: false');
  scene.innerHTML = `<a-camera position="0 0 0" look-controls="enabled: false" wasd-controls="enabled: false"></a-camera>
    <a-entity id="poster-target" mindar-image-target="targetIndex: 0"></a-entity>`;
  if (mode === 'video') {
    clip = document.createElement('video');
    clip.id = 'overlay-video';
    clip.src = CONFIG.videoUrl;
    clip.muted = true;
    clip.loop = true;
    clip.preload = 'auto';
    clip.setAttribute('muted', '');
    clip.setAttribute('playsinline', '');
    clip.setAttribute('webkit-playsinline', '');
    clip.addEventListener('error', () => showMessage('Video unavailable.', 'Check assets/video.mp4, or reload and select the 3D object.'));
    scene.querySelector('a-assets').appendChild(clip);
  }
  anchor = scene.querySelector('#poster-target');
  anchor.addEventListener('targetFound', () => setTracking(true));
  anchor.addEventListener('targetLost', () => setTracking(false));
  scene.addEventListener('arReady', () => {
    if (interrupted) { releaseCamera(); return; }
    clearTimeout(startupTimer);
    ready = true;
    setTracking(false);
  });
  scene.addEventListener('arError', () => showMessage('Camera unavailable.', 'Allow camera access in your browser’s website settings, close other camera apps, and open this HTTPS page directly in Safari or Chrome.'));
  scene.addEventListener('renderstart', () => {
    if (interrupted) return;
    system = scene.systems['mindar-image-system'];
    // Reuse the live preview stream. Never request a second camera stream.
    system._startVideo = function () {
      this.video = cameraVideo;
      this._startAR();
    };
    // A permission request cannot be cancelled. Release a late camera grant
    // instead of starting tracking after Stop, timeout, or backgrounding.
    const startAR = system._startAR.bind(system);
    system._startAR = async () => {
      if (interrupted) { releaseCamera(); return; }
      try { await startAR(); }
      catch (error) {
        showMessage('AR could not start.', 'Check your connection and compiled target file, then try again.');
      }
      if (interrupted) releaseCamera();
    };
    startupTimer = setTimeout(() => showMessage('Camera setup is taking longer.', 'Check the camera permission prompt and your connection, then try again.'), 90000);
    system.start();
  }, {once: true});
  $('ar-container').appendChild(scene);
}

$('start').addEventListener('click', async () => {
  if (started) return;
  started = true;
  if (location.protocol === 'file:') {
    showMessage('Open the website preview.', 'This HTML file was opened directly. Scanning cannot download its target from a file address. Double-click Open WebAR.command in the project folder, then open http://localhost:8766.', 'Open localhost preview');
    $('restart').onclick = () => { location.href = 'http://localhost:8766/'; };
    return;
  }
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    showMessage('Open a secure link.', 'Camera access needs HTTPS (such as GitHub Pages) or localhost on this computer. A phone cannot use an ordinary HTTP address on your Wi-Fi.');
    return;
  }
  mode = 'object'; // One experience: scan the poster to reveal AR content.
  $('start').disabled = true;
  $('start').textContent = 'Opening camera…';
  $('welcome').hidden = true;
  $('hud').hidden = false;
  $('status').textContent = 'Allow camera access to begin.';
  document.body.classList.add('running');
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {facingMode: {ideal: 'environment'}, width: {ideal: 1280}, height: {ideal: 720}}
    });
    if (interrupted) { releaseCamera(); return; }
    cameraVideo = document.createElement('video');
    cameraVideo.id = 'camera-feed';
    cameraVideo.autoplay = true;
    cameraVideo.muted = true;
    cameraVideo.playsInline = true;
    cameraVideo.setAttribute('muted', '');
    cameraVideo.setAttribute('playsinline', '');
    cameraVideo.setAttribute('webkit-playsinline', '');
    $('ar-container').appendChild(cameraVideo);
    cameraVideo.srcObject = cameraStream;
    await cameraVideo.play();
    if (interrupted) { releaseCamera(); return; }
    cameraVideo.width = cameraVideo.videoWidth;
    cameraVideo.height = cameraVideo.videoHeight;
    $('status').textContent = 'Camera ready — loading image tracking…';
    cameraStream.getVideoTracks()[0].addEventListener('ended', () => {
      if (!interrupted) showMessage('Camera disconnected.', 'Reconnect your camera or allow camera access, then try again.');
    });
    await loadScript(CONFIG.aframeUrl);
    if (interrupted) return;
    await loadScript(CONFIG.mindarUrl);
    if (interrupted) return;
    // Fail clearly for missing/HTML-placeholder targets before opening camera.
    let response;
    try { response = await fetch(CONFIG.targetUrl, {signal: AbortSignal.timeout(20000)}); }
    catch (error) {
      throw new Error('The poster tracking file could not be downloaded from ' + new URL(CONFIG.targetUrl, location.href).href + '. Keep the preview server running and use http://localhost:8766 on this Mac, or the published HTTPS website on your phone.');
    }
    if (!response.ok || (await response.arrayBuffer()).byteLength < 100) throw new Error('The compiled image target is missing. Restore assets/targets.mind.');
    if (interrupted) return;
    $('welcome').hidden = true;
    $('hud').hidden = false;
    document.body.classList.add('running');
    makeScene();
  } catch (error) {
    const reasons = {
      NotAllowedError: 'Camera permission was blocked. Allow Camera for this site in the browser address bar or website settings, then try again. On Mac also check System Settings → Privacy & Security → Camera for your browser.',
      NotFoundError: 'No camera was found. Connect or enable a camera, then try again.',
      NotReadableError: 'The camera is busy or unavailable. Close other camera apps and browser tabs using it, then try again.',
      OverconstrainedError: 'This camera does not support the requested video settings.'
    };
    showMessage(reasons[error.name] ? 'Camera unavailable.' : 'Unable to start AR.', reasons[error.name] || error.message);
  }
});

$('play-video').addEventListener('click', playClip);
$('stop').addEventListener('click', () => showMessage('Camera stopped.', 'Your camera has been released. Start again whenever you are ready.', 'Start again'));
$('restart').addEventListener('click', () => { if (location.protocol !== 'file:') location.reload(); });
$('visit').href = CONFIG.visitUrl;
$('visit').addEventListener('click', event => {
  if (!found || interrupted) { event.preventDefault(); return; }
  if (CONFIG.visitUrl === '#visit-info') {
    event.preventDefault();
    clip?.pause();
    $('visit-info').showModal();
  } else {
    interrupted = true;
    releaseCamera();
  }
});
$('close-visit').addEventListener('click', () => $('visit-info').close());
$('visit-info').addEventListener('close', playClip);
document.addEventListener('visibilitychange', () => {
  if (document.hidden && ready && !interrupted) showMessage('Camera paused.', 'You left the camera view. Start again to resume scanning.', 'Resume camera');
});
window.addEventListener('pagehide', () => { interrupted = true; releaseCamera(); });
window.addEventListener('unhandledrejection', event => {
  if (started && !interrupted) showMessage('AR could not continue.', 'Please reload and try again. Check that the target file downloaded and your browser supports WebGL.');
});

// Safari's browser bars can change viewport size without rotating the device.
window.visualViewport?.addEventListener('resize', () => {
  if (ready && !interrupted) { system._resize(); scene.resize(); }
});
