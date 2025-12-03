import type { PageServerLoad } from './$types';

const BASE_URL = "http://localhost:8000";
const CAMERA_1_ID = 1;
const CAMERA_2_ID = 2;

interface Location {
    id?: string;
    location_id?: string;
    uuid?: string;
    camera_id?: string;
    name: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

interface GenderCounts {
    male: number;
    female: number;
}

interface CustomerCountItem {
    gender: string;
    count: number;
}

async function fetchLocations(fetch: typeof globalThis.fetch): Promise<Location[]> {
    try {
        const res = await fetch(`${BASE_URL}/api/location`);
        
        if (!res.ok) {
            throw new Error(`Failed to fetch locations: ${res.status} ${res.statusText}`);
        }

        const rawData = await res.json();
        
        const locations: Location[] = Array.isArray(rawData)
            ? rawData
            : Array.isArray(rawData.data)
            ? rawData.data
            : [];

        console.log(`✓ Fetched ${locations.length} total locations`);
        return locations;
    } catch (error) {
        console.error('✗ Error fetching locations:', error);
        return [];
    }
}

function getTodayDateRange() {
    const now = new Date();
    now.setUTCFullYear(2025);

    const startOfDay = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        0, 0, 0, 0
    ));

    const endOfDay = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        23, 59, 59, 999
    ));

    return {
        start: startOfDay.toISOString(),
        end: endOfDay.toISOString()
    };
}

async function fetchLocationGenderCounts(
    fetch: typeof globalThis.fetch,
    locationId: string,
    start: string,
    end: string
): Promise<GenderCounts> {
    try {
        const url = `${BASE_URL}/api/location/${locationId}/customer-count?start=${start}&end=${end}&interval=hour`;
        const res = await fetch(url);

        if (!res.ok) {
            console.warn(`Failed to fetch data for location ${locationId}: ${res.status}`);
            return { male: 0, female: 0 };
        }

        const data = await res.json();
        
        let items: CustomerCountItem[] = [];
        if (data.data?.data && Array.isArray(data.data.data)) {
            items = data.data.data;
        } else if (data.data && Array.isArray(data.data)) {
            items = data.data;
        } else if (Array.isArray(data)) {
            items = data;
        }

        const counts = items.reduce(
            (acc, item) => {
                if (item.gender === 'M') {
                    acc.male += item.count || 0;
                } else if (item.gender === 'F') {
                    acc.female += item.count || 0;
                }
                return acc;
            },
            { male: 0, female: 0 }
        );

        return counts;
    } catch (error) {
        console.warn(`Error fetching data for location ${locationId}:`, error);
        return { male: 0, female: 0 };
    }
}

async function aggregateGenderCounts(
    fetch: typeof globalThis.fetch,
    locations: Location[],
    start: string,
    end: string
): Promise<GenderCounts> {
    const promises = locations.map(async (loc) => {
        const locId = loc.id || loc.location_id || loc.uuid;
        
        if (!locId) {
            console.warn('Location missing ID:', loc);
            return { male: 0, female: 0 };
        }

        return fetchLocationGenderCounts(fetch, locId, start, end);
    });

    const results = await Promise.all(promises);
    
    return results.reduce(
        (total, current) => ({
            male: total.male + current.male,
            female: total.female + current.female
        }),
        { male: 0, female: 0 }
    );
}

function filterLocationsByCamera(locations: Location[], cameraId: string): Location[] {
    return locations.filter(loc => loc.camera_id === cameraId);
}

export const load: PageServerLoad = async ({ fetch, setHeaders }) => {
    setHeaders({
        'cache-control': 'public, max-age=60'
    });

    try {
        const allLocations = await fetchLocations(fetch);

        const uniqueCameraIds = [...new Set(allLocations.map(loc => loc.camera_id || 'undefined'))];
        console.log('Camera IDs in database:', uniqueCameraIds);
        console.log('Looking for Camera 1:', CAMERA_1_ID);
        console.log('Looking for Camera 2:', CAMERA_2_ID);

        const locations1 = filterLocationsByCamera(allLocations, CAMERA_1_ID);
        const locations2 = filterLocationsByCamera(allLocations, CAMERA_2_ID);

        console.log(`Camera 1: ${locations1.length} locations`);
        console.log(`Camera 2: ${locations2.length} locations`);

        const { start, end } = getTodayDateRange();

        const [genderData1, genderData2] = await Promise.all([
            aggregateGenderCounts(fetch, locations1, start, end),
            aggregateGenderCounts(fetch, locations2, start, end)
        ]);

        console.log('Camera 1 gender data:', genderData1);
        console.log('Camera 2 gender data:', genderData2);

        const totalGenderData: GenderCounts = {
            male: genderData1.male + genderData2.male,
            female: genderData1.female + genderData2.female
        };

        return {
            allLocations,
            locations1,
            locations2,
            genderData1,
            genderData2,
            genderData: totalGenderData,
            success: true
        };

    } catch (error) {
        console.error('Error in store feeds page server load:', error);

        return {
            allLocations: [],
            locations1: [],
            locations2: [],
            genderData1: { male: 0, female: 0 },
            genderData2: { male: 0, female: 0 },
            genderData: { male: 0, female: 0 },
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
};