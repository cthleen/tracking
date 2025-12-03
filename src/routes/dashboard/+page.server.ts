import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, url, setHeaders }) => {
    const rangeParam = url.searchParams.get("range");

    const range: "daily" | "weekly" | "monthly" =
      rangeParam === "daily" ? "daily" :
      rangeParam === "weekly" ? "weekly" :
      rangeParam === "monthly" ? "monthly" :
      "daily";

    let start: string;
    let end: string;
    let interval: string;

    const now = new Date();
    now.setUTCFullYear(2025);

    setHeaders({
        'cache-control': 'public, max-age=300'
    });

    if (range === "daily") {
        const todayUTC = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(), 0, 0, 0, 0
        ));
        start = todayUTC.toISOString();

        const endOfDayUTC = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(), 23, 59, 59, 999
        ));
        end = endOfDayUTC.toISOString();
        interval = "hour";
    } else if (range === "weekly") {
        const day = now.getUTCDay();
        const diffToMonday = day === 0 ? -6 : 1 - day;

        const mondayUTC = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate() + diffToMonday, 0, 0, 0, 0
        ));

        const sundayUTC = new Date(Date.UTC(
            mondayUTC.getUTCFullYear(),
            mondayUTC.getUTCMonth(),
            mondayUTC.getUTCDate() + 6, 23, 59, 59, 999
        ));

        start = mondayUTC.toISOString();
        end = sundayUTC.toISOString();
        interval = "day";
    } else {
        const firstDayUTC = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            1, 0, 0, 0, 0
        ));
        const lastDayUTC = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth() + 1,
            0, 23, 59, 59, 999
        ));
        start = firstDayUTC.toISOString();
        end = lastDayUTC.toISOString();
        interval = "day";
    }

    console.log(`Fetching data for range: ${range}, start: ${start}, end: ${end}, interval: ${interval}`);

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

        console.log(`Found ${locations.length} locations for activity chart`);

        // Fetch activity chart data from ALL locations
        const activityPromises = locations.map(async (loc) => {
            const locId = loc.id || loc.location_id || loc.uuid;
            if (!locId) return [];

            try {
                const locApiUrl = `${baseUrl}/api/location/${locId}/customer-count?start=${start}&end=${end}&interval=${interval}`;
                const locRes = await fetch(locApiUrl);

                if (locRes.ok) {
                    const locData = await locRes.json();
                    const items: any[] = Array.isArray(locData)
                        ? locData
                        : Array.isArray(locData.data)
                        ? locData.data
                        : Array.isArray(locData.data?.data)
                        ? locData.data.data
                        : [];
                    return items;
                }
            } catch (error) {
                console.warn(`Failed to fetch data for location ${locId}:`, error);
            }
            return [];
        });

        const activityResults = await Promise.all(activityPromises);
        const allActivityItems = activityResults.flat();

        console.log(`Extracted ${allActivityItems.length} items from ALL locations for activity chart`);

        const grouped: Record<string, { male: number; female: number }> = {};

        for (const item of allActivityItems) {
            const date = new Date(item.timestamp);
            let dateKey: string;

            if (range === "daily") {
                const slotHour = Math.floor(date.getUTCHours() / 2) * 2;
                const slotDate = new Date(Date.UTC(
                    date.getUTCFullYear(),
                    date.getUTCMonth(),
                    date.getUTCDate(),
                    slotHour, 0, 0, 0
                ));
                dateKey = slotDate.toISOString();
            } else {
                const dayDate = new Date(Date.UTC(
                    date.getUTCFullYear(),
                    date.getUTCMonth(),
                    date.getUTCDate(), 0, 0, 0, 0
                ));
                dateKey = dayDate.toISOString();
            }

            if (!grouped[dateKey]) {
                grouped[dateKey] = { male: 0, female: 0 };
            }

            if (item.gender === "M") {
                grouped[dateKey].male += item.count || 0;
            } else if (item.gender === "F") {
                grouped[dateKey].female += item.count || 0;
            }
        }

        const processedData = Object.entries(grouped)
            .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
            .map(([date, val]) => ({
                date,
                male: val.male,
                female: val.female
            }));

        console.log('Sample processed data (aggregated from all locations):', processedData.slice(0, 3));

        let locationData: Array<{ location: string; visitors: number }> = [];
        try {
            const pieChartLocationsRes = await fetch(`${baseUrl}/api/location`);

            if (pieChartLocationsRes.ok) {
                const pieChartLocationsData = await pieChartLocationsRes.json();

                const pieChartLocations: any[] = Array.isArray(pieChartLocationsData)
                    ? pieChartLocationsData
                    : Array.isArray(pieChartLocationsData.data)
                    ? pieChartLocationsData.data
                    : [];

                const oneYearAgo = new Date();
                oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                const pieChartStart = oneYearAgo.toISOString();
                const pieChartEnd = new Date().toISOString();

                const pieChartPromises = pieChartLocations.slice(0, 10).map(async (loc, index) => { // Show more locations
                    const locId = loc.id || loc.location_id || loc.uuid;
                    if (!locId) return null;

                    try {
                        const locApiUrl = `${baseUrl}/api/location/${locId}/customer-count?start=${pieChartStart}&end=${pieChartEnd}&interval=day`;
                        const locRes = await fetch(locApiUrl);

                        if (locRes.ok) {
                            const locData = await locRes.json();
                            console.log("PieChart raw response for", locId, locData);

                            // Handle the specific API response structure: { status, message, data: { data: null|array } }
                            let items: any[] = [];

                            if (locData.data?.data && Array.isArray(locData.data.data)) {
                                items = locData.data.data;
                            } else if (locData.data && Array.isArray(locData.data)) {
                                items = locData.data;
                            } else if (Array.isArray(locData)) {
                                items = locData;
                            } else {
                                items = [];
                            }

                            const totalVisitors = items.reduce(
                                (sum, item) => sum + (item.count || item.visitors || 0),
                                0
                            );

                            return {
                                location: loc.name || loc.location_name || `Location ${locId}`,
                                visitors: totalVisitors
                            };
                        }

                    } catch (error) {
                        console.warn(`Failed to fetch data for location ${locId}:`, error);
                    }
                    return null;
                });

                const pieChartResults = await Promise.all(pieChartPromises);
                const validPieChartResults = pieChartResults.filter((result): result is { location: string; visitors: number } =>
                    result !== null && result.visitors > 0
                );

                if (validPieChartResults.length > 0) {
                    locationData = validPieChartResults.sort((a, b) => b.visitors - a.visitors);
                    console.log('Pie chart data (last 365 days):', locationData);
                } else {
                    locationData = [];
                    console.log('No pie chart data available from API');
                }
            } else {
                console.warn('Failed to fetch locations for pie chart');
                locationData = [];
            }
        } catch (error) {
            console.error('Error fetching pie chart data:', error);
            locationData = [];
        }

        // Fetch gender distribution data (total male/female across all locations for the selected range)
        let genderData: { male: number; female: number } = { male: 0, female: 0 };
        try {
            const genderPromises = locations.map(async (loc) => {
                const locId = loc.id || loc.location_id || loc.uuid;
                if (!locId) return { male: 0, female: 0 };

                try {
                    const locApiUrl = `${baseUrl}/api/location/${locId}/customer-count?start=${start}&end=${end}&interval=day`;
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
                            if (item.gender === "M") {
                                genderCounts.male += item.count || 0;
                            } else if (item.gender === "F") {
                                genderCounts.female += item.count || 0;
                            }
                        }
                        return genderCounts;
                    }
                } catch (error) {
                    console.warn(`Failed to fetch gender data for location ${locId}:`, error);
                }
                return { male: 0, female: 0 };
            });

            const genderResults = await Promise.all(genderPromises);
            genderData = genderResults.reduce(
                (acc, curr) => ({
                    male: acc.male + curr.male,
                    female: acc.female + curr.female
                }),
                { male: 0, female: 0 }
            );

            console.log('Gender distribution data:', genderData);
        } catch (error) {
            console.error('Error fetching gender data:', error);
            genderData = { male: 0, female: 0 };
        }

        // Calculate peak hours data (24 hours, 0-23)
        let peakHoursData: Array<{ hour: string; customers: number }> = [];
        try {
            // Group all activity data by hour
            const hourGroups: Record<number, number> = {};

            // Initialize all hours with 0
            for (let h = 0; h < 24; h++) {
                hourGroups[h] = 0;
            }

            // Aggregate customer counts by hour
            for (const item of allActivityItems) {
                const date = new Date(item.timestamp);
                const hour = date.getUTCHours();
                hourGroups[hour] += item.count || 0;
            }

            // Convert to chart format
            peakHoursData = Object.entries(hourGroups)
                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                .map(([hour, customers]) => ({
                    hour: hour.toString(),
                    customers: customers
                }));

            console.log('Peak hours data:', peakHoursData);
        } catch (error) {
            console.error('Error calculating peak hours data:', error);
            // Fallback: create empty data
            peakHoursData = Array.from({ length: 24 }, (_, i) => ({
                hour: i.toString(),
                customers: 0
            }));
        }

        return {
            rawData: allActivityItems,
            processedData,
            locationData,
            genderData,
            peakHoursData,
            range,
            start,
            end,
            interval,
            success: true,
            totalDataPoints: processedData.length
        };

    } catch (error) {
        console.error('Error in page server load:', error);

        return {
            rawData: [],
            processedData: [],
            range,
            start,
            end,
            interval,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
};
