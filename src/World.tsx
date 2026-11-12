import { ArrowRight, ArrowUpRight, Briefcase, Gamepad2, Lock, MapPin, Shirt, Users } from 'lucide-react';
import { useState } from 'react';
import { games, items, jobs, people, places } from './content';
import { Organism } from './Organism';
import { Button, Heading, Meta } from './ui';
import type { GameUI } from './types';

export function World({ s, send, go, ask }: GameUI) {
  return <>
    <Heading over="World" title="Places to" italic="be.">{s.points} of 8 activity points left · Day {s.day}</Heading>
    <div className="button-row world-links">
      <Button onClick={() => go('social')}><Users size={18} /> Social</Button>
      <Button onClick={() => go('career')}><Briefcase size={18} /> Career Office</Button>
      <Button onClick={() => go('games')}><Gamepad2 size={18} /> Mini-games</Button>
      <Button onClick={() => go('wardrobe')}><Shirt size={18} /> The Mall</Button>
    </div>
    <div className="tile-grid">{places.map(place => {
      const locked = s.act < place.act;
      const here = s.place === place.name;
      return <article className="card tile" key={place.name}>
        <Meta>{here ? 'You are here' : locked ? 'Opens in act ' + place.act : place.name === 'Home' ? 'Free visit' : '1 activity point'}</Meta>
        <h2>{place.name}</h2><p>{place.about}</p>
        <Button disabled={locked || here || (s.points < 1 && place.name !== 'Home')} onClick={() => ask('Visit ' + place.name + '?', <><p>{place.about}</p><Button primary onClick={() => void send({ type: 'visit', id: place.name }).then(next => { if (next) go('home'); })}>Visit <ArrowRight size={16} /></Button></>, true)}>
          {locked ? <><Lock size={15} /> Locked</> : here ? 'Current place' : <>Visit <ArrowUpRight size={15} /></>}
        </Button>
      </article>;
    })}</div>
  </>;
}

export function Social({ s, send, ask }: GameUI) {
  return <>
    <Heading over="Social" title="People to" italic="make time for.">Visits cost one activity point. {s.points} left today.</Heading>
    <div className="tile-grid">{people.map(person => {
      const locked = person.act > s.act;
      const bond = s.bonds[person.id];
      const done = bond?.lastDay === s.day;
      return <article className="card tile person" key={person.id}>
        <div className="person-mark" style={{ backgroundColor: person.color }}><i /><i /></div>
        <Meta>{person.place}</Meta><h2>{person.name}</h2><p>{person.role}</p>
        {bond && <div className="bond" aria-label="Relationship">
          <span>{bond.affinity >= 30 ? 'Fond' : 'Acquainted'}</span>
          <span>{bond.trust >= 29 ? 'Trusting' : 'Getting to know you'}</span>
          <span>{bond.closeness >= 24 ? 'Close' : 'Early days'}</span>
          <span>{bond.tension <= 4 ? 'At ease' : 'A little reserved'}</span>
        </div>}
        <Button disabled={locked || done || s.points < 1} onClick={() => ask(person.name, <>
          <blockquote>“{person.line}”</blockquote><p>{person.question}</p><div className="stack">
            <Button primary onClick={() => void send({ type: 'social', id: person.id, kind: true })}>{person.kind}</Button>
            <Button onClick={() => void send({ type: 'social', id: person.id, kind: false })}>{person.boundary}</Button>
          </div>
        </>, true)}>{locked ? 'Opens in act ' + person.act : done ? 'Visited today' : 'Spend time'}</Button>
      </article>;
    })}</div>
  </>;
}

export function Career({ s, send, ask }: GameUI) {
  const worked = s.flags.includes('shift-' + s.day);
  return <>
    <Heading over="Career office" title="Working" italic="hours.">One shift per day. Each shift costs two activity points.</Heading>
    {s.job && <div className="card inline-card"><span>Current role · <strong>{jobs.find(job => job.id === s.job)?.name}</strong>{s.shifts >= 3 && ' · Senior rate +2 credits'}</span>
      <Button onClick={() => ask('Leave the job?', <><p>Pip can take another role on a later shift.</p><Button primary onClick={() => void send({ type: 'quit' })}>Hand in the key</Button></>, true)}>Leave role</Button></div>}
    <div className="tile-grid">{jobs.map(job => <article className="card tile" key={job.id}>
      <Meta>+{job.pay + (s.shifts >= 3 ? 2 : 0)} credits · +{job.stress} stress</Meta><h2>{job.name}</h2><p>{job.task}</p>
      <Button disabled={job.act > s.act || worked || s.points < 2}
        onClick={() => ask(job.name, <><p>{job.task}</p><p>2 activity points · {job.pay + (s.shifts >= 3 ? 2 : 0)} credits · +{job.stress} stress</p><Button primary onClick={() => void send({ type: 'work', id: job.id })}>Take this shift</Button></>, true)}>
        {job.act > s.act ? 'Opens in act ' + job.act : worked ? 'Shift worked today' : 'Review shift'}
      </Button>
    </article>)}</div>
  </>;
}

export function Wardrobe({ s, send, ask, go }: GameUI) {
  const [mode, setMode] = useState<'Wearable' | 'Room'>('Wearable');
  const [preview, setPreview] = useState('');
  const active = mode === 'Room' ? s.room : s.outfit;
  const item = items.find(item => item.id === (preview || active));
  return <>
    <Heading over="Wardrobe" title="Things to" italic="try on.">{s.credits} credits · Expression changes Pip’s appearance.</Heading>
    <div className="wardrobe-grid">
      <div className="card wardrobe-preview" style={mode === 'Room' ? { background: item?.color } : undefined}>
        <Meta>{preview ? 'Preview' : 'Equipped'}</Meta><Organism seed={s.seed} generation={s.generation} stage={s.stage} outfit={mode === 'Wearable' && preview ? preview : s.outfit} still={s.settings.still} />
        <h2>{item?.name}</h2>
        <Button onClick={() => go('evolution')}>Evolution <ArrowUpRight size={15} /></Button>
      </div>
      <section>
        <div className="button-row selector">
          {(['Wearable', 'Room'] as const).map(option => <Button key={option} primary={mode === option} aria-pressed={mode === option} onClick={() => { setMode(option); setPreview(''); }}>{option === 'Wearable' ? 'Wearables' : 'Room light'}</Button>)}
        </div>
        <div className="tile-grid wardrobe-items">{items.filter(item => item.type === mode).map(item => {
          const owned = s.inventory.includes(item.id);
          return <article className="card tile" key={item.id}>
            <div className="swatch" style={{ backgroundColor: item.color }} />
            <Meta>{active === item.id ? 'Equipped' : owned ? 'Owned' : item.act > s.act ? 'Act ' + item.act : item.price + ' credits'}</Meta>
            <h2>{item.name}</h2><p>{item.about}</p>
            <div className="button-row"><Button aria-pressed={preview === item.id} onClick={() => setPreview(preview === item.id ? '' : item.id)}>Preview</Button>
              <Button primary disabled={active === item.id || item.act > s.act || (!owned && item.price > s.credits)} onClick={() => {
                if (owned) { void send({ type: 'equip', id: item.id }); setPreview(''); }
                else ask('Buy ' + item.name + '?', <><p>Pip will spend {item.price} credits to buy and equip this item.</p><Button primary onClick={() => void send({ type: 'buy', id: item.id }).then(next => { if (next) setPreview(''); })}>Confirm purchase</Button></>, true);
              }}>{owned ? 'Equip' : 'Buy'}</Button>
            </div>
          </article>;
        })}</div>
      </section>
    </div>
  </>;
}

function Puzzle({ game, send }: { game: typeof games[number]; send: GameUI['send'] }) {
  const [feedback, setFeedback] = useState('');
  const [stamps, setStamps] = useState(0);
  return <><p>{game.prompt}</p>
    {game.id === 'idle' && <p className="meta" aria-live="polite">{stamps} / 3 stamped</p>}
    <div className="stack">{game.options.map((option, answer) => <Button key={option} onClick={() => {
      if (game.id === 'idle' && answer === 0) { setStamps(n => Math.min(3, n + 1)); return; }
      if (answer !== game.answer || (game.id === 'idle' && stamps < 3)) {
        setFeedback(game.id === 'idle' ? 'Three stamps before you clock out.' : 'Take another look at the instructions. You can try again.');
        return;
      }
      void send({ type: 'game', id: game.id, answer, stamps });
    }} disabled={game.id === 'idle' && answer === 0 && stamps >= 3}>{option}</Button>)}</div>
    {feedback && <p role="status">{feedback}</p>}
  </>;
}

export function Games({ s, send, ask }: GameUI) {
  return <>
    <Heading over="Activities" title="A brief" italic="diversion.">Each game costs one activity point on completion. {3 - s.rewardCount} rewards left today.</Heading>
    <div className="tile-grid">{games.map(game => <article className="card tile" key={game.id}>
      <Meta>Untimed · +{game.reward} credits</Meta><h2>{game.name}</h2><p>{game.about}</p>
      <Button disabled={s.points < 1 || s.rewardCount >= 3 || s.gamesToday.includes(game.id)}
        onClick={() => ask(game.name, <Puzzle game={game} send={send} />, true)}>{s.gamesToday.includes(game.id) ? 'Played today' : 'Play'}</Button>
    </article>)}</div>
  </>;
}
