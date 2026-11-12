import { ArrowRight, BookOpen, Download, Fingerprint, Lock } from 'lucide-react';
import { useState } from 'react';
import { acts, endings, stages } from './content';
import { canEvolve, endingOpen } from './engine';
import { figma, Organism } from './Organism';
import { readings } from './Outside';
import { Atmosphere, Button, External, Heading, Meta } from './ui';
import type { GameUI } from './types';

export function Archive({ s, send, go, ask }: GameUI) {
  const [tab, setTab] = useState<'Journal' | 'Reading shelf' | 'Endings'>('Journal');
  const ending = endings.find(ending => ending.id === s.ending);
  return <>
    <Heading over="Archive" title="A record of" italic="being here.">{acts[s.act - 1]}</Heading>
    <div className="button-row selector">
      {(['Journal', 'Reading shelf', 'Endings'] as const).map(name => <Button key={name} primary={tab === name} aria-pressed={tab === name} onClick={() => setTab(name)}>{name}</Button>)}
      <Button onClick={() => go('evolution')}>Past forms <ArrowRight size={16} /></Button>
    </div>
    {tab === 'Journal' && <div className="card journal">
      {s.journal.length === 0 ? <p>The first memory will appear here after hatching.</p> : s.journal.map((entry, i) => <article key={i}><Meta>Day {entry.day}</Meta><div><h2>{entry.title}</h2><p>{entry.text}</p></div></article>)}
    </div>}
    {tab === 'Reading shelf' && <div className="tile-grid">
      {readings.filter(reading => s.articles.includes(reading.id)).map(reading => <article className="card tile" key={reading.id}><Meta>{reading.publisher} · {reading.date}</Meta><h2>{reading.title}</h2><p>{reading.body}</p><External href={reading.href}>Open source</External></article>)}
      {s.articles.length === 0 && <div className="card tile"><BookOpen size={23} /><h2>An empty shelf.</h2><p>Readings saved in Outside will appear here.</p><Button onClick={() => go('outside')}>Visit Outside</Button></div>}
    </div>}
    {tab === 'Endings' && (ending ? <section className="card feature"><Meta>Postgame</Meta><h2>{ending.title}</h2><p>{ending.text}</p><Button onClick={() => go('home')}>Return to the room</Button></section> :
      s.act < 5 ? <section className="card feature"><Lock size={22} /><h2>Later in the story</h2><p>Endings open in Act 5. In the meantime, see where Pip’s choices take them.</p></section> :
      <div className="tile-grid">{endings.map(ending => <article className="card tile" key={ending.id}>
        <Meta>{endingOpen(s, ending.id) ? 'Available' : 'Path closed'}</Meta><h2>{ending.title}</h2><p>{ending.hint}</p>
        <Button disabled={!endingOpen(s, ending.id)} onClick={() => ask('Choose ' + ending.title.toLowerCase() + '?', <><p>This records Pip’s ending. You can continue playing afterward.</p><Button primary onClick={() => void send({ type: 'ending', id: ending.id })}>Read the ending</Button></>, true)}>Choose ending</Button>
      </article>)}</div>)}
  </>;
}

export function Evolution({ s, send, ask }: GameUI) {
  const ready = canEvolve(s);
  const [preview, setPreview] = useState(false);
  const shape = ready && preview ? s.stage + 1 : s.stage;
  return <>
    <Atmosphere variant="evolution" />
    <Heading over="Evolution" title="A different" italic="shape.">Pip · they/them</Heading>
    <div className="wardrobe-grid">
      <div className="card wardrobe-preview evolution-stage">
        <Meta>{ready && preview ? 'Preview' : 'Current form'}</Meta>
        <Organism seed={s.seed} stage={shape} outfit={s.outfit} still={s.settings.still} />
        <h2>{stages[shape]}</h2>
      </div>
      <div className="stack">
        <section className="card feature">
          <Fingerprint size={24} /><Meta>Signal {s.seed.toString(16).padStart(8, '0').toUpperCase()}</Meta>
          <h2>{ready ? 'A new form is ready.' : 'A form of their own.'}</h2>
          <p>{ready ? 'Pip has been thinking about what they might look like next. Their earlier forms stay in the Archive.' : 'New forms become available as Pip moves through the story.'}</p>
          {ready && <div className="button-row"><Button aria-pressed={preview} onClick={() => setPreview(!preview)}>{preview ? 'See current form' : 'Preview ' + stages[s.stage + 1]}</Button>
            {preview && <Button primary onClick={() => ask('Change form?', <><p>Transform into {stages[shape]} and keep earlier forms in the Archive.</p><Button primary onClick={() => void send({ type: 'evolve' }).then(next => { if (next) setPreview(false); })}>Confirm evolution</Button></>, true)}>Evolve</Button>}
          </div>}
        </section>
        <section className="card feature"><Meta>Past forms</Meta>
          <div className="forms">{s.forms.map(stage => <div key={stage}><Organism seed={s.seed} stage={stage} still /><span>{stages[stage]}</span></div>)}</div>
          <details className="study"><summary>Original signal study</summary><img src={figma('7-51-imgLivingSignalVectorSpecimen')} alt="Original Figma study of a particle organism" /><a className="text-link" href={figma('7-51-imgLivingSignalVectorSpecimen')} download="other-exe-signal-study.svg">Download study <Download size={15} /></a></details>
        </section>
      </div>
    </div>
  </>;
}
