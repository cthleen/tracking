import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
  try {
    const res = await fetch('http://localhost:8000/api/location');
    const json = await res.json();
    return { locations: json?.data ?? [] };
  } catch (e) {
    console.error('Load error:', e);
    return { locations: [] };
  }
};

export const actions: Actions = {
  addLocation: async ({ request, fetch }) => {
    const form = await request.formData();
    const name = form.get('name');
    const cameraId = form.get('camera_id');
    const x1 = form.get('x1');
    const y1 = form.get('y1');
    const x2 = form.get('x2');
    const y2 = form.get('y2');

    if (!name || !cameraId || !x1 || !y1 || !x2 || !y2) {
      return fail(400, { error: 'Please fill all fields correctly' });
    }

    const body = {
      name,
      camera_id: Number(cameraId),
      x1: Math.round(Number(x1)),
      y1: Math.round(Number(y1)),
      x2: Math.round(Number(x2)),
      y2: Math.round(Number(y2))
    };

    try {
      const res = await fetch('http://localhost:8000/api/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) return fail(500, { error: await res.text() });

      const newData = await fetch('http://localhost:8000/api/location');
      const list = await newData.json();

      return {
        success: 'Location added successfully!',
        locations: list.data
      };
    } catch (e) {
      console.error(e);
      return fail(500, { error: 'Server error adding location' });
    }
  },

  updateLocation: async ({ request, fetch }) => {
    const form = await request.formData();
    const id = form.get('locationId');
    const name = form.get('name');
    const cameraId = form.get('camera_id');
    const x1 = form.get('x1');
    const y1 = form.get('y1');
    const x2 = form.get('x2');
    const y2 = form.get('y2');

    if (!id || !name || !cameraId || !x1 || !y1 || !x2 || !y2) {
      return fail(400, { error: 'All fields are required' });
    }

    const body = {
      name,
      camera_id: Number(cameraId),
      x1: Math.round(Number(x1)),
      y1: Math.round(Number(y1)),
      x2: Math.round(Number(x2)),
      y2: Math.round(Number(y2))
    };

    try {
      const res = await fetch(`http://localhost:8000/api/location/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) return fail(500, { error: await res.text() });

      const get = await fetch('http://localhost:8000/api/location');
      const data = await get.json();

      return { success: 'Location updated!', locations: data.data };
    } catch (e) {
      console.log(e);
      return fail(500, { error: 'Update error' });
    }
  },

  deleteLocation: async ({ request, fetch }) => {
    const form = await request.formData();
    const id = form.get('locationId');

    if (!id) return fail(400, { error: 'Location ID missing' });

    try {
      const res = await fetch(`http://localhost:8000/api/location/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) return fail(500, { error: await res.text() });

      const get = await fetch('http://localhost:8000/api/location');
      const data = await get.json();

      return { success: 'Location deleted!', locations: data.data };
    } catch (e) {
      console.log(e);
      return fail(500, { error: 'Delete error' });
    }
  }
};
