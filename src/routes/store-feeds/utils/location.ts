import type { Location } from './types';

export function filterByCamera(
  locations: Location[],
  cameraId: number
) {
  return locations.filter(
    loc => Number(loc.camera_id) === cameraId
  );
}
