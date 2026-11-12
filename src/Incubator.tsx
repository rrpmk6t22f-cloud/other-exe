import { useState } from 'react';
import { ArrowRight, Shuffle } from 'lucide-react';
import { genome, randomSeed } from './genome';
import { Organism } from './Organism';
import { Button, Meta } from './ui';

export function Incubator({ initialSeed, still, hatch }: { initialSeed: number; still: boolean; hatch: (seed: number) => Promise<void> }) {
  const [seed, setSeed] = useState(initialSeed);
  const [busy, setBusy] = useState(false);
  const { family, temperament } = genome(seed);
  return <>
    <div className="incubator-field" style={{ backgroundColor: family.tint + '55' }}>
      <Organism seed={seed} stage={1} generation={1} still={still} />
      <div className="incubator-label" aria-live="polite"><Meta>{temperament.name}</Meta><strong>{family.name} signal</strong></div>
    </div>
    <p>Each signal has its own shape, colors, and temperament. Hatch this one or see who else is stirring.</p>
    <div className="button-row">
      <Button disabled={busy} onClick={() => setSeed(randomSeed())}><Shuffle size={16} /> Another signal</Button>
      <Button primary disabled={busy} onClick={async () => { setBusy(true); try { await hatch(seed); } finally { setBusy(false); } }}>Hatch Pip <ArrowRight size={16} /></Button>
    </div>
  </>;
}
