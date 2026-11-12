import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowUpRight, Send, ShieldCheck } from 'lucide-react';
import { mood } from './engine';
import { Organism } from './Organism';
import { Atmosphere, Button, Heading, Meta } from './ui';
import type { GameUI } from './types';

export const mindEndpoint = import.meta.env.VITE_MIND_ENDPOINT as string | undefined;

export function Conversation({ s, send, go, firstMessage }: GameUI & { firstMessage: string }) {
  const [message, setMessage] = useState(firstMessage);
  const [thinking, setThinking] = useState(false);
  const [status, setStatus] = useState('');
  const [ephemeral, setEphemeral] = useState<{ from: 'You' | 'Pip'; text: string; day: number; live?: boolean }[]>([]);
  const scroll = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const entries = s.settings.keepChat ? s.chat : ephemeral;
  useEffect(() => { if (scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight; }, [entries.length, thinking]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const value = message.trim();
    if (!value || thinking) return;
    setMessage('');
    setStatus('');
    setThinking(true);
    try {
      const next = await send({ type: 'chat', message: value });
      if (!next) return;
      let reply = next.line;
      let live = false;
      if (next.settings.live && mindEndpoint && navigator.onLine) {
        try {
          const response = await fetch(mindEndpoint, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'omit',
            body: JSON.stringify({ message: value, stage: next.stage, mood: mood(next),
              context: next.chat.slice(0, -2).slice(-6).map(entry => ({ from: entry.from, text: entry.text.slice(0, 400) })) }),
            signal: AbortSignal.timeout(8500),
          });
          if (!response.ok) throw new Error('Live reply unavailable');
          const body = await response.json();
          if (typeof body.utterance !== 'string' || !body.utterance.trim() || body.utterance.length > 600) throw new Error('Invalid reply');
          const saved = await send({ type: 'live-reply', turn: next.rev, reply: body.utterance });
          if (saved) { reply = body.utterance; live = true; }
        } catch {
          setStatus('Live conversation unavailable. Pip’s local reply is shown.');
        }
      }
      if (!next.settings.keepChat) setEphemeral(items => [...items, { from: 'You' as const, text: value, day: next.day }, { from: 'Pip' as const, text: reply, day: next.day, live }].slice(-30));
    } finally {
      setThinking(false);
      input.current?.focus();
    }
  }

  return <>
    <Atmosphere variant="mind" />
    <Heading over="Mind / Conversation" title="In their" italic="own words.">A conversation with Pip.</Heading>
    <div className="mind-grid">
      <section className="card conversation">
        <header className="conversation-header">
          <div className="conversation-avatar"><Organism seed={s.seed} generation={s.generation} stage={s.stage} still={s.settings.still} /></div>
          <div><strong>Pip</strong><div className="muted">they/them</div></div>
          <Meta className="right">{s.settings.live && mindEndpoint && navigator.onLine ? 'Live enabled' : 'Local dialogue'}</Meta>
        </header>
        <div ref={scroll} className="messages" role="log" aria-label="Conversation" tabIndex={0}>
          {entries.length === 0 && <div className="message"><Meta>Pip</Meta><p>“{s.line}”</p></div>}
          {entries.map((entry, i) => <div key={i} className={'message ' + (entry.from === 'You' ? 'player' : '')}><Meta>{entry.from} · Day {entry.day}{entry.live ? ' · live' : ''}</Meta><p>{entry.text}</p></div>)}
        </div>
        <div className="quick-prompts">
          {['How are you feeling?', 'What do you remember?', 'What kind of work would you like?'].map(prompt => <button key={prompt} type="button" onClick={() => { setMessage(prompt); input.current?.focus(); }}>{prompt}</button>)}
        </div>
        <form className="composer" onSubmit={submit}>
          <textarea rows={1} ref={input} aria-label="Message to Pip" placeholder="Say something to Pip…" maxLength={600} value={message} onChange={event => setMessage(event.target.value)}
            onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} />
          <Button primary type="submit" disabled={!message.trim() || thinking} aria-label="Send message"><Send size={17} /></Button>
        </form>
        {(status || thinking) && <p role="status" className="conversation-status">{thinking ? 'Pip is thinking…' : status}</p>}
      </section>
      <aside className="card context-card privacy-card">
        <ShieldCheck size={22} /><Meta>Memory</Meta><h2>What Pip keeps.</h2>
        <p>The journal holds their story. Conversation history and reading preferences have separate controls.</p>
        <button className="text-link" onClick={() => go('settings')}>Memory settings <ArrowUpRight size={15} /></button>
      </aside>
    </div>
  </>;
}
