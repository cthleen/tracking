<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import CameraLineSelector from "../camera/camera-line-selector.svelte";
	import CoordinateInputs from "../shared/coordinate-inputs.svelte";
	import { createEmptyCoordinates, areCoordinatesValid } from "../../utils/coordinates";
	import ChevronDown from "@lucide/svelte/icons/chevron-down";
	import { page } from "$app/stores";

	let cameraId = 1;
	let lineName: "in" | "out" = "in";
	let coords = createEmptyCoordinates();

	const cameras = [
		{ id: 1, name: "Camera 1" },
		{ id: 2, name: "Camera 2" }
	];

	$: lines = $page.data.lines ?? [];

	$: existingLine =
		cameraId && lineName
			? lines.find(
					l =>
						l.type === "line" &&
						l.camera_id === cameraId &&
						l.name === lineName
			  )
			: null;

	$: if (existingLine) {
		coords = {
			x1: existingLine.x1,
			y1: existingLine.y1,
			x2: existingLine.x2,
			y2: existingLine.y2
		};
	}

	$: linesWithPreview = coords && areCoordinatesValid(coords) 
		? [
				...lines.filter(l => !(l.camera_id === cameraId && l.name === lineName)),
				{
					id: existingLine?.id || 'preview',
					name: lineName,
					camera_id: cameraId,
					type: 'line',
					...coords
				}
		  ]
		: lines;

	function handleLineUpdate(event) {
		coords = event.detail;
	}

	function handleClear() {
		coords = createEmptyCoordinates();
	}

	function handleChange() {
		handleClear();
	}

	$: isValid = lineName && areCoordinatesValid(coords);
</script>

<div class="bg-muted/50 rounded-xl p-6">
	<h2 class="text-xl font-bold mb-6">Add New Line</h2>

	<form method="POST" action="?/upsertLine">
		<input type="hidden" name="type" value="line" />

		{#if existingLine}
			<input type="hidden" name="locationId" value={existingLine.id} />
		{/if}

		<div class="flex gap-3 mb-4">
			<div class="flex-1">
				<p class="text-sm font-medium mb-2 block">Line Type</p>
				<div class="relative">
					<select
						name="name"
						bind:value={lineName}
						on:change={handleChange}
						class="w-full appearance-none rounded-md border-2 border-input bg-background text-foreground px-3 pr-8 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
					>
						<option value="in">In</option>
						<option value="out">Out</option>
					</select>
					<ChevronDown class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				</div>
			</div>

			<div class="flex-1">
				<p class="text-sm font-medium mb-2 block">Camera Selection</p>
				<div class="relative">
					<select
						name="camera_id"
						bind:value={cameraId}
						on:change={handleChange}
						class="w-full appearance-none rounded-md border-2 border-input bg-background text-foreground px-3 pr-8 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
					>
						{#each cameras as cam}
							<option value={cam.id}>{cam.name}</option>
						{/each}
					</select>
					<ChevronDown class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				</div>
			</div>
		</div>

		<p class="text-sm font-medium mb-2 block">Draw Line on Camera</p>

		<div class="mt-4 mb-4">
			<CameraLineSelector
				{cameraId}
				{lineName}
				lines={linesWithPreview}
				on:locationSelected={handleLineUpdate}
			/>
		</div>

		<CoordinateInputs {...coords} />

		<Button type="submit" class="w-full" disabled={!isValid}>
			{existingLine ? "Update Line" : "Save Line"}
		</Button>
	</form>
</div>