import { z } from 'zod';
import { cities, type City } from './engine';

const weatherSchema = z.object({ current: z.object({
  time: z.number().finite().positive(), temperature_2m: z.number().finite(), weather_code: z.number().int().min(0).max(99),
}) });
const record = z.object({ city: z.string(), at: z.number(), response: weatherSchema });
export type Weather = z.infer<typeof record>;
const weatherEndpoint = import.meta.env.VITE_WEATHER_ENDPOINT as string | undefined;
const weatherKey = import.meta.env.VITE_WEATHER_ANON_KEY as string | undefined;
const cacheKey = 'other-exe:weather:' + new URL('.', location.href).pathname;

export async function fetchWeather(city: City, signal: AbortSignal) {
  const [latitude, longitude] = cities[city];
  const url = weatherEndpoint ? new URL(weatherEndpoint) : new URL('https://api.open-meteo.com/v1/forecast');
  const query = weatherEndpoint ? { city } : {
    latitude: String(latitude), longitude: String(longitude), current: 'temperature_2m,weather_code', timeformat: 'unixtime',
  };
  for (const [key, value] of Object.entries(query)) if (value !== undefined) url.searchParams.set(key, value);
  const headers = weatherEndpoint && weatherKey ? { apikey: weatherKey, Authorization: 'Bearer ' + weatherKey } : undefined;
  const result = await fetch(url, { headers, signal: AbortSignal.any([signal, AbortSignal.timeout(8500)]), credentials: 'omit' });
  if (!result.ok) throw new Error('Weather service unavailable');
  return { city, at: Date.now(), response: weatherSchema.parse(await result.json()) };
}

export function cacheWeather(weather: Weather) {
  try { localStorage.setItem(cacheKey, JSON.stringify(weather)); } catch { /* Weather is optional. */ }
}

export function cachedWeather(city: City) {
  try {
    const found = record.safeParse(JSON.parse(localStorage.getItem(cacheKey) ?? 'null'));
    if (found.success && found.data.city === city) return found.data;
  } catch { /* An old or unavailable cache can be ignored. */ }
}

export function clearWeather() {
  try { localStorage.removeItem(cacheKey); } catch { /* Weather is optional. */ }
}

export function weatherDescription(code: number) {
  if (code === 0) return 'Clear';
  if (code <= 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code <= 49) return 'Fog';
  if (code <= 59) return 'Drizzle';
  if (code <= 69) return 'Rain';
  if (code <= 79) return 'Snow';
  if (code <= 84) return 'Showers';
  if (code <= 86) return 'Snow showers';
  return 'Thunderstorms';
}

export function weatherDate(city: City, at: number) {
  return new Intl.DateTimeFormat(undefined, { timeZone: cities[city][2], dateStyle: 'medium', timeStyle: 'short' }).format(at);
}
