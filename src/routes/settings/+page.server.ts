import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  try {
    const res = await fetch('http://localhost:8000/api/location');
    if (!res.ok) throw new Error(await res.text());

    const response = await res.json();
    console.log("Full response:", response);

    if (response.status && response.data && Array.isArray(response.data)) {
      return {
        locations: response.data
      };
    } else {
      console.warn('Unexpected response format:', response);
      return { locations: [] };
    }
  } catch (err) {
    console.error('Failed to load locations', err);
    return { locations: [] };
  }
};

export const actions: Actions = {
  deleteLocation: async ({ request }) => {
    const data = await request.formData();
    const locationId = data.get('locationId')?.toString();

    if (!locationId) {
      return fail(400, { error: 'Location ID is required' });
    }

    try {
      const response = await fetch(`http://localhost:8000/api/location/${locationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const locationsResponse = await fetch('http://localhost:8000/api/location');
        let updatedLocations: any[] = [];
        if (locationsResponse.ok) {
          const locationsData = await locationsResponse.json();
          updatedLocations = locationsData.data || [];
        }
        return { success: 'Location deleted successfully!', locations: updatedLocations };
      } else {
        const error = await response.text();
        return fail(500, { error: `Failed to delete location: ${error}` });
      }
    } catch (error) {
      console.error('Error deleting location:', error);
      return fail(500, { error: 'Failed to delete location. Please try again.' });
    }
  },

  updateLocation: async ({ request }) => {
    const data = await request.formData();
    const locationId = data.get('locationId')?.toString();

    if (!locationId) {
      return fail(400, { error: 'Location ID is required' });
    }

    try {
      const response = await fetch(`http://localhost:8000/api/location/${locationId}`, {
        method: 'PATCH',
        body: data, // kirim langsung FormData
      });

      if (response.ok) {
        const locationsResponse = await fetch('http://localhost:8000/api/location');
        let updatedLocations: any[] = [];
        if (locationsResponse.ok) {
          const locationsData = await locationsResponse.json();
          updatedLocations = locationsData.data || [];
        }
        return { success: 'Location updated successfully!', locations: updatedLocations };
      } else {
        const error = await response.text();
        return fail(500, { error: `Failed to update location: ${error}` });
      }
    } catch (error) {
      console.error('Error updating location:', error);
      return fail(500, { error: 'Failed to update location. Please try again.' });
    }
  },

  addLocation: async ({ request }) => {
    const data = await request.formData();

    const name = data.get('name')?.toString() || '';
    const cameraId = data.get('camera_id')?.toString() || '';
    const x1 = parseFloat(data.get('x1')?.toString() || '');
    const y1 = parseFloat(data.get('y1')?.toString() || '');
    const x2 = parseFloat(data.get('x2')?.toString() || '');
    const y2 = parseFloat(data.get('y2')?.toString() || '');

    if (!name || !cameraId || isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) {
      return fail(400, { error: 'Please fill all fields correctly' });
    }

    try {
      // Send as JSON since backend expects structured data
      const requestBody = {
        camera_id: parseInt(cameraId),
        name: name,
        x1: Math.round(x1),
        y1: Math.round(y1),
        x2: Math.round(x2),
        y2: Math.round(y2),
      };

      const response = await fetch('http://localhost:8000/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const locationsResponse = await fetch('http://localhost:8000/api/location');
        let updatedLocations: any[] = [];
        if (locationsResponse.ok) {
          const locationsData = await locationsResponse.json();
          updatedLocations = locationsData.data || [];
        }
        return { success: 'Location added successfully!', locations: updatedLocations };
      } else {
        const error = await response.text();
        return fail(500, { error: `Failed to add location: ${error}` });
      }
    } catch (error) {
      console.error('Error adding location:', error);
      return fail(500, { error: 'Failed to add location. Please try again.' });
    }
  }
};
