const families = [
  { name: 'Clover', palette: ['#f5f6d9', '#b9d384', '#547b53'], tint: '#adc674', width: 1.09, height: .95, lobes: 3, ripple: .19, eyes: 24 },
  { name: 'Ember', palette: ['#fff3d6', '#e5ab77', '#9f5d42'], tint: '#d69b68', width: .84, height: 1.18, lobes: 2, ripple: .13, eyes: 20 },
  { name: 'Petal', palette: ['#fff0e5', '#e5a6af', '#a2556e'], tint: '#dfa0ad', width: 1, height: 1.04, lobes: 5, ripple: .18, eyes: 25 },
  { name: 'Tide', palette: ['#e2f6f0', '#7ebec0', '#356d79'], tint: '#7fb4b9', width: 1.23, height: .76, lobes: 2, ripple: .14, eyes: 30 },
  { name: 'Spore', palette: ['#fbf4df', '#b6b5d5', '#605879'], tint: '#aba6c8', width: .91, height: 1.09, lobes: 4, ripple: .15, eyes: 21 },
  { name: 'Pollen', palette: ['#fff8cd', '#e5c46f', '#987b40'], tint: '#dbc071', width: 1.1, height: .91, lobes: 7, ripple: .12, eyes: 27 },
] as const;

const temperaments = [
  { name: 'Observant', touch: 'I could spend the whole afternoon watching your hand move.', hold: 'I think I heard the room settle.', conversation: 'I spent a long time watching the edge of the light. It’s doing something different today.', gain: 4 },
  { name: 'Playful', touch: 'Again? I can make the ripples come out crooked this time.', hold: 'I stayed still. Please put that in the record.', conversation: 'I’ve been thinking about how to make a game out of the room. I’m fairly sure the room will cooperate.', gain: 5 },
  { name: 'Quiet', touch: 'That’s nice. I’d like a moment to let it land.', hold: 'Could we stay here a little longer?', conversation: 'I’m enjoying having a little time before anyone asks me what I’m doing with it.', gain: 7 },
  { name: 'Inquisitive', touch: 'Interesting. Was that you moving me, or me following you?', hold: 'Is this what it feels like to wait together?', conversation: 'I’ve got a question about the room. Who decided where the light should stop?', gain: 5 },
] as const;

export function genome(seed: number) {
  const hash = Math.imul((seed >>> 0) ^ 0x9e3779b9, 0x85ebca6b) >>> 0;
  return {
    family: families[hash % families.length],
    temperament: temperaments[(hash >>> 10) % temperaments.length],
    rotation: ((hash >>> 19) / 8191 - .5) * .85,
    eyeScale: .83 + (hash >>> 25) / 380,
  };
}

export function randomSeed() {
  return crypto.getRandomValues(new Uint32Array(1))[0];
}
