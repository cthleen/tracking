<script lang="ts">
  import { onMount, onDestroy, tick, createEventDispatcher } from "svelte";
  import { browser } from "$app/environment";

  const dispatch = createEventDispatcher<{
    locationSelected: { x1: number; y1: number; x2: number; y2: number };
    locationLoaded: { x1: number; y1: number; x2: number; y2: number };
    locationCleared: void;
    scroll: void;
  }>();

  export let cameraId: number = 1;

  let video: HTMLVideoElement;
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let stream: MediaStream | null = null;
  let cameraError = false;
  let errorMessage = "";
  let previousCameraId = cameraId;
  let mounted = false;
  let animationFrameId: number | null = null;

  let drawing = false;
  let startX = 0, startY = 0;
  let current: any = null;
  let rect: any = null;

  const getKey = () => `camera-location-${cameraId}`;

  function save() {
    if (!browser) return;
    localStorage.setItem(getKey(), JSON.stringify(rect));
  }

  function load() {
    if (!browser) return;
    const raw = localStorage.getItem(getKey());
    if (!raw) {
      rect = null;
      return;
    }
    
    rect = JSON.parse(raw);
    dispatch("locationLoaded", {
      x1: Math.round(rect.x),
      y1: Math.round(rect.y),
      x2: Math.round(rect.x + rect.w),
      y2: Math.round(rect.y + rect.h)
    });
  }

  async function enableCamera() {
    if (!browser || !mounted) return;
    
    console.log('enableCamera called for camera', cameraId);
    
    // Stop drawing loop first
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    
    // Clean up event listeners before switching
    cleanupEventListeners();
    
    cameraError = false;
    errorMessage = "";

    try {
      // Stop existing stream if any
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        stream = null;
      }

      // Get all video devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');

      console.log('Available cameras:', videoDevices.length);
      console.log('Trying to access camera:', cameraId);

      if (videoDevices.length === 0) {
        throw new Error("No camera devices found");
      }

      // Camera 1 = first device (usually laptop webcam)
      // Camera 2 = second device (if exists)
      const deviceIndex = cameraId - 1;

      if (deviceIndex >= videoDevices.length) {
        throw new Error(`Camera ${cameraId} is not available. Only ${videoDevices.length} camera(s) detected.`);
      }

      const constraints = {
        video: {
          deviceId: { exact: videoDevices[deviceIndex].deviceId }
        }
      };

      stream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = stream;
      
      // Wait for video to be ready
      await new Promise((resolve) => {
        video.onloadedmetadata = () => resolve(null);
      });
      
      await video.play();
      
      // Wait for video to stabilize
      await tick();
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Re-get canvas context after potential recreate
      if (canvas) {
        ctx = canvas.getContext("2d");
        console.log('Canvas context refreshed:', !!ctx);
      }
      
      resize();
      
      // Re-setup event listeners after camera switch
      setupEventListeners();
      
      startDrawLoop();
      load();
      
      console.log('Camera switched successfully to camera', cameraId);
    } catch (e: any) {
      cameraError = true;
      
      if (e.message.includes("not available")) {
        errorMessage = e.message;
      } else if (e.name === 'NotAllowedError') {
        errorMessage = "Camera access denied. Please allow camera permissions.";
      } else if (e.name === 'NotFoundError') {
        errorMessage = `Camera ${cameraId} not found.`;
      } else {
        errorMessage = `Camera ${cameraId} is unavailable: ${e.message}`;
      }
      
      console.error('Camera error:', e);
    }
  }

  function resize() {
    if (!browser || !video || !canvas) return;
    
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    if (!videoWidth || !videoHeight) return;

    const videoRect = video.getBoundingClientRect();
    
    canvas.width = videoWidth;
    canvas.height = videoHeight;

    canvas.style.width = videoRect.width + "px";
    canvas.style.height = videoRect.height + "px";

    ctx?.setTransform(
      videoRect.width / videoWidth, 0,
      0, videoRect.height / videoHeight,
      0, 0
    );
    
    console.log('Canvas resized:', { videoWidth, videoHeight, rectWidth: videoRect.width, rectHeight: videoRect.height });
  }

  function startDrawLoop() {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
    }
    console.log('Starting draw loop');
    draw();
  }

  function draw() {
    if (!ctx || cameraError || !mounted) {
      console.log('Draw stopped:', { ctx: !!ctx, cameraError, mounted });
      return;
    }
    
    animationFrameId = requestAnimationFrame(draw);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const drawBox = (box: any, color: string) => {
      if (!ctx) return;
      
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
      ctx.strokeRect(box.x, box.y, box.w, box.h);

      ctx.fillStyle = color;
      ctx.font = "14px sans-serif";
      ctx.fillText(`(${Math.round(box.x)}, ${Math.round(box.y)})`, box.x + 4, box.y - 6);
      ctx.fillText(
        `(${Math.round(box.x + box.w)}, ${Math.round(box.y + box.h)})`,
        box.x + box.w - 80,
        box.y + box.h + 16
      );
    };

    if (rect) drawBox(rect, "lime");
    if (current) drawBox(current, "yellow");
  }

  const norm = (r: any) => {
    let { x, y, w, h } = r;
    if (w < 0) (x += w), (w = -w);
    if (h < 0) (y += h), (h = -h);
    return { x, y, w, h };
  };

  const pos = (e: any) => {
    if (!canvas) return { x: 0, y: 0 };
    
    const p = e.touches?.[0] || e;
    const r = canvas.getBoundingClientRect();
    return {
      x: (p.clientX - r.left) * (canvas.width / r.width),
      y: (p.clientY - r.top) * (canvas.height / r.height)
    };
  };

  function handleMouseDown(e: MouseEvent) {
    console.log('Mouse down triggered', { cameraError, drawing });
    if (cameraError) return;
    e.preventDefault();
    const p = pos(e);
    drawing = true;
    startX = p.x;
    startY = p.y;
    current = { x: p.x, y: p.y, w: 0, h: 0 };
    console.log('Mouse down:', p, 'Drawing started');
  }

  function handleMouseMove(e: MouseEvent) {
    if (!drawing || cameraError) return;
    e.preventDefault();
    const p = pos(e);
    current = norm({ x: startX, y: startY, w: p.x - startX, h: p.y - startY });
  }

  function handleMouseUp(e: MouseEvent) {
    if (!drawing || cameraError) return;
    e.preventDefault();
    console.log('Mouse up, current:', current);
    drawing = false;

    if (current && Math.abs(current.w) > 5 && Math.abs(current.h) > 5) {
      rect = current;
      save();
      dispatch("locationSelected", {
        x1: Math.round(rect.x),
        y1: Math.round(rect.y),
        x2: Math.round(rect.x + rect.w),
        y2: Math.round(rect.y + rect.h)
      });
      console.log('Selection saved:', rect);
    }
    current = null;
  }

  function handleTouchStart(e: TouchEvent) {
    if (cameraError) return;
    e.preventDefault();
    const p = pos(e);
    drawing = true;
    startX = p.x;
    startY = p.y;
    current = { x: p.x, y: p.y, w: 0, h: 0 };
  }

  function handleTouchMove(e: TouchEvent) {
    if (!drawing || cameraError) return;
    e.preventDefault();
    const p = pos(e);
    current = norm({ x: startX, y: startY, w: p.x - startX, h: p.y - startY });
  }

  function handleTouchEnd(e: TouchEvent) {
    if (!drawing || cameraError) return;
    e.preventDefault();
    drawing = false;

    if (current && Math.abs(current.w) > 5 && Math.abs(current.h) > 5) {
      rect = current;
      save();
      dispatch("locationSelected", {
        x1: Math.round(rect.x),
        y1: Math.round(rect.y),
        x2: Math.round(rect.x + rect.w),
        y2: Math.round(rect.y + rect.h)
      });
    }
    current = null;
  }

  export function clear() {
    rect = null;
    current = null;
    if (browser) {
      localStorage.removeItem(getKey());
    }
    dispatch("locationCleared");
  }

  function setupEventListeners() {
    if (!browser || !canvas) {
      console.log('Cannot setup listeners:', { browser, canvas: !!canvas });
      return;
    }
    
    console.log('Setting up event listeners on canvas');
    
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mouseleave", handleMouseUp);
    
    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd, { passive: false });
    
    if (typeof window !== 'undefined') {
      window.addEventListener("resize", resize);
    }
    
    console.log('Event listeners setup complete');
  }

  function cleanupEventListeners() {
    if (!browser) return;
    
    console.log('Cleaning up event listeners');
    
    if (canvas) {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("mouseleave", handleMouseUp);
      
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
    }
    
    if (typeof window !== 'undefined') {
      window.removeEventListener("resize", resize);
    }
  }

  onMount(async () => {
    if (!browser) return;
    mounted = true;
    await tick();

    ctx = canvas.getContext("2d");
    setupEventListeners();
    await enableCamera();
  });

  onDestroy(() => {
    mounted = false;
    
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
    }
    
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    
    cleanupEventListeners();
  });

  // Watch canvas binding changes
  $: if (canvas && browser && mounted) {
    console.log('Canvas binding changed, refreshing context and listeners');
    ctx = canvas.getContext("2d");
    cleanupEventListeners();
    setupEventListeners();
  }

  // Watch for camera ID changes with proper reactivity
  $: if (browser && mounted && ctx && cameraId !== previousCameraId) {
    console.log('Camera ID changed from', previousCameraId, 'to', cameraId);
    previousCameraId = cameraId;
    rect = null;
    current = null;
    enableCamera();
  }
</script>

<div class="relative w-full max-w-2xl mx-auto">
  {#if cameraError}
    <div class="rounded-lg w-full bg-destructive/10 border-2 border-destructive p-8 text-center min-h-[400px] flex flex-col items-center justify-center">
      <svg
        class="mx-auto h-12 w-12 text-destructive mb-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <h3 class="text-lg font-semibold text-destructive mb-2">Camera Error</h3>
      <p class="text-sm text-muted-foreground max-w-md">{errorMessage}</p>
    </div>
  {:else}
    <video bind:this={video} autoplay playsinline muted class="rounded-lg w-full" on:scroll={() => dispatch("scroll")}></video>
    <canvas 
      bind:this={canvas} 
      class="absolute top-0 left-0 w-full h-full rounded-lg cursor-crosshair" 
      on:scroll={() => dispatch("scroll")}
    ></canvas>
  {/if}
</div>

<div class="mt-2 flex justify-end">
  <button
    type="button"
    class="px-2 py-2 text-sm rounded transition-colors
          bg-neutral-200 hover:bg-neutral-300
          dark:bg-neutral-800 dark:hover:bg-neutral-700
          disabled:opacity-50 disabled:cursor-not-allowed"
    on:click={clear}
    disabled={cameraError}
  >
    Clear Selection
  </button>
</div>