<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  let videoEl: HTMLVideoElement;
  let canvasEl: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let stream: MediaStream | null = null;

  let isDrawing = false;
  let startX = 0;
  let startY = 0;
  let currentRect: {x: number, y: number, w: number, h: number} | null = null;

  let rect: {x: number, y: number, w: number, h: number} | null = null;

  const STORAGE_KEY = 'camera-location-rect-v1';

  function saveRect() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rect));
  }

  function loadRect() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      rect = JSON.parse(raw);
      if (rect) {
        console.log('Loading saved location:', rect);
        dispatch('location-loaded', {
          x1: Math.round(rect.x),
          y1: Math.round(rect.y),
          x2: Math.round(rect.x + rect.w),
          y2: Math.round(rect.y + rect.h)
        });
      }
    }
  }

  function startCamera() {
    return navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then(s => {
        stream = s;
        videoEl.srcObject = stream;
        return new Promise(resolve => videoEl.onloadedmetadata = resolve);
      })
      .catch(err => {
        console.error('Camera access error:', err);
        alert('Cannot access camera. Please check permissions.');
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

    const w = videoEl.videoWidth || videoEl.clientWidth;
    const h = videoEl.videoHeight || videoEl.clientHeight;

    canvasEl.width = w;
    canvasEl.height = h;
    canvasEl.style.width = `${videoEl.clientWidth}px`;
    canvasEl.style.height = `${videoEl.clientHeight}px`;
    drawAll();
  }

  function drawAll() {
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

    // Draw saved rectangle (green)
    if (rect) {
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
      ctx.strokeStyle = 'lime';
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
      
      // Semi-transparent fill
      ctx.fillStyle = 'rgba(0, 255, 0, 0.15)';
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      
      // Label
      ctx.font = '14px sans-serif';
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      const text = `Location: x=${Math.round(rect.x)}, y=${Math.round(rect.y)}, w=${Math.round(rect.w)}, h=${Math.round(rect.h)}`;
      const textW = ctx.measureText(text).width + 8;
      ctx.fillRect(rect.x, rect.y - 20, textW, 18);
      ctx.fillStyle = 'white';
      ctx.fillText(text, rect.x + 4, rect.y - 6);
    }

    if (currentRect) {
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = 'yellow';
      ctx.strokeRect(currentRect.x, currentRect.y, currentRect.w, currentRect.h);
    }
  }

  function toCanvasCoords(clientX: number, clientY: number) {
    const rect = canvasEl.getBoundingClientRect();
    const x = (clientX - rect.left) * (canvasEl.width / rect.width);
    const y = (clientY - rect.top) * (canvasEl.height / rect.height);
    return { x, y };
  }

  function pointerDown(e: Event) {
    e.preventDefault();
    const p = (e as any).touches ? (e as any).touches[0] : e;
    const c = toCanvasCoords(p.clientX, p.clientY);
    isDrawing = true;
    startX = c.x; 
    startY = c.y;
    currentRect = { x: startX, y: startY, w: 0, h: 0 };
  }

  function pointerMove(e: Event) {
    if (!isDrawing) return;
    const p = (e as any).touches ? (e as any).touches[0] : e;
    const c = toCanvasCoords(p.clientX, p.clientY);
    if (currentRect) {
      currentRect.w = c.x - startX;
      currentRect.h = c.y - startY;

      let norm = normalizeRect(currentRect);
      currentRect = norm;
      drawAll();
    }
  }

  function pointerUp(e: Event) {
    if (!isDrawing) return;
    isDrawing = false;
    
    if (currentRect && Math.abs(currentRect.w) > 5 && Math.abs(currentRect.h) > 5) {
      rect = currentRect;
      saveRect();

      const coordinates = {
        x1: Math.round(rect.x),
        y1: Math.round(rect.y),
        x2: Math.round(rect.x + rect.w),
        y2: Math.round(rect.y + rect.h)
      };
      
      console.log('Location selected:', coordinates);
      dispatch('location-selected', coordinates);
    }
    
    currentRect = null;
    drawAll();
  }

  function normalizeRect(r: {x: number, y: number, w: number, h: number}) {
    let x = r.x, y = r.y, w = r.w, h = r.h;
    if (w < 0) { x = x + w; w = Math.abs(w); }
    if (h < 0) { y = y + h; h = Math.abs(h); }
    return { x, y, w, h };
  }

  function clearRect() {
    rect = null;
    localStorage.removeItem(STORAGE_KEY);
    drawAll();

    console.log('Location cleared');
    dispatch('location-cleared');
  }

  onMount(() => {
    startCamera().then(() => {
      setTimeout(() => {
        resizeCanvasToVideo();
        ctx = canvasEl.getContext('2d');
        
        loadRect();

        const ro = new ResizeObserver(() => resizeCanvasToVideo());
        ro.observe(videoEl);

        canvasEl.addEventListener('mousedown', pointerDown);
        window.addEventListener('mousemove', pointerMove);
        window.addEventListener('mouseup', pointerUp);

        canvasEl.addEventListener('touchstart', pointerDown, {passive: false});
        window.addEventListener('touchmove', pointerMove, {passive: false});
        window.addEventListener('touchend', pointerUp);

        return () => {
          ro.disconnect();
        };
      }, 100);
    });
  });

  onDestroy(() => {
    stopCamera();
    
    if (canvasEl) {
      canvasEl.removeEventListener('mousedown', pointerDown);
      canvasEl.removeEventListener('touchstart', pointerDown);
    }
    window.removeEventListener('mousemove', pointerMove);
    window.removeEventListener('mouseup', pointerUp);
    window.removeEventListener('touchmove', pointerMove);
    window.removeEventListener('touchend', pointerUp);
  });
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
    left: 0; 
    top: 0;
    touch-action: none;
    cursor: crosshair;
  }
  .controls {
    margin-top: 8px;
    display: flex;
    gap: 8px;
  }
  button {
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    background-color: hsl(var(--muted));
    border: 2px solid hsl(var(--muted-foreground) / 0.3);
    color: hsl(var(--muted-foreground));
    transition: all 0.2s ease;
    font-weight: 500;
  }
  button:hover {
    background-color: hsl(var(--muted) / 0.8);
    color: hsl(var(--foreground));
    border-color: hsl(var(--muted-foreground) / 0.5);
  }
  .status {
    margin-left: auto;
    padding: 8px 12px;
    font-size: 14px;
    color: #6b7280;
  }
</style>

<div class="wrapper">
  <video bind:this={videoEl} autoplay playsinline muted></video>
  <canvas bind:this={canvasEl} class="overlay"></canvas>
</div>

<div class="controls">
  <button on:click={clearRect}>Clear Location</button>
  <div class="status">
    {#if rect}
      <span style="color: #10b981; font-weight: 600;">✓ Location Set</span>
    {:else}
      <span>Click and drag to select area</span>
    {/if}
  </div>
</div>
