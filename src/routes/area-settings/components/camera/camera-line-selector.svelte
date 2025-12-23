<script lang="ts">
	import { onMount, onDestroy, tick, createEventDispatcher } from "svelte";

	const dispatch = createEventDispatcher();

	export let cameraId: number = 1;
	export let lines: Array<{
		id: string;
		name: "in" | "out";
		camera_id: number;
		x1: number;
		y1: number;
		x2: number;
		y2: number;
	}> = [];

	let video: HTMLVideoElement;
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;

	let pc: RTCPeerConnection | null = null;
	let stream: MediaStream | null = null;

	let mounted = false;
	let cameraReady = false;
	let previousCameraId = cameraId;

	let animationFrameId: number | null = null;

	let drawing = false;
	let current: any = null;

	/* ================= CAMERA ================= */

	async function enableCamera() {
		cameraReady = false;
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
		startDrawLoop();
	}

	function resizeCanvas() {
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;

		const r = video.getBoundingClientRect();
		canvas.style.width = r.width + "px";
		canvas.style.height = r.height + "px";

		ctx = canvas.getContext("2d");
		ctx?.setTransform(1, 0, 0, 1, 0, 0);
	}

	/* ================= DRAW ================= */

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

		// 🔥 draw semua line dari DB
		for (const l of lines.filter(l => l.camera_id === cameraId)) {
			const color = l.name === "in" ? "lime" : "red";
			drawLine(denormalize(l), color);
		}

		// sedang digambar
		if (current) drawLine(current, "yellow");
	}

	function denormalize(l) {
		return {
			x1: l.x1 * canvas.width,
			y1: l.y1 * canvas.height,
			x2: l.x2 * canvas.width,
			y2: l.y2 * canvas.height
		};
	}

	/* ================= INTERACTION ================= */

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

		dispatch("locationSelected", {
			x1: current.x1 / canvas.width,
			y1: current.y1 / canvas.height,
			x2: current.x2 / canvas.width,
			y2: current.y2 / canvas.height
		});

		current = null;
	}

	export function clear() {
		current = null;
		dispatch("locationCleared");
	}

	/* ================= LIFECYCLE ================= */

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
	<button on:click={clear}>Clear Drawing</button>
</div>
