import { useEffect, useState } from 'react';
import { Bookmark, CloudSun, Globe2, MessageCircle, RefreshCw } from 'lucide-react';
import { type City } from './engine';
import { Atmosphere, Button, External, Heading, Meta } from './ui';
import { cacheWeather, cachedWeather, clearWeather, fetchWeather, weatherDate, weatherDescription, type Weather } from './weather';
import type { GameUI } from './types';

export const readings = [
  { id: 'nasa', title: 'Voyager Golden Record', publisher: 'NASA / JPL-Caltech', date: '4 December 2017', href: 'https://science.nasa.gov/resource/voyager-golden-record/',
    category: 'Space / Culture', body: 'The two Voyager spacecraft carry copies of a record made to introduce Earth to anyone who might find it.',
    reaction: 'I like that somebody thought about what to say first, then sent the whole thing anyway.' },
  { id: 'letter', title: 'Walden', publisher: 'Project Gutenberg', date: '1854', href: 'https://www.gutenberg.org/ebooks/205',
    category: 'Books / Solitude', body: 'Henry David Thoreau’s account of living for two years beside Walden Pond.',
    reaction: 'I can see the appeal of taking a walk without adding it to your activity report.' },
] as const;

export function Outside({ s, send, go, discuss }: GameUI & { discuss: (title: string) => void }) {
  const city = s.settings.city;
  const [data, setData] = useState<Weather>();
  const [status, setStatus] = useState<'idle' | 'pending' | 'failed' | 'ready'>('idle');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!s.settings.world || !city) { clearWeather(); return; }
    const controller = new AbortController();
    const cached = cachedWeather(city);
    setData(cached);
    if (!navigator.onLine) { setStatus('failed'); return; }
    if (!retry && cached && Date.now() - cached.at < 15 * 60_000) { setStatus('ready'); return; }
    setStatus('pending');
    void fetchWeather(city, controller.signal).then(data => {
      if (!controller.signal.aborted) { cacheWeather(data); setData(data); setStatus('ready'); }
    }).catch(() => { if (!controller.signal.aborted) setStatus('failed'); });
    return () => controller.abort();
  }, [city, s.settings.world, retry]);
  const current = data?.city === city ? data.response.current : undefined;
  const outdated = status !== 'ready' || !navigator.onLine || Boolean(data && Date.now() - data.at > 60 * 60_000);
  const relevance = (reading: typeof readings[number]) => s.preferences.filter(term =>
    (reading.title + ' ' + reading.category).toLowerCase().includes(term.toLowerCase())).length;
  const shelf = [...readings].sort((a, b) => relevance(b) - relevance(a));
  return <>
    <Atmosphere variant="outside" />
    <Heading over="Outside" title="An open" italic="window.">Weather and a small shelf of things worth reading.</Heading>
    {!s.settings.world ? <section className="card feature">
      <Globe2 size={25} /><h2>Open the window</h2><p>Enable Outside to browse the reading shelf. If you choose a city, its coordinates are sent to the weather service.</p>
      <Button primary onClick={() => void send({ type: 'settings', settings: { world: true } })}>Enable Outside</Button>
    </section> : <div className="outside-grid">
      <section className="card feature weather-card">
        <Meta>Weather · {city ?? 'Choose a city'}</Meta><CloudSun size={38} strokeWidth={1.3} />
        {current && city ? <>
          <h2>{Math.round(current.temperature_2m)}°C <em>{weatherDescription(current.weather_code)}</em></h2>
          <p>{outdated ? 'Last available · ' : 'Model estimate · '}{weatherDate(city, current.time * 1000)}</p>
        </> : <h2>{!city ? 'Where are we looking?' : status === 'pending' ? 'Looking out…' : 'Weather unavailable'}</h2>}
        <div className="button-row">
          <Button onClick={() => go('settings')}>{city ? 'Change city' : 'Choose a city'}</Button>
          {city && <Button aria-label="Refresh weather" disabled={status === 'pending'} onClick={() => setRetry(n => n + 1)}><RefreshCw size={16} /></Button>}
        </div>
        {city && <External href="https://open-meteo.com/">Open-Meteo</External>}
      </section>
      {shelf.map(reading => <article className="card feature reading-card" key={reading.id}>
        <Meta>{reading.category}</Meta>
        <h2>{reading.title}</h2><p className="byline">{reading.publisher} · {reading.date}</p>
        <p>{reading.body}</p>
        <blockquote>“{reading.reaction}”</blockquote>
        <div className="button-row"><External href={reading.href}>Open source</External>
          <Button aria-label={s.articles.includes(reading.id) ? 'Remove saved reading' : 'Save reading'} aria-pressed={s.articles.includes(reading.id)}
            onClick={() => void send({ type: 'article', id: reading.id })}><Bookmark size={17} fill={s.articles.includes(reading.id) ? 'currentColor' : 'none'} /></Button>
          <Button onClick={() => discuss(reading.title)}><MessageCircle size={17} /> Discuss</Button></div>
      </article>)}
    </div>}
  </>;
}
