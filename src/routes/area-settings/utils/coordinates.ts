export type Coordinates = {
	x1: string | number;
	y1: string | number;
	x2: string | number;
	y2: string | number;
};

export function createEmptyCoordinates(): Coordinates {
	return { x1: "", y1: "", x2: "", y2: "" };
}

export function updateCoordinatesFromEvent(event: CustomEvent): Coordinates {
	const { detail } = event;
	return {
		x1: detail.x1,
		y1: detail.y1,
		x2: detail.x2,
		y2: detail.y2
	};
}

export function areCoordinatesValid(coords: Coordinates): boolean {
	return !!(coords.x1 && coords.y1 && coords.x2 && coords.y2);
}

export function coordinatesToNumbers(coords: Coordinates) {
	return {
		x1: Number(coords.x1),
		y1: Number(coords.y1),
		x2: Number(coords.x2),
		y2: Number(coords.y2)
	};
}
