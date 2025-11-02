import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, setHeaders }) => {
    setHeaders({
        'cache-control': 'public, max-age=60' // Cache for 1 minute
    });

    try {
        const baseUrl = "http://localhost:8000";

        // Fetch all locations first
        const locationsApiUrl = `${baseUrl}/api/location`;
        const locationsRes = await fetch(locationsApiUrl);

        if (!locationsRes.ok) {
            throw new Error(`Failed to fetch locations: ${locationsRes.status} ${locationsRes.statusText}`);
        }

        const locationsRawData = await locationsRes.json();
        const locations: any[] = Array.isArray(locationsRawData)
            ? locationsRawData
            : Array.isArray(locationsRawData.data)
            ? locationsRawData.data
            : [];

        console.log(`Found ${locations.length} locations for store feeds`);

        // Calculate today's date range
        const now = new Date();
        now.setUTCFullYear(2024);
        const todayUTC = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(), 0, 0, 0, 0
        ));
        const start = todayUTC.toISOString();

        const endOfDayUTC = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(), 23, 59, 59, 999
        ));
        const end = endOfDayUTC.toISOString();

        // Fetch today's gender counts from all locations
        let totalMale = 0;
        let totalFemale = 0;

        const genderPromises = locations.map(async (loc) => {
            const locId = loc.id || loc.location_id || loc.uuid;
            if (!locId) return { male: 0, female: 0 };

            try {
                const locApiUrl = `${baseUrl}/api/location/${locId}/customer-count?start=${start}&end=${end}&interval=hour`;
                const locRes = await fetch(locApiUrl);

                if (locRes.ok) {
                    const locData = await locRes.json();
                    let items: any[] = [];

                    if (locData.data?.data && Array.isArray(locData.data.data)) {
                        items = locData.data.data;
                    } else if (locData.data && Array.isArray(locData.data)) {
                        items = locData.data;
                    } else if (Array.isArray(locData)) {
                        items = locData;
                    }

                    const genderCounts = { male: 0, female: 0 };
                    for (const item of items) {
                        if (item.gender === 'M') {
                            genderCounts.male += item.count || 0;
                        } else if (item.gender === 'F') {
                            genderCounts.female += item.count || 0;
                        }
                    }
                    return genderCounts;
                }
            } catch (error) {
                console.warn(`Failed to fetch data for location ${locId}:`, error);
            }
            return { male: 0, female: 0 };
        });

        const genderResults = await Promise.all(genderPromises);
        const totalGenderData = genderResults.reduce(
            (acc, curr) => ({
                male: acc.male + curr.male,
                female: acc.female + curr.female
            }),
            { male: 0, female: 0 }
        );

        console.log('Store feeds gender data:', totalGenderData);

        return {
            locations,
            genderData: totalGenderData,
            success: true
        };

    } catch (error) {
        console.error('Error in store feeds page server load:', error);

        return {
            locations: [],
            genderData: { male: 0, female: 0 },
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
};
