<script lang="ts">
  import { onMount, onDestroy, tick, createEventDispatcher } from "svelte";
  import { browser } from "$app/environment";

  const dispatch = createEventDispatcher<{
    locationSelected: { x1: number; y1: number; x2: number; y2: number };
    locationLoaded: { x1: number; y1: number; x2: number; y2: number };
    locationCleared: void;
  }>();

  export let cameraId: number = 1;

  let video: HTMLVideoElement;
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;

  let pc: RTCPeerConnection | null = null;
  let stream: MediaStream | null = null;

  let mounted = false;
  let cameraReady = false;
  let activeCameraId: number | null = null;
  let previousCameraId = cameraId;

  let animationFrameId: number | null = null;

  let drawing = false;
  let startX = 0, startY = 0;

  let rect: any = null;
  let current: any = null;

  const getKey = () => `camera-rect-norm-${cameraId}`;

  function normalizeRect(r: any) {
    return {
      x: r.x / canvas.width,
      y: r.y / canvas.height,
      w: r.w / canvas.width,
      h: r.h / canvas.height
    };
  }

  function denormalizeRect(r: any) {
    return {
      x: r.x * canvas.width,
      y: r.y * canvas.height,
      w: r.w * canvas.width,
      h: r.h * canvas.height
    };
  }

  function saveRect() {
    if (!browser || !rect) return;
    localStorage.setItem(getKey(), JSON.stringify(normalizeRect(rect)));
  }

  function loadRect() {
    if (!browser || !cameraReady || activeCameraId !== cameraId) return;

    const raw = localStorage.getItem(getKey());
    if (!raw) {
      rect = null;
      return;
    }

    const norm = JSON.parse(raw);
    rect = denormalizeRect(norm);

    dispatch("locationLoaded", {
      x1: norm.x,
      y1: norm.y,
      x2: norm.x + norm.w,
      y2: norm.y + norm.h
    });
  }

  async function enableCamera() {
    cameraReady = false;
    activeCameraId = null;

    rect = null;
    current = null;

    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }

    if (pc) pc.close();
    if (stream) stream.getTracks().forEach(t => t.stop());

    pc = new RTCPeerConnection();
    pc.addTransceiver("video", { direction: "recvonly" });

    pc.ontrack = e => {
      video.srcObject = e.streams[0];
      stream = e.streams[0];
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const res = await fetch(`http://localhost:9876/offer?camera_id=${cameraId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pc.localDescription)
    });

    const answer = await res.json();
    await pc.setRemoteDescription(answer);

    await video.play();
    await tick();
    resizeCanvas();

    cameraReady = true;
    activeCameraId = cameraId;

    startDrawLoop();
    loadRect();
  }

  function resizeCanvas() {
    if (!canvas || !video) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const r = video.getBoundingClientRect();
    canvas.style.width = r.width + "px";
    canvas.style.height = r.height + "px";

    ctx = canvas.getContext("2d");
    ctx?.setTransform(1, 0, 0, 1, 0, 0);
  }

  function startDrawLoop() {
    animationFrameId = requestAnimationFrame(draw);
  }

  function draw() {
    if (!ctx || !cameraReady || !mounted) return;

    animationFrameId = requestAnimationFrame(draw);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const drawBox = (r: any, color: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(r.x, r.y, r.w, r.h);
    };

    if (rect) drawBox(rect, "lime");
    if (current) drawBox(current, "yellow");
  }

  const pos = (e: MouseEvent) => {
    const r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (canvas.width / r.width),
      y: (e.clientY - r.top) * (canvas.height / r.height)
    };
  };

  const norm = (r: any) => {
    let { x, y, w, h } = r;
    if (w < 0) (x += w), (w = -w);
    if (h < 0) (y += h), (h = -h);
    return { x, y, w, h };
  };

  function down(e: MouseEvent) {
    drawing = true;
    const p = pos(e);
    startX = p.x;
    startY = p.y;
    current = { x: p.x, y: p.y, w: 0, h: 0 };
  }

  function move(e: MouseEvent) {
    if (!drawing) return;
    const p = pos(e);
    current = norm({ x: startX, y: startY, w: p.x - startX, h: p.y - startY });
  }

  function up() {
    if (!drawing) return;
    drawing = false;

    if (current && current.w > 5 && current.h > 5) {
      rect = current;
      saveRect();

      const n = normalizeRect(rect);
      dispatch("locationSelected", {
        x1: n.x,
        y1: n.y,
        x2: n.x + n.w,
        y2: n.y + n.h
      });
    }
    current = null;
  }

  export function clear() {
    rect = null;
    current = null;
    if (browser) localStorage.removeItem(getKey());
    dispatch("locationCleared");
  }

  onMount(async () => {
    mounted = true;
    await tick();
    enableCamera();
  });

  onDestroy(() => {
    mounted = false;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    if (stream) stream.getTracks().forEach(t => t.stop());
  });

  $: if (mounted && cameraId !== previousCameraId) {
    previousCameraId = cameraId;
    enableCamera();
  }
</script>

<div class="relative w-full max-w-2xl mx-auto">
  <video bind:this={video} class="rounded-lg w-full" autoplay muted playsinline></video>
  <canvas
    bind:this={canvas}
    class="absolute top-0 left-0 w-full h-full cursor-crosshair"
    on:mousedown={down}
    on:mousemove={move}
    on:mouseup={up}
    on:mouseleave={up}
  ></canvas>
</div>

<div class="mt-2 flex justify-end">
  <button on:click={clear}>Clear Selection</button>
</div>
