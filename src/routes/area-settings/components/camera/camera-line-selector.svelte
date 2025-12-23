<script lang="ts">
	import { onMount, onDestroy, tick, createEventDispatcher } from "svelte";
	import { browser } from "$app/environment";

	const dispatch = createEventDispatcher();

	export let cameraId: number = 1;
	export let coords: any;

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
	let current: any = null;
	let line: any = null;

	async function enableCamera() {
		cameraReady = false;
		activeCameraId = null;

		line = null;
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

		const drawLine = (l, color) => {
			ctx.strokeStyle = color;
			ctx.lineWidth = 3;
			ctx.beginPath();
			ctx.moveTo(l.x1, l.y1);
			ctx.lineTo(l.x2, l.y2);
			ctx.stroke();
		};

		if (line) drawLine(line, "lime");
		if (current) drawLine(current, "yellow");
	}

	function denormalize(c) {
		return {
			x1: c.x1 * canvas.width,
			y1: c.y1 * canvas.height,
			x2: c.x2 * canvas.width,
			y2: c.y2 * canvas.height
		};
	}

	$: if (coords && canvas && cameraReady) {
		line = denormalize(coords);
	}

	function pos(e) {
		const r = canvas.getBoundingClientRect();
		return {
			x: (e.clientX - r.left) * (canvas.width / r.width),
			y: (e.clientY - r.top) * (canvas.height / r.height)
		};
	}

	function down(e) {
		drawing = true;
		const p = pos(e);
		current = { x1: p.x, y1: p.y, x2: p.x, y2: p.y };
	}

	function move(e) {
		if (!drawing) return;
		const p = pos(e);
		current.x2 = p.x;
		current.y2 = p.y;
	}

	function up() {
		if (!drawing) return;
		drawing = false;
		line = current;

		dispatch("locationSelected", {
			x1: line.x1 / canvas.width,
			y1: line.y1 / canvas.height,
			x2: line.x2 / canvas.width,
			y2: line.y2 / canvas.height
		});

		current = null;
	}

	export function clear() {
		line = null;
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
		if (pc) pc.close();
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
	<button on:click={clear}>Clear Line</button>
</div>
