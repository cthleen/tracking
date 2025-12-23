import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const API_BASE = 'http://localhost:8000/api';

export const load: PageServerLoad = async ({ fetch }) => {
  try {
    const res = await fetch(`${API_BASE}/location`);
    if (!res.ok) {
      console.error('Failed to load locations:', res.status);
      return { 
        locations: [], 
        areas: [], 
        lines: [] 
      };
    }
    const json = await res.json();
    const allLocations = json?.data ?? [];
    
    const areas = allLocations.filter((location: any) => location.type === 'box');
    const lines = allLocations.filter((location: any) => location.type === 'line');
    
    return { 
      locations: allLocations,
      areas: areas,
      lines: lines
    };
  } catch (e) {
    console.error('Load error:', e);
    return { 
      locations: [], 
      areas: [], 
      lines: [] 
    };
  }
};

export const actions: Actions = {
  addLocation: async ({ request, fetch }) => {
    const form = await request.formData();

    const name = form.get('name')?.toString();
    const cameraId = form.get('camera_id')?.toString();
    const type = form.get('type')?.toString() ?? 'box';
    const x1 = form.get('x1')?.toString();
    const y1 = form.get('y1')?.toString();
    const x2 = form.get('x2')?.toString();
    const y2 = form.get('y2')?.toString();

    if (!name || !cameraId || !x1 || !y1 || !x2 || !y2) {
      return fail(400, { error: 'Please fill all fields correctly' });
    }

    const body = {
      name,
      camera_id: Number(cameraId),
      type,
      x1: Number(x1),
      y1: Number(y1),
      x2: Number(x2),
      y2: Number(y2)
    };

    try {
      const res = await fetch(`${API_BASE}/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errorText = await res.text();
        return fail(500, { error: errorText || 'Failed to add location' });
      }

      return { success: 'Location added successfully!' };
    } catch (e) {
      console.error('Add location error:', e);
      return fail(500, { error: 'Server error adding location' });
    }
  },

  updateLocation: async ({ request, fetch }) => {
    const form = await request.formData();

    const id = form.get('locationId')?.toString();
    const name = form.get('name')?.toString();
    const cameraId = form.get('camera_id')?.toString();
    const type = form.get('type')?.toString() ?? 'box';
    const x1 = form.get('x1')?.toString();
    const y1 = form.get('y1')?.toString();
    const x2 = form.get('x2')?.toString();
    const y2 = form.get('y2')?.toString();

    if (!id || !name || !cameraId || !x1 || !y1 || !x2 || !y2) {
      return fail(400, { error: 'All fields are required' });
    }

    const body = {
      name,
      camera_id: Number(cameraId),
      type,
      x1: Number(x1),
      y1: Number(y1),
      x2: Number(x2),
      y2: Number(y2)
    };

    try {
      const res = await fetch(`${API_BASE}/location/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errorText = await res.text();
        return fail(500, { error: errorText || 'Failed to update location' });
      }

      return { success: 'Location updated successfully!' };
    } catch (e) {
      console.error('Update location error:', e);
      return fail(500, { error: 'Server error updating location' });
    }
  },

  deleteLocation: async ({ request, fetch }) => {
    const form = await request.formData();
    const id = form.get('locationId')?.toString();

    if (!id) {
      return fail(400, { error: 'Location ID missing' });
    }

    try {
      const res = await fetch(`${API_BASE}/location/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const errorText = await res.text();
        return fail(500, { error: errorText || 'Failed to delete location' });
      }

      return { success: 'Location deleted successfully!' };
    } catch (e) {
      console.error('Delete location error:', e);
      return fail(500, { error: 'Server error deleting location' });
    }
  },

  addLine: async ({ request, fetch }) => {
    const form = await request.formData();

    const name = form.get('name')?.toString();
    const cameraId = form.get('camera_id')?.toString();
    const type = form.get('type')?.toString() ?? 'line';
    const x1 = form.get('x1')?.toString();
    const y1 = form.get('y1')?.toString();
    const x2 = form.get('x2')?.toString();
    const y2 = form.get('y2')?.toString();

    if (!name || !cameraId || !x1 || !y1 || !x2 || !y2) {
      return fail(400, { error: 'Please fill all fields correctly' });
    }

    const body = {
      name,
      camera_id: Number(cameraId),
      type,
      x1: Number(x1),
      y1: Number(y1),
      x2: Number(x2),
      y2: Number(y2)
    };

    try {
      const res = await fetch(`${API_BASE}/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errorText = await res.text();
        return fail(500, { error: errorText || 'Failed to add location' });
      }

      return { success: 'Location added successfully!' };
    } catch (e) {
      console.error('Add location error:', e);
      return fail(500, { error: 'Server error adding location' });
    }
  }
};
