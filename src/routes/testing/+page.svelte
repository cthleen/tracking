<script>
  // svelte-webcam-rectangles.svelte
  // Simple Svelte component that shows webcam video and an overlay canvas
  // Users can draw rectangular regions (mouse or touch), which are stored
  // in an array and persisted to localStorage. Coordinates are shown on the
  // overlay.

  import { onMount, onDestroy } from 'svelte';

  let videoEl;
  let canvasEl;
  let ctx;
  let stream;

  // state for drawing
  let isDrawing = false;
  let startX = 0;
  let startY = 0;
  let currentRect = null; // {x,y,w,h}

  // saved rectangles
  let rects = [];

  const STORAGE_KEY = 'svelte-webcam-rects-v1';

  function saveRects() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rects));
  }

  function loadRects() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) rects = JSON.parse(raw) || [];
  }

  function startCamera() {
    return navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then(s => {
        stream = s;
        videoEl.srcObject = stream;
        return new Promise(resolve => videoEl.onloadedmetadata = resolve);
      });
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      stream = null;
    }
  }

  function resizeCanvasToVideo() {
    if (!videoEl || !canvasEl) return;
    // match resolution to video display size
    const w = videoEl.videoWidth || videoEl.clientWidth;
    const h = videoEl.videoHeight || videoEl.clientHeight;
    // set canvas CSS size to match video element so overlay aligns
    canvasEl.width = w;
    canvasEl.height = h;
    canvasEl.style.width = `${videoEl.clientWidth}px`;
    canvasEl.style.height = `${videoEl.clientHeight}px`;
    drawAll();
  }

  function drawAll() {
    if (!ctx) return;
    // clear
    ctx.clearRect(0,0,canvasEl.width, canvasEl.height);

    // draw existing rectangles
    rects.forEach((r, i) => {
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.strokeStyle = 'lime';
      ctx.strokeRect(r.x, r.y, r.w, r.h);
      ctx.font = '14px sans-serif';
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      const text = `#${i+1}: x=${Math.round(r.x)}, y=${Math.round(r.y)}, w=${Math.round(r.w)}, h=${Math.round(r.h)}`;
      const textW = ctx.measureText(text).width + 8;
      ctx.fillRect(r.x, r.y - 20, textW, 18);
      ctx.fillStyle = 'white';
      ctx.fillText(text, r.x + 4, r.y - 6);
    });

    // draw current rectangle
    if (currentRect) {
      ctx.lineWidth = 2;
      ctx.setLineDash([6,4]);
      ctx.strokeStyle = 'yellow';
      ctx.strokeRect(currentRect.x, currentRect.y, currentRect.w, currentRect.h);
    }
  }

  function toCanvasCoords(clientX, clientY) {
    // convert mouse client coords to canvas pixels
    const rect = canvasEl.getBoundingClientRect();
    const x = (clientX - rect.left) * (canvasEl.width / rect.width);
    const y = (clientY - rect.top) * (canvasEl.height / rect.height);
    return { x, y };
  }

  function pointerDown(e) {
    e.preventDefault();
    const p = e.touches ? e.touches[0] : e;
    const c = toCanvasCoords(p.clientX, p.clientY);
    isDrawing = true;
    startX = c.x; startY = c.y;
    currentRect = { x: startX, y: startY, w: 0, h: 0 };
  }

  function pointerMove(e) {
    if (!isDrawing) return;
    const p = e.touches ? e.touches[0] : e;
    const c = toCanvasCoords(p.clientX, p.clientY);
    currentRect.w = c.x - startX;
    currentRect.h = c.y - startY;
    // normalize so negative width/height become x/y + positive w/h
    let norm = normalizeRect(currentRect);
    currentRect = norm;
    drawAll();
  }

  function pointerUp(e) {
    if (!isDrawing) return;
    isDrawing = false;
    if (currentRect && Math.abs(currentRect.w) > 5 && Math.abs(currentRect.h) > 5) {
      rects = [...rects, currentRect];
      saveRects();
    }
    currentRect = null;
    drawAll();
  }

  function normalizeRect(r) {
    let x = r.x, y = r.y, w = r.w, h = r.h;
    if (w < 0) { x = x + w; w = Math.abs(w); }
    if (h < 0) { y = y + h; h = Math.abs(h); }
    return { x, y, w, h };
  }

  function clearRects() {
    rects = [];
    saveRects();
    drawAll();
  }

  onMount(async () => {
    loadRects();
    await startCamera();
    // wait a tick so video dimensions are available
    requestAnimationFrame(resizeCanvasToVideo);
    ctx = canvasEl.getContext('2d');

    // keep canvas in sync if video size changes
    const ro = new ResizeObserver(() => resizeCanvasToVideo());
    ro.observe(videoEl);

    // pointer/touch events
    canvasEl.addEventListener('mousedown', pointerDown);
    window.addEventListener('mousemove', pointerMove);
    window.addEventListener('mouseup', pointerUp);

    canvasEl.addEventListener('touchstart', pointerDown, {passive:false});
    window.addEventListener('touchmove', pointerMove, {passive:false});
    window.addEventListener('touchend', pointerUp);

    return () => {
      ro.disconnect();
    };
  });

  onDestroy(() => stopCamera());
</script>

<style>
  .wrapper {
    position: relative;
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
  }
  video {
    display: block;
    width: 100%;
    height: auto;
    background: #000;
    border-radius: 8px;
  }
  canvas.overlay {
    position: absolute;
    left: 0; top: 0;
    touch-action: none; /* prevent scrolling while drawing */
  }
  .controls {
    margin-top: 8px;
    display:flex;
    gap:8px;
  }
  button { padding: 8px 12px; border-radius:6px }
</style>

<div class="wrapper">
  <video bind:this={videoEl} autoplay playsinline muted></video>
  <canvas bind:this={canvasEl} class="overlay"></canvas>
</div>

<div class="controls">
  <button on:click={() => { drawAll(); }}>Refresh Overlay</button>
  <button on:click={clearRects}>Clear Rectangles</button>
  <button on:click={() => { navigator.clipboard.writeText(JSON.stringify(rects)); }}>Copy coords JSON</button>
  <div style="margin-left:auto">Saved: {rects.length}</div>
</div>

<!-- End of component -->
