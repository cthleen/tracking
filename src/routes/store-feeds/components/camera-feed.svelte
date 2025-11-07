<script lang="ts">
  import { onMount, onDestroy } from "svelte";

  export let cameraName: string;
  export let videoElement: HTMLVideoElement;
  export let canvasElement: HTMLCanvasElement;
  export let fps: number = 0;
  export let time: string;
  export let locations: { 
    id: string; 
    name: string; 
    x1: number; 
    y1: number; 
    x2: number; 
    y2: number;
    camera_id?: string;
  }[] = [];

  let ctx: CanvasRenderingContext2D;
  
  let frameCount = 0;
  let lastTime = performance.now();
  let animationFrameId: number;

  const STYLES = {
    box: {
      strokeColor: "lime",
      lineWidth: 3,
      fillColor: "rgba(0, 255, 0, 0.15)"
    },
    label: {
      font: "bold 14px Arial",
      textColor: "#fff",
      backgroundColor: "rgba(0,0,0,0.7)",
      padding: 4
    }
  };

  function resizeCanvas() {
    if (!videoElement || !canvasElement || !ctx) return;

    const ratio = window.devicePixelRatio || 1;
    const newWidth = videoElement.videoWidth * ratio;
    const newHeight = videoElement.videoHeight * ratio;

    if (canvasElement.width !== newWidth || canvasElement.height !== newHeight) {
      canvasElement.width = newWidth;
      canvasElement.height = newHeight;

      canvasElement.style.width = `${videoElement.videoWidth}px`;
      canvasElement.style.height = `${videoElement.videoHeight}px`;

      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
  }

  function drawBoundingBox(location: typeof locations[0]) {
    if (!ctx) return;

    const width = location.x2 - location.x1;
    const height = location.y2 - location.y1;

    if (width <= 0 || height <= 0) return;

    ctx.strokeStyle = STYLES.box.strokeColor;
    ctx.lineWidth = STYLES.box.lineWidth;
    ctx.strokeRect(location.x1, location.y1, width, height);

    ctx.fillStyle = STYLES.box.fillColor;
    ctx.fillRect(location.x1, location.y1, width, height);

    drawLabel(location.name, location.x1, location.y1);
  }

  function drawLabel(text: string, x: number, y: number) {
    if (!ctx) return;

    ctx.font = STYLES.label.font;
    ctx.textBaseline = "top";
    ctx.textAlign = "left";

    const padding = STYLES.label.padding;
    const textMetrics = ctx.measureText(text);
    const textWidth = textMetrics.width;
    const textHeight = 16;

    const boxY = y - textHeight - 4 < 0 ? y + 2 : y - textHeight - 4;

    ctx.fillStyle = STYLES.label.backgroundColor;
    ctx.fillRect(x, boxY, textWidth + padding * 2, textHeight + padding);

    ctx.fillStyle = STYLES.label.textColor;
    ctx.fillText(text, x + padding, boxY + padding / 2);
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

  function draw() {
    if (!ctx || !canvasElement || !videoElement) return;

    resizeCanvas();
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    locations.forEach(drawBoundingBox);
    calculateFPS();

    animationFrameId = requestAnimationFrame(draw);
  }

  function initializeCanvas() {
    if (!canvasElement) {
      console.warn('Canvas element not available');
      return;
    }

    ctx = canvasElement.getContext("2d");
    
    if (!ctx) {
      console.error('Failed to get 2D context');
      return;
    }

    animationFrameId = requestAnimationFrame(draw);
  }

  onMount(() => {
    initializeCanvas();
  });

  onDestroy(() => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
  });
</script>

<div class="col-span-2 bg-muted/50 rounded-xl p-4 flex flex-col gap-2">
  <div class="flex justify-between items-center">
    <h2 class="font-semibold text-lg">{cameraName}</h2>
    <span class="text-sm text-gray-500">{time}</span>
  </div>

  <div class="relative w-full">
    <video 
      bind:this={videoElement} 
      autoplay 
      playsinline 
      muted
      class="rounded-lg w-full"
    >
      <track kind="captions" />
    </video>

    <canvas
      bind:this={canvasElement}
      class="absolute top-0 left-0 rounded-lg"
      style="width: {videoElement?.clientWidth || 0}px; height: {videoElement?.clientHeight || 0}px;"
    />
  </div>

  <!-- FPS Display (optional, uncomment if needed) -->
  <!-- <div class="mt-2 text-sm text-green-600 font-bold">
    FPS: {fps}
  </div> -->
</div>