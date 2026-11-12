import { useRef, useState, type PointerEvent } from 'react';
import { Hand, ArrowRight, ArrowUpRight, BrushCleaning, ChevronDown, Moon, Soup, Sparkles, Shirt, MessageCircle, Sprout, SquareActivity } from 'lucide-react';
import { acts, items, stages } from './content';
import { canEvolve, mood, sceneFor, type Save } from './engine';
import { Incubator } from './Incubator';
import { figma, Organism, type Contact } from './Organism';
import { Atmosphere, Button, Meta } from './ui';
import type { GameUI } from './types';

const needs = { hunger: 'Hunger', energy: 'Energy', hygiene: 'Hygiene', connection: 'Connection', stimulation: 'Stimulation', stress: 'Stress' };
const sparkPositions = [[25, 47], [74, 37], [60, 61]] as const;
const first = [
  ['Feed', Soup], ['Talk', MessageCircle], ['Play', Sparkles], ['Rest', Moon],
] as const;

export function Home({ s, send, go, ask, reaction, reactTo }: GameUI & { reaction: string; reactTo: (value: string) => void }) {
  const contact = useRef<Contact>({ x: .5, y: .46, active: false, at: -Infinity });
  const press = useRef<{ id: number; at: number; x: number; y: number; moved: boolean } | null>(null);
  const [spark, setSpark] = useState<number | null>(null);
  const sparkStart = useRef<HTMLButtonElement>(null);
  const sparkHit = useRef(false);

  function hatchPreview() {
    ask('In the incubator', <Incubator initialSeed={s.seed} still={s.settings.still} hatch={async seed => {
      if (await send({ type: 'hatch', seed })) reactTo('Hatch');
    }} />, true);
  }

  function touch(gesture: 'pet' | 'hold' | 'spark') {
    reactTo(gesture === 'hold' ? 'Hold' : 'Play');
    void send({ type: 'touch', gesture });
  }

  function move(event: PointerEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    contact.current.x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    contact.current.y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
    contact.current.active = true;
    const started = press.current;
    if (started?.id === event.pointerId && Math.hypot(event.clientX - started.x, event.clientY - started.y) >= 12) {
      if (!started.moved) contact.current.at = performance.now();
      started.moved = true;
    }
  }

  function release(event: PointerEvent<HTMLButtonElement>) {
    const started = press.current;
    if (!started || started.id !== event.pointerId) return;
    press.current = null;
    contact.current.at = performance.now();
    contact.current.active = event.pointerType === 'mouse';
    touch(!started.moved && performance.now() - started.at >= 550 ? 'hold' : 'pet');
  }

  function catchSpark() {
    if (spark === null || sparkHit.current) return;
    sparkHit.current = true;
    reactTo('Play');
    if (spark === sparkPositions.length - 1) {
      setSpark(null);
      touch('spark');
      requestAnimationFrame(() => sparkStart.current?.focus());
    } else setSpark(spark + 1);
    requestAnimationFrame(() => { sparkHit.current = false; });
  }

  const scene = sceneFor(s);
  const state = mood(s);
  const tint = s.room === 'paper' ? '' : items.find(item => item.id === s.room)?.color;
  function careAction(action: 'Feed' | 'Play' | 'Rest' | 'Clean') {
    reactTo(action);
    void send({ type: 'care', action });
  }
  function showScene() {
    if (!scene) return;
    ask(scene.title, <>
      <blockquote>“{scene.line}”</blockquote>
      <div className="stack">{scene.choices.map((choice, option) =>
        <Button key={choice.flag} onClick={() => void send({ type: 'choice', id: scene.id, option })} disabled={s.act > 1 && s.points < 1}>{choice.label}<ArrowRight size={16} /></Button>
      )}</div>
      {s.act > 1 && s.points < 1 && <p className="muted">You’re out of activity points. Finish this scene tomorrow.</p>}
    </>, true);
  }
  const readyForDay = s.hatched && s.completed.includes('new') && (!scene || s.points === 0);
  return <>
    <Atmosphere variant="home" />
    <div className="home-grid">
      <div className="home-main">
        <header className="hero-heading">
          <h1 tabIndex={-1}>A life of<br /><em>its own.</em></h1>
        </header>
        <section className={'stage ' + (!s.hatched ? 'unhatched' : '')} aria-label="Creature habitat" style={tint ? { backgroundColor: tint } : undefined}>
          <div className="stage-wash wash-desktop" aria-hidden="true">{[3, 4, 5].map(i => <img key={i} src={figma('5-3-imgEllipse' + i)} alt="" />)}</div>
          <div className="stage-wash wash-mobile" aria-hidden="true">{[3, 4].map(i => <img key={i} src={figma('5-379-imgEllipse' + i)} alt="" />)}</div>
          <div className="stage-top">
            <Meta>{s.hatched ? stages[s.stage] + ' / ' + s.place : 'Unknown file / a living signal'}</Meta>
            <span className="stage-live"><i />{state}</span>
          </div>
          <Organism seed={s.seed} generation={s.generation} stage={s.stage} contact={contact} outfit={s.outfit} mood={state} still={s.settings.still} reaction={reaction} className="habitat-organism" />
          <button type="button" className="habitat-target" aria-label={s.hatched ? 'Pet Pip' : 'Open the incubator'}
            onPointerDown={event => {
              if (!s.hatched || !event.isPrimary || event.button !== 0) return;
              move(event);
              press.current = { id: event.pointerId, at: performance.now(), x: event.clientX, y: event.clientY, moved: false };
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={event => { if (s.hatched && event.isPrimary) move(event); }}
            onPointerUp={release}
            onPointerCancel={() => { press.current = null; contact.current.active = false; }}
            onPointerLeave={() => { if (!press.current) contact.current.active = false; }}
            onClick={event => {
              if (!s.hatched) hatchPreview();
              else if (event.detail === 0) { contact.current.at = performance.now(); touch('pet'); }
            }}>
            <span>{s.hatched ? 'Tap or brush to pet · hold to soothe' : 'Open incubator'}</span>
          </button>
          {spark !== null && <button type="button" className="habitat-spark" aria-label={`Catch spark ${spark + 1} of 3`}
            style={{ left: sparkPositions[spark][0] + '%', top: sparkPositions[spark][1] + '%' }}
            onClick={catchSpark}><Sparkles size={22} aria-hidden="true" /></button>}
          <div className="stage-caption">
            {s.hatched && <Meta>Pip · they/them</Meta>}
            <p aria-live="polite">{s.line}</p>
          </div>
        </section>

        {!s.hatched ? <div className="hatch-row"><Button primary onClick={hatchPreview}><Sprout size={18} /> Hatch the signal <ArrowRight size={17} /></Button><span>Your save lives on this device.</span></div> :
          <div className="care-actions" aria-label="Care actions">
            {first.map(([action, Icon]) => <Button key={action} primary={action === 'Talk'} onClick={() => action === 'Talk' ? go('mind') : careAction(action)}><Icon size={17} />{action}</Button>)}
            <Button onClick={() => careAction('Clean')}><BrushCleaning size={17} />Clean</Button>
            <Button onClick={() => go('wardrobe')}><Shirt size={17} />Dress</Button>
          </div>}
        {s.hatched && <div className="habitat-actions">
          <Button onClick={() => touch('hold')}><Hand size={16} /> Soothe</Button>
          <Button ref={sparkStart} aria-pressed={spark !== null} onClick={() => {
            if (spark !== null) { setSpark(null); return; }
            setSpark(0);
            requestAnimationFrame(() => document.querySelector<HTMLButtonElement>('.habitat-spark')?.focus({ preventScroll: true }));
          }}><Sparkles size={16} />{spark === null ? 'Catch sparks' : `Stop · ${spark}/3 caught`}</Button>
        </div>}
        {s.hatched && <details className="mobile-needs">
          <summary><SquareActivity size={16} /> Wellbeing <ChevronDown size={16} /></summary>
          <NeedList s={s} />
        </details>}
        {s.hatched && <div className="home-footer">
          <span>{acts[s.act - 1]}</span>
          <Button disabled={!readyForDay} onClick={() => ask('Start a new day?', <><p>Activity points refill to eight. Pip gets some rest.</p><Button primary onClick={() => void send({ type: 'day' })}>Begin day {s.day + 1}<ArrowRight size={16} /></Button></>, true)}>Next day <ArrowRight size={16} /></Button>
        </div>}
      </div>
      <aside className="context" aria-label="Habitat context">
        <div className="context-heading"><Meta>{s.hatched ? 'In the room' : 'Your first day'}</Meta><span /></div>
        {!s.hatched ? <section className="card context-card">
          <Meta>Local save</Meta><h2>Something is stirring.</h2>
          <p>A small digital organism is about to wake up. Make it a meal, keep it company, and see what it chooses to become.</p>
        </section> : <>
          <section className="card context-card next-scene">
            <Meta>{scene ? 'Story · new scene' : 'Day ' + s.day + ' · ' + s.points + '/8 activity points'}</Meta>
            <h2>{scene?.title ?? (!s.completed.includes('new') ? 'A first meal' : s.act === 5 && !s.ending ? 'Decide what comes next' : acts[s.act - 1])}</h2>
            <p>{scene?.line ?? (!s.completed.includes('new') ? 'Try Feed to bring Pip something to eat.' : s.act === 5 && !s.ending ? 'Your choices have opened paths in the Archive.' : 'Spend time in the world, or start a new day when you’re ready.')}</p>
            {scene && <button className="text-link" onClick={showScene}>Open scene <ArrowUpRight size={15} /></button>}
            {!scene && s.act === 5 && !s.ending && <button className="text-link" onClick={() => go('archive')}>See endings <ArrowUpRight size={15} /></button>}
            {!scene && s.act < 5 && s.completed.includes('new') && <button className="text-link" onClick={() => go('world')}>Explore the world <ArrowUpRight size={15} /></button>}
          </section>
          <section className="card context-card wellbeing"><Meta>Wellbeing</Meta><NeedList s={s} /></section>
          {canEvolve(s) && <button className="card context-card context-link" onClick={() => go('evolution')}><span><Meta>Evolution</Meta><strong>A different shape</strong></span><ArrowUpRight size={19} /></button>}
          {s.settings.world && <button className="card context-card context-link" onClick={() => go('outside')}><span><Meta>Outside</Meta><strong>Open the window</strong></span><ArrowUpRight size={19} /></button>}
        </>}
      </aside>
    </div>
  </>;
}

function NeedList({ s }: { s: Save }) {
  return <div className="need-list">{Object.entries(needs).map(([key, label]) => {
    const value = Math.round(s.needs[key as keyof Save['needs']]);
    return <div className="need" key={key}><span>{label}</span><meter aria-label={label} max={100} value={value} className={key === 'stress' ? 'stress' : ''} /><span>{value}</span></div>;
  })}</div>;
}
