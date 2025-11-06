<script lang="ts">
  import { onMount, onDestroy, tick, createEventDispatcher } from "svelte";
  import { browser } from "$app/environment";

  const dispatch = createEventDispatcher<{
    locationSelected: { x1: number; y1: number; x2: number; y2: number };
    locationLoaded: { x1: number; y1: number; x2: number; y2: number };
    locationCleared: void;
    scroll: void;
  }>();

  let video: HTMLVideoElement;
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let stream: MediaStream | null = null;

  let drawing = false;
  let startX = 0, startY = 0;
  let current: any = null;
  let rect: any = null;

  const KEY = "camera-location";

  function save() {
    if (!browser) return;
    localStorage.setItem(KEY, JSON.stringify(rect));
  }

  function load() {
    if (!browser) return;
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    
    rect = JSON.parse(raw);
    dispatch("location-loaded", {
      x1: Math.round(rect.x),
      y1: Math.round(rect.y),
      x2: Math.round(rect.x + rect.w),
      y2: Math.round(rect.y + rect.h)
    });
  }

  async function enableCamera() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
      await video.play();
      resize();
      draw();
    } catch (e) {
      alert("Camera blocked or unavailable. Please enable webcam.");
      console.error(e);
    }
  }

  function resize() {
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    if (!videoWidth || !videoHeight) return;

    const rect = video.getBoundingClientRect();
    
    canvas.width = videoWidth;
    canvas.height = videoHeight;

    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";

    ctx?.setTransform(
      rect.width / videoWidth, 0,
      0, rect.height / videoHeight,
      0, 0
    );
  }

  function draw() {
    if (!ctx) return;
    requestAnimationFrame(draw);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const drawBox = (box, color) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
      ctx.strokeRect(box.x, box.y, box.w, box.h);

      // ctx.fillStyle = color + "30";
      // ctx.fillRect(box.x, box.y, box.w, box.h);

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

  const norm = (r) => {
    let { x, y, w, h } = r;
    if (w < 0) (x += w), (w = -w);
    if (h < 0) (y += h), (h = -h);
    return { x, y, w, h };
  };

  const pos = (e) => {
    const p = e.touches?.[0] || e;
    const r = canvas.getBoundingClientRect();
    return {
      x: (p.clientX - r.left) * (canvas.width / r.width),
      y: (p.clientY - r.top) * (canvas.height / r.height)
    };
  };

  function down(e) {
    const p = pos(e);
    drawing = true;
    startX = p.x;
    startY = p.y;
    current = { x: p.x, y: p.y, w: 0, h: 0 };
  }

  function move(e) {
    if (!drawing) return;
    const p = pos(e);
    current = norm({ x: startX, y: startY, w: p.x - startX, h: p.y - startY });
  }

  function up() {
    if (!drawing) return;
    drawing = false;

    if (current && Math.abs(current.w) > 5 && Math.abs(current.h) > 5) {
      rect = current;
      save();
      dispatch("location-selected", {
        x1: Math.round(rect.x),
        y1: Math.round(rect.y),
        x2: Math.round(rect.x + rect.w),
        y2: Math.round(rect.y + rect.h)
      });
    }
    current = null;
  }

  function clear() {
    rect = null;
    localStorage.removeItem(KEY);
    dispatch("location-cleared");
  }

  onMount(async () => {
    if (!browser) return;
    await tick();

    ctx = canvas.getContext("2d")!;
    await enableCamera();
    load();

    window.addEventListener("resize", resize);
    canvas.addEventListener("mousedown", down);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    canvas.addEventListener("touchstart", down);
    window.addEventListener("touchmove", move);
    window.addEventListener("touchend", up);
  });

  onDestroy(() => {
    stream?.getTracks().forEach((t) => t.stop());
  });
</script>

<div class="relative w-full max-w-2xl mx-auto">
  <video bind:this={video} autoplay playsinline muted class="rounded-lg w-full" on:scroll={() => dispatch("scroll")}></video>
  <canvas bind:this={canvas} class="absolute top-0 left-0 touch-none w-full h-full" on:scroll={() => dispatch("scroll")}></canvas>
</div>

<div class="mt-2 flex justify-end">
  <button
    type="button"
    class="px-2 py-2 text-sm rounded transition-colors
          bg-neutral-200 hover:bg-neutral-300
          dark:bg-neutral-800 dark:hover:bg-neutral-700"
    on:click={clear}
  >
    Clear Selection
  </button>
</div>
