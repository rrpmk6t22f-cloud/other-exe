const locations: Record<string, [number, number]> = {
  Madrid: [40.4168, -3.7038],
  Barcelona: [41.3874, 2.1686],
  London: [51.5072, -0.1276],
  'New York': [40.7128, -74.006],
  Tokyo: [35.6762, 139.6503],
  'Mexico City': [19.4326, -99.1332],
};

type Forecast = { current: { time: number; temperature_2m: number; weather_code: number } };
const cache = new Map<string, { expires: number; data: Promise<Forecast> }>();

async function forecast(city: string): Promise<Forecast> {
  const [latitude, longitude] = locations[city];
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.search = new URLSearchParams({
    latitude: String(latitude), longitude: String(longitude), current: 'temperature_2m,weather_code', timeformat: 'unixtime',
  }).toString();
  const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(4500) });
  if (!response.ok) throw new Error('Upstream unavailable');
  const current = (await response.json()).current;
  if (![current?.time, current?.temperature_2m, current?.weather_code].every(Number.isFinite) || current.time <= 0 ||
      !Number.isInteger(current.weather_code) || current.weather_code < 0 || current.weather_code > 99) throw new Error('Invalid upstream forecast');
  return { current: { time: current.time, temperature_2m: current.temperature_2m, weather_code: current.weather_code } };
}

Deno.serve(async request => {
  const origin = request.headers.get('Origin');
  const allowed = new Set([
    'https://rrpmk6t22f-cloud.github.io',
    'http://127.0.0.1:4173',
    'http://localhost:4173',
    'http://127.0.0.1:5173',
    'http://localhost:5173',
  ]);
  const headers = new Headers({ Vary: 'Origin', 'Cache-Control': 'no-store' });
  if (origin) {
    if (!allowed.has(origin)) return Response.json({ error: 'Origin unavailable' }, { status: 403, headers });
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'authorization, apikey');
  }
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'GET') return Response.json({ error: 'Method unavailable' }, { status: 405, headers });
  const city = new URL(request.url).searchParams.get('city') ?? '';
  if (!Object.hasOwn(locations, city)) return Response.json({ error: 'Unknown city' }, { status: 400, headers });

  let entry = cache.get(city);
  if (!entry || Date.now() >= entry.expires) {
    entry = { expires: Date.now() + 15 * 60_000, data: forecast(city) };
    cache.set(city, entry);
  }
  try {
    return Response.json(await entry.data, { headers });
  } catch {
    if (cache.get(city) === entry) cache.delete(city);
    return Response.json({ error: 'Forecast unavailable' }, { status: 502, headers });
  }
});
