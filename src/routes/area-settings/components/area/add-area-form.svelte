<script>
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import CameraLocationSelector from "../camera/camera-area-selector.svelte";
	import CoordinateInputs from "../shared/coordinate-inputs.svelte";
	import { createEmptyCoordinates, updateCoordinatesFromEvent, areCoordinatesValid } from "../../utils/coordinates";

	export let locations;
	export let form;

	let locationName = "";
	let coords = createEmptyCoordinates();
	let cameraId = 1;

	const cameras = [
		{ id: 1, name: "Camera 1" },
		{ id: 2, name: "Camera 2" }
	];

	function handleLocationUpdate(event) {
		coords = updateCoordinatesFromEvent(event);
	}

	function handleLocationClear() {
		coords = createEmptyCoordinates();
	}
	
	function handleCameraChange() {
		handleLocationClear();
	}

	$: isValid = locationName && areCoordinatesValid(coords);
</script>

<div class="bg-muted/50 rounded-xl p-6">
	<h2 class="text-xl font-bold mb-6">Add New Area</h2>

	<form method="POST" action="?/addLocation">
		<input type="hidden" name="type" value="box" />
		<div class="flex gap-3 mb-4">
			<div class="flex-1">
				<p class="text-sm font-medium mb-2 block">Area Name</p>
				<Input
					name="name"
					placeholder="Area name"
					bind:value={locationName}
					class="w-full h-11"
				/>
			</div>

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
					<svg
						class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
					</svg>
				</div>
			</div>			
		</div>

		<label class="text-sm font-medium mb-2 block">Select Area on Camera</label>
		<div class="mt-4 mb-4">
			<CameraLocationSelector
				{cameraId}
				on:locationSelected={handleLocationUpdate}
				on:locationLoaded={handleLocationUpdate}
				on:locationCleared={handleLocationClear}
			/>
		</div>

		<CoordinateInputs {...coords} />

		<Button type="submit" class="w-full" disabled={!isValid}>
			Add Area
		</Button>

		<!-- <p class="text-xs text-muted-foreground mt-3">
			Debug → x1: {coords.x1}, y1: {coords.y1}, x2: {coords.x2}, y2: {coords.y2}, name: "{locationName}"
		</p> -->
	</form>
</div>
