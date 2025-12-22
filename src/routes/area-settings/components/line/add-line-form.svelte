<script>
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import CameraLineSelector from "../camera/camera-line-selector.svelte";
	import CoordinateInputs from "../shared/coordinate-inputs.svelte";
	import { createEmptyCoordinates, updateCoordinatesFromEvent, areCoordinatesValid } from "../../utils/coordinates";

	let lineName = "";
	let coords = createEmptyCoordinates();
	let cameraId = 1;

	const cameras = [
		{ id: 1, name: "Camera 1" },
		{ id: 2, name: "Camera 2" }
	];

	function handleLineUpdate(event) {
		coords = updateCoordinatesFromEvent(event);
	}

	function handleLineClear() {
		coords = createEmptyCoordinates();
	}

	function handleCameraChange() {
		handleLineClear();
	}

	$: isValid = lineName && areCoordinatesValid(coords);
</script>

<div class="bg-muted/50 rounded-xl p-6">
	<h2 class="text-xl font-bold mb-6">Add New Line</h2>

	<form method="POST" action="?/addLine">
		<div class="flex gap-3 mb-4">
			<!-- <div class="flex-1">
				<label class="text-sm font-medium mb-2 block">Line Name</label>
				<Input
					name="name"
					placeholder="Line name"
					bind:value={lineName}
					class="w-full"
				/>
			</div> -->

			<div class="flex-1">
				<p class="text-sm font-medium mb-2 block">Camera Selection</p>
				<div class="relative">
					<select
						name="camera_id"
						bind:value={cameraId}
						on:change={handleCameraChange}
						class="w-full appearance-none rounded-md border-2 border-input bg-background text-foreground px-3 pr-8 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
					>
						{#each cameras as cam}
							<option value={cam.id}>{cam.name}</option>
						{/each}
					</select>
				</div>
			</div>
		</div>

		<p class="text-sm font-medium mb-2 block">Draw Line on Camera</p>
		<div class="mt-4 mb-4">
			<CameraLineSelector
				{cameraId}
				on:locationSelected={handleLineUpdate}
				on:locationLoaded={handleLineUpdate}
				on:locationCleared={handleLineClear}
			/>
		</div>

		<CoordinateInputs {...coords} />

		<Button type="submit" class="w-full" disabled={!isValid}>
			Add Line
		</Button>

		<!-- <p class="text-xs text-muted-foreground mt-3">
			Debug → x1: {coords.x1}, y1: {coords.y1}, x2: {coords.x2}, y2: {coords.y2}, name: "{lineName}"
		</p> -->
	</form>
</div>
