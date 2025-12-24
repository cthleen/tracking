<script lang="ts">
  import { onMount, onDestroy } from "svelte";

  export let cameraName: string;
  export let videoElement: HTMLVideoElement;
  export let canvasElement: HTMLCanvasElement;
  export let fps: number = 0;
  export let time: string;
  export let isLoaded: boolean = false;

  export let locations: {
    id: string;
    name: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    camera_id?: string;
  }[] = [];

  let ctx: CanvasRenderingContext2D | null = null;
  let animationFrameId: number | null = null;
  let resizeObserver: ResizeObserver;

  let frameCount = 0;
  let lastTime = performance.now();

  let aspectRatio = 9 / 16;

  const STYLES = {
    box: {
      strokeColor: "lime",
      lineWidth: 2,
      fillColor: "rgba(0, 255, 0, 0.15)"
    },
    label: {
      font: "bold 18px Arial",
      textColor: "#fff",
      backgroundColor: "rgba(0,0,0,0.7)",
      padding: 4
    }
  };

  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v));

  function denormalize(loc: typeof locations[0]) {
    return {
      ...loc,
      x1: loc.x1 * canvasElement.width,
      y1: loc.y1 * canvasElement.height,
      x2: loc.x2 * canvasElement.width,
      y2: loc.y2 * canvasElement.height
    };
  }

  function resizeCanvas() {
    if (!videoElement || !canvasElement) return;
    if (!videoElement.videoWidth || !videoElement.videoHeight) return;

    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;

    const rect = videoElement.getBoundingClientRect();
    canvasElement.style.width = rect.width + "px";
    canvasElement.style.height = rect.height + "px";

    ctx = canvasElement.getContext("2d");
    ctx?.setTransform(1, 0, 0, 1, 0, 0);
  }

  function calculateFPS() {
    frameCount++;
    const now = performance.now();
    if (now - lastTime >= 1000) {
      fps = frameCount;
      frameCount = 0;
      lastTime = now;
    }
  }

  function drawLabel(text: string, x: number, y: number) {
    if (!ctx) return;
    ctx.font = STYLES.label.font;
    ctx.textBaseline = "top";

    const pad = STYLES.label.padding;
    const w = ctx.measureText(text).width;
    const h = 16;
    const labelY = y - h - 6 < 0 ? y + 4 : y - h - 6;

    ctx.fillStyle = STYLES.label.backgroundColor;
    ctx.fillRect(x, labelY, w + pad * 2, h + pad);
    ctx.fillStyle = STYLES.label.textColor;
    ctx.fillText(text, x + pad, labelY + pad / 2);
  }

  function drawBoundingBox(loc: typeof locations[0]) {
    if (!ctx) return;
    const p = denormalize(loc);

    const x1 = clamp(p.x1, 0, canvasElement.width);
    const y1 = clamp(p.y1, 0, canvasElement.height);
    const x2 = clamp(p.x2, 0, canvasElement.width);
    const y2 = clamp(p.y2, 0, canvasElement.height);

    const w = x2 - x1;
    const h = y2 - y1;
    if (w <= 0 || h <= 0) return;

    ctx.strokeStyle = STYLES.box.strokeColor;
    ctx.lineWidth = STYLES.box.lineWidth;
    ctx.strokeRect(x1, y1, w, h);
    ctx.fillStyle = STYLES.box.fillColor;
    ctx.fillRect(x1, y1, w, h);

    drawLabel(loc.name, x1, y1);
  }

  function draw() {
    animationFrameId = requestAnimationFrame(draw);
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    locations.forEach(drawBoundingBox);
    calculateFPS();
  }

  function start() {
    aspectRatio = videoElement.videoHeight / videoElement.videoWidth;
    isLoaded = true;
    resizeCanvas();
    animationFrameId = requestAnimationFrame(draw);
  }

  onMount(() => {
    videoElement.addEventListener("loadedmetadata", start);

    resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(videoElement);
  });

  onDestroy(() => {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    resizeObserver?.disconnect();
  });
</script>

<div class="bg-muted/50 rounded-xl p-4 flex flex-col gap-2 w-full">
  <div class="flex justify-between items-center">
    <h2 class="font-semibold text-lg">{cameraName}</h2>
    <span class="text-sm text-gray-500">{time}</span>
  </div>

  <div
    class="relative w-full rounded-lg overflow-hidden bg-muted"
    style="padding-bottom: {aspectRatio * 100}%"
  >
    {#if !isLoaded}
      <div class="absolute inset-0 flex items-center justify-center z-10">
        <p class="text-sm text-muted-foreground">Loading camera...</p>
      </div>
    {/if}

    <video
      bind:this={videoElement}
      autoplay
      playsinline
      muted
      class="absolute inset-0 w-full h-full object-contain rounded-lg"
    ></video>

    <canvas
      bind:this={canvasElement}
      class="absolute inset-0 pointer-events-none rounded-lg"
    ></canvas>
  </div>
</div>
