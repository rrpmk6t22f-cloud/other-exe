import { useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { cities, type City, type Save } from './engine';
import { mindEndpoint } from './Conversation';
import { exportSave, importSave } from './storage';
import { Button, Heading, Meta } from './ui';
import type { GameUI } from './types';

function Toggle({ label, detail, value, onChange }: { label: string; detail?: string; value: boolean; onChange: (value: boolean) => void }) {
  return <label className="toggle"><span><strong>{label}</strong>{detail && <small>{detail}</small>}</span><input type="checkbox" checked={value} onChange={event => onChange(event.target.checked)} /></label>;
}

export function Settings({ s, send, ask, notify, replace, install, swapHabitat }: GameUI & { replace: (save: Save) => Promise<void>; install: () => void; swapHabitat: () => Promise<void> }) {
  const [preference, setPreference] = useState('');
  const picker = useRef<HTMLInputElement>(null);
  const setting = (settings: Partial<Save['settings']>) => void send({ type: 'settings', settings });
  return <>
    <Heading over="Settings" title="How the room" italic="works." />
    <div className="settings-grid">
      <section className="card feature settings-card"><Meta>Display</Meta><h2>Light and movement</h2>
        <Toggle label="Night mode" value={s.settings.theme === 'night'} onChange={value => setting({ theme: value ? 'night' : 'paper' })} />
        <Toggle label="Reduce movement" detail="Keeps the living signal still." value={s.settings.still} onChange={still => setting({ still })} />
        <Toggle label="High contrast" value={s.settings.contrast} onChange={contrast => setting({ contrast })} />
      </section>
      <section className="card feature settings-card"><Meta>Outside</Meta><h2>Real-world access</h2>
        <Toggle label="Enable Outside" detail="Shows the reading shelf and lets you choose a city for weather." value={s.settings.world} onChange={world => setting({ world, city: world ? s.settings.city : null })} />
        <label className="select-label">Weather city<select disabled={!s.settings.world} value={s.settings.city ?? ''} onChange={event => setting({ city: (event.target.value || null) as City | null })}>
          <option value="">No city selected</option>{Object.keys(cities).map(city => <option key={city} value={city}>{city}</option>)}</select>
        </label>
        <p className="muted">The selected city is shared with the weather service. Your device location is never requested.</p>
      </section>
      <section className="card feature settings-card"><Meta>Conversation and memory</Meta><h2>What stays in the room</h2>
        <Toggle label="Keep conversation history" detail="Stored in the local save. Turning this off clears the transcript." value={s.settings.keepChat} onChange={keepChat => {
          if (keepChat) setting({ keepChat });
          else ask('Clear conversation history?', <><p>Future messages will be visible while the conversation is open.</p><Button primary onClick={() => setting({ keepChat: false })}>Clear and turn off</Button></>, true);
        }} />
        {mindEndpoint && <Toggle label="Live conversation" detail="Sends your message, recent turns, and Pip’s mood and stage to the configured service." value={s.settings.live} onChange={live => setting({ live })} />}
        <div className="button-row"><Button disabled={s.chat.length === 0} onClick={() => ask('Clear conversation history?', <><p>The transcript will be removed from this device.</p><Button primary onClick={() => void send({ type: 'clear-chat' })}>Clear conversation</Button></>, true)}>Clear history</Button></div>
        <form className="preference" onSubmit={event => { event.preventDefault(); if (preference.trim()) void send({ type: 'preference', text: preference }).then(next => { if (next) setPreference(''); }); }}>
          <label>Private reading preferences<input placeholder="e.g. space history" maxLength={120} value={preference} onChange={event => setPreference(event.target.value)} /></label>
          <Button type="submit" disabled={!s.hatched || !preference.trim()}>Add</Button>
        </form>
        {s.preferences.length > 0 && <><ul className="preference-list">{s.preferences.map(text => <li key={text}><span>{text}</span><Button aria-label={'Remove ' + text} onClick={() => void send({ type: 'preference', text, remove: true })}>Remove</Button></li>)}</ul>
          <Button onClick={() => ask('Clear reading preferences?', <Button primary onClick={() => void send({ type: 'clear-preferences' })}>Clear preferences</Button>, true)}>Clear all preferences</Button></>}
      </section>
      <section className="card feature settings-card"><Meta>Device</Meta><h2>Save and install</h2>
        <p>Export your progress to back it up or move it to another device. The file may include your conversation history and reading preferences.</p>
        <div className="button-row"><Button onClick={() => exportSave(s)}><Download size={16} /> Export save</Button><Button onClick={() => picker.current?.click()}><Upload size={16} /> Import save</Button></div>
        <input type="file" hidden accept=".json,application/json" ref={picker} onChange={async event => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (!file) return;
          try {
            const next = await importSave(file);
            ask('Replace this save?', <><p>The backup contains Day {next.day}. Export your current save first to keep a copy.</p><div className="button-row"><Button onClick={() => exportSave(s)}>Export current save</Button><Button primary onClick={() => void replace(next)}>Import Day {next.day}</Button></div></>);
          } catch (error) { notify(error instanceof Error ? error.message : 'The save could not be read.'); }
        }} />
        <Button onClick={() => ask('Switch habitat?', <><p>Open a second habitat to hatch another signal, or return to the one you previously opened. Both habitats are saved on this device.</p>
          <Button primary onClick={event => { const button = event.currentTarget; button.disabled = true; void swapHabitat().finally(() => { button.disabled = false; }); }}>Switch habitat</Button></>)}>Switch habitat</Button>
        <Button primary onClick={install}>Install OTHER.EXE</Button>
      </section>
    </div>
  </>;
}
