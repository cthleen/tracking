import type { PageServerLoad } from './$types';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresIn: number;
}

class FetchCache {
    private cache = new Map<string, CacheEntry<any>>();
    private pendingRequests = new Map<string, Promise<any>>();

    async fetch<T>(url:  string, ttl: number = 60000): Promise<T> {
        const cacheKey = url;

        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < cached.expiresIn) {
            // console.log(`✓ Cache HIT: ${url. substring(0, 80)}...`);
            return cached.data;
        }

        if (this.pendingRequests. has(cacheKey)) {
            // console.log(`⏳ Deduped request:  ${url.substring(0, 80)}...`);
            return this.pendingRequests.get(cacheKey)!;
        }

        // console.log(`✗ Fetching: ${url.substring(0, 80)}...`);
        const request = fetch(url)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then(data => {
                this. cache.set(cacheKey, {
                    data,
                    timestamp: Date.now(),
                    expiresIn: ttl
                });
                this. pendingRequests.delete(cacheKey);
                return data;
            })
            .catch(error => {
                this.pendingRequests.delete(cacheKey);
                throw error;
            });

        this.pendingRequests.set(cacheKey, request);
        return request;
    }

    async fetchAll<T>(urls: string[], ttl?:  number): Promise<T[]> {
        return Promise.all(urls.map(url => this.fetch<T>(url, ttl)));
    }

    clear(url?:  string) {
        if (url) {
            this.cache.delete(url);
        } else {
            this.cache.clear();
        }
    }
}

const fetchCache = new FetchCache();

if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of fetchCache['cache'].entries()) {
            if (now - entry.timestamp >= entry.expiresIn) {
                fetchCache['cache'].delete(key);
            }
        }
    }, 120000);
}

function calculateDateRange(range: "daily" | "weekly" | "monthly") {
    const now = new Date();

    let start: string;
    let end: string;
    let interval: string;

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
        end = lastDayUTC. toISOString();
        interval = "day";
    }

    return { start, end, interval };
}

function generateEmptyDataPoints(
    start: string, 
    end: string, 
    interval: "hour" | "day"
): Array<{ date: string; male: number; female: number }> {
    const dataPoints: Array<{ date: string; male: number; female: number }> = [];
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (interval === "hour") {
        let current = new Date(startDate);
        while (current <= endDate) {
            dataPoints.push({
                date: current.toISOString(),
                male: 0,
                female: 0
            });
            current.setHours(current.getHours() + 1);
        }
    } else {
        let current = new Date(startDate);
        while (current <= endDate) {
            dataPoints.push({
                date: current.toISOString(),
                male: 0,
                female: 0
            });
            current.setDate(current.getDate() + 1);
        }
    }

    return dataPoints;
}

function extractDataArray(data: any): any[] {
    if (Array.isArray(data)) return data;
    if (data. data?. data && Array.isArray(data.data.data)) return data.data.data;
    if (data.data && Array.isArray(data.data)) return data.data;
    return [];
}

function processActivityData(
    results: any[],
    start: string,
    end: string,
    interval: "hour" | "day"
): Array<{ date: string; male: number; female: number }> {
    const grouped:  Record<string, { male: number; female: number }> = {};

    // Process actual data from API
    for (const result of results) {
        const items = extractDataArray(result);
        for (const item of items) {
            const dateKey = item.timestamp || item.date;
            if (! dateKey) continue;

            if (!grouped[dateKey]) {
                grouped[dateKey] = { male: 0, female: 0 };
            }

            if (item.gender === "M") {
                grouped[dateKey].male += item.count || 0;
            } else if (item.gender === "F") {
                grouped[dateKey]. female += item.count || 0;
            }
        }
    }

    if (Object.keys(grouped).length === 0) {
        console.log('⚠️ No activity data found, generating empty data points');
        return generateEmptyDataPoints(start, end, interval);
    }

    return Object.entries(grouped)
        .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
        .map(([date, counts]) => ({ date, ...counts }));
}

function processPieChartData(
    results: any[], 
    locations: any[]
): Array<{ location: string; visitors: number }> {
    const locationData: Array<{ location: string; visitors:  number }> = [];

    results.forEach((result, index) => {
        const items = extractDataArray(result);
        const totalVisitors = items. reduce(
            (sum, item) => sum + (item.count || item.visitors || 0),
            0
        );

        if (locations[index]) {
            locationData. push({
                location: locations[index].name || 
                         locations[index].location_name || 
                         `Location ${index + 1}`,
                visitors: totalVisitors
            });
        }
    });

    return locationData
        .sort((a, b) => b.visitors - a.visitors)
        .slice(0, 10);
}

function processGenderData(results: any[]): { male: number; female: number } {
    const genderData = { male: 0, female: 0 };

    for (const result of results) {
        const items = extractDataArray(result);
        for (const item of items) {
            if (item. gender === "M") {
                genderData.male += item. count || 0;
            } else if (item.gender === "F") {
                genderData.female += item.count || 0;
            }
        }
    }

    return genderData;
}

export const load: PageServerLoad = async ({ fetch, url, setHeaders }) => {
    const rangeParam = url.searchParams.get("range");
    const range: "daily" | "weekly" | "monthly" =
        rangeParam === "daily" ? "daily" : 
        rangeParam === "weekly" ? "weekly" :
        rangeParam === "monthly" ?  "monthly" : 
        "daily";

    const { start, end, interval } = calculateDateRange(range);

    setHeaders({
        'cache-control': 'public, max-age=3600, stale-while-revalidate=60'
    });

    console.log(`\n📊 Dashboard Load - Range: ${range}, ${start} to ${end}\n`);

    try {
        const baseUrl = "http://localhost:8000";

        const locationsData = await fetchCache.fetch<any>(
            `${baseUrl}/api/location`,
            300000
        );

        const locations:  any[] = Array.isArray(locationsData)
            ? locationsData
            : Array.isArray(locationsData. data)
            ? locationsData.data
            : [];

        if (locations.length === 0) {
            console.warn('⚠️ No locations found, returning empty data structure');
            return {
                processedData: generateEmptyDataPoints(start, end, interval as "hour" | "day"),
                locationData: [],
                genderData: { male: 0, female: 0 },
                range,
                isEmpty: true,
                metadata: {
                    totalLocations: 0,
                    fetchTime:  0,
                    processTime:  0,
                    cached:  false
                }
            };
        }

        console.log(`✓ Found ${locations.length} locations`);

        const locationIds = locations
            .map(loc => loc.id || loc.location_id || loc.uuid)
            .filter(Boolean);

        console.log('🚀 Starting parallel fetch...');
        const startTime = Date.now();

        const [activityResults, pieChartResults, genderResults] = await Promise.all([
            fetchCache.fetchAll(
                locationIds.map(id =>
                    `${baseUrl}/api/location/${id}/customer-count? start=${start}&end=${end}&interval=${interval}`
                ),
                60000
            ).catch(err => {
                console.error('Activity fetch error:', err);
                return [];
            }),

            fetchCache.fetchAll(
                locationIds.slice(0, 10).map(id => {
                    const oneYearAgo = new Date();
                    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                    return `${baseUrl}/api/location/${id}/customer-count?start=${oneYearAgo.toISOString()}&end=${new Date().toISOString()}&interval=day`;
                }),
                3600000
            ).catch(err => {
                console.error('Pie chart fetch error:', err);
                return [];
            }),

            fetchCache.fetchAll(
                locationIds.map(id =>
                    `${baseUrl}/api/location/${id}/customer-count?start=${start}&end=${end}&interval=day`
                ),
                60000
            ).catch(err => {
                console.error('Gender fetch error:', err);
                return [];
            })
        ]);

        const fetchTime = Date.now() - startTime;
        console.log(`✓ Parallel fetch completed in ${fetchTime}ms`);

        console.log('⚙️ Processing data...');
        const processStartTime = Date.now();

        const processedData = processActivityData(activityResults, start, end, interval as "hour" | "day");
        const locationData = processPieChartData(pieChartResults, locations. slice(0, 10));
        const genderData = processGenderData(genderResults);

        const processTime = Date.now() - processStartTime;
        console.log(`✓ Data processed in ${processTime}ms`);

        console.log(`\n📈 Results Summary:`);
        console.log(`   - Activity data points: ${processedData.length}`);
        console.log(`   - Top locations:  ${locationData.length}`);
        console.log(`   - Gender:  M=${genderData.male}, F=${genderData.female}`);
        console.log(`   - Total time: ${fetchTime + processTime}ms\n`);

        const hasActivityData = processedData.some(d => d.male > 0 || d.female > 0);
        const hasLocationData = locationData.some(l => l.visitors > 0);
        const isEmpty = !hasActivityData && !hasLocationData && genderData.male === 0 && genderData.female === 0;

        return {
            processedData,
            locationData,
            genderData,
            range,
            isEmpty,
            metadata: {
                totalLocations: locations.length,
                fetchTime,
                processTime,
                cached: fetchTime < 500
            }
        };

    } catch (error) {
        console.error('❌ Dashboard load error:', error);

        const { start, end, interval } = calculateDateRange(range);
        return {
            processedData: generateEmptyDataPoints(start, end, interval as "hour" | "day"),
            locationData: [],
            genderData: { male: 0, female: 0 },
            range,
            isEmpty: true,
            error: error instanceof Error ? error.message : 'Unknown error',
            metadata: {
                totalLocations: 0,
                fetchTime: 0,
                processTime: 0,
                cached:  false
            }
        };
    }
};