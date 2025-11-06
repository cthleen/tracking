<script lang="ts">
  import { onMount } from "svelte";

  export let cameraName: string;
  export let videoElement: HTMLVideoElement;
  export let canvasElement: HTMLCanvasElement;
  export let fps: number = 0; // bind ke parent
  export let time: string;

  export let locations: { id: string; name: string; x1: number; y1: number; x2: number; y2: number }[] = [];

  let ctx: CanvasRenderingContext2D;
  let frameCount = 0;
  let lastTime = performance.now();

  function resizeCanvas() {
    if (!videoElement || !canvasElement) return;

    const ratio = window.devicePixelRatio || 1;
    canvasElement.width = videoElement.videoWidth * ratio;
    canvasElement.height = videoElement.videoHeight * ratio;

    canvasElement.style.width = `${videoElement.videoWidth}px`;
    canvasElement.style.height = `${videoElement.videoHeight}px`;

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function draw() {
    if (!ctx || !canvasElement || !videoElement) return;

    // resize canvas jika ukuran video berubah
    if (
      canvasElement.width !== videoElement.videoWidth * (window.devicePixelRatio || 1) ||
      canvasElement.height !== videoElement.videoHeight * (window.devicePixelRatio || 1)
    ) {
      resizeCanvas();
    }

    // bersihkan canvas
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    // gambar semua locations
    locations.forEach(location => {
      const width = location.x2 - location.x1;
      const height = location.y2 - location.y1;

      if (width > 0 && height > 0) {
        ctx.strokeStyle = "lime";
        ctx.lineWidth = 3;
        ctx.strokeRect(location.x1, location.y1, width, height);

        ctx.fillStyle = "rgba(0, 255, 0, 0.15)";
        ctx.fillRect(location.x1, location.y1, width, height);

        const label = location.name;
        ctx.font = "bold 14px Arial";
        ctx.textBaseline = "top";
        ctx.textAlign = "left";

        const padding = 4;
        const textMetrics = ctx.measureText(label);
        const textWidth = textMetrics.width;
        const textHeight = 16;
        const boxX = location.x1;
        const boxY = location.y1 - textHeight - 4 < 0 ? location.y1 + 2 : location.y1 - textHeight - 4;

        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(boxX, boxY, textWidth + padding * 2, textHeight + padding);

        ctx.fillStyle = "#fff";
        ctx.fillText(label, boxX + padding, boxY + padding / 2);
      }
    });

    // perhitungan fps
    frameCount++;
    const now = performance.now();
    if (now - lastTime >= 1000) {
      fps = frameCount; // update prop bindable ke parent
      frameCount = 0;
      lastTime = now;
    }

    requestAnimationFrame(draw);
  }

  function startDrawing() {
    if (canvasElement) {
      ctx = canvasElement.getContext("2d")!;
      requestAnimationFrame(draw);
    }
  }

  onMount(() => startDrawing());
</script>

<div class="col-span-2 bg-muted/50 rounded-xl p-4 flex flex-col gap-2">
  <div class="flex justify-between items-center">
    <h2 class="font-semibold text-lg">{cameraName}</h2>
    <span class="text-sm text-gray-500">{time}</span>
  </div>

  <div class="relative w-full">
    <!-- <video bind:this={videoElement} autoplay playsinline muted class="rounded-lg w-full"></video> -->
    <video bind:this={videoElement} autoplay playsinline muted>
      <track kind="captions">
    </video>

    <canvas
      bind:this={canvasElement}
      class="absolute top-0 left-0 pointer-events-none"
      style="width: {videoElement?.clientWidth || 0}px; height: {videoElement?.clientHeight || 0}px;"
    ></canvas>

    <!-- Keep commented code -->
    <!-- <div class="bg-black rounded-lg aspect-video flex items-center justify-center text-gray-400">
      CCTV A Placeholder
    </div> -->
  </div>

  <!-- Display FPS -->
  <!-- <div class="mt-2 text-sm text-green-600 font-bold">FPS: {fps}</div> -->
</div>
  