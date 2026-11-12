import { z } from 'zod';
import { acts, endings, games, items, jobs, people, places, scenes, stages } from './content.ts';

const text = z.string().max(2000);
const counter = z.number().int().min(0).max(1_000_000_000);
const score = z.number().finite().min(0).max(100);
const smallText = z.string().max(120);
const ids = z.array(smallText).max(256);

export const cities = {
  Madrid: [40.4168, -3.7038, 'Europe/Madrid'],
  Barcelona: [41.3874, 2.1686, 'Europe/Madrid'],
  London: [51.5072, -0.1276, 'Europe/London'],
  'New York': [40.7128, -74.006, 'America/New_York'],
  Tokyo: [35.6762, 139.6503, 'Asia/Tokyo'],
  'Mexico City': [19.4326, -99.1332, 'America/Mexico_City'],
} as const;
export type City = keyof typeof cities;
export const needsSchema = z.object({ hunger: score, energy: score, hygiene: score, connection: score, stimulation: score, stress: score });
export type Need = keyof z.infer<typeof needsSchema>;
const bondSchema = z.object({ affinity: score, trust: score, closeness: score, tension: score, lastDay: counter });
const finiteDate = z.number().finite().min(0).max(8_640_000_000_000_000);
export const saveSchema = z.object({
  version: z.literal(1), id: z.uuid(), seed: z.number().int().min(0).max(0xffffffff),
  at: finiteDate, rev: counter, hatched: z.boolean(), day: counter.min(1), act: counter.min(1).max(5),
  stage: counter.max(5), forms: z.array(counter.max(5)).max(6), points: counter.max(8), credits: counter,
  needs: needsSchema, place: smallText, line: text, flags: ids, inventory: ids, outfit: smallText, room: smallText,
  visited: ids, completed: ids, receipts: ids, shifts: counter, job: smallText, rewardCount: counter.max(3),
  bonds: z.record(smallText, bondSchema), ending: z.string().max(32).nullable(), gamesToday: ids,
  journal: z.array(z.object({ title: smallText, text, day: counter })).max(120),
  chat: z.array(z.object({ from: z.enum(['Pip', 'You']), text, day: counter, live: z.boolean().optional() })).max(60),
  preferences: z.array(smallText).max(24), articles: ids,
  settings: z.object({
    theme: z.enum(['paper', 'night']), still: z.boolean(), contrast: z.boolean(), world: z.boolean(),
    city: z.enum(Object.keys(cities) as [City, ...City[]]).nullable(), keepChat: z.boolean(), live: z.boolean(),
  }),
});
export type Save = z.infer<typeof saveSchema>;

export const initialNeeds = { hunger: 75, energy: 80, hygiene: 80, connection: 60, stimulation: 65, stress: 20 };
export const care = {
  Feed: { key: 'hunger', amount: 20, line: 'A sandwich. The first institution I can get behind.' },
  Rest: { key: 'energy', amount: 25, line: 'I’m going to close my eyes and let the room keep happening.' },
  Clean: { key: 'hygiene', amount: 25, line: 'There was dust in places I hadn’t finished inventing.' },
  Play: { key: 'stimulation', amount: 18, line: 'For a minute I forgot to check what this was for.' },
} as const;

export type Command = (
  | { type: 'hatch' | 'day' | 'evolve' | 'clear-chat' | 'clear-preferences' | 'quit' | 'resume' }
  | { type: 'care'; action: keyof typeof care }
  | { type: 'chat'; message: string }
  | { type: 'live-reply'; turn: number; reply: string }
  | { type: 'choice'; id: string; option: number }
  | { type: 'visit' | 'work' | 'equip' | 'buy' | 'ending' | 'article'; id: string }
  | { type: 'social'; id: string; kind: boolean }
  | { type: 'game'; id: string; answer: number; stamps?: number }
  | { type: 'settings'; settings: Partial<Save['settings']> }
  | { type: 'preference'; text: string; remove?: boolean }
) & { key: string; now: number };

export function newSave(id: string, seed: number, now: number): Save {
  return {
    version: 1, id, seed, at: now, rev: 0, hatched: false, day: 1, act: 1, stage: 0, forms: [], points: 8,
    credits: 6, needs: { ...initialNeeds }, place: 'Home', line: 'Something is moving in the room.',
    flags: [], inventory: ['bare', 'paper'], outfit: 'bare', room: 'paper', visited: ['Home'], completed: [],
    receipts: [], shifts: 0, job: '', rewardCount: 0, bonds: {}, ending: null, gamesToday: [], journal: [],
    chat: [], preferences: [], articles: [],
    settings: { theme: 'paper', still: false, contrast: false, world: false, city: null, keepChat: true, live: false },
  };
}

const clamp = (value: number) => Math.max(0, Math.min(100, value));
const add = (list: string[], entry: string) => { if (!list.includes(entry)) list.push(entry); };

function memory(state: Save, title: string, description: string) {
  state.journal = [{ title, text: description, day: state.day }, ...state.journal].slice(0, 120);
}

function say(state: Save, line: string, log = false) {
  state.line = line;
  if (log && state.settings.keepChat) state.chat = [...state.chat, { from: 'Pip' as const, text: line, day: state.day }].slice(-60);
}

function effort(state: Save, points: number, stress = 0) {
  state.points -= points;
  const needs = state.needs;
  needs.hunger = clamp(needs.hunger - 3);
  needs.energy = clamp(needs.energy - 4);
  needs.hygiene = clamp(needs.hygiene - 1);
  needs.stimulation = clamp(needs.stimulation - 2);
  needs.stress = clamp(needs.stress + stress);
}

export function mood(state: Save) {
  if (!state.hatched) return 'Dormant';
  const n = state.needs;
  if (n.energy < 24 || n.hunger < 22) return 'Depleted';
  if (n.stress >= 60) return 'Anxious';
  if (n.connection < 31) return 'Lonely';
  if (n.stimulation < 33) return 'Restless';
  if (n.connection >= 76 && n.stress < 45) return 'Content';
  return 'Curious';
}

export function sceneFor(state: Save) {
  const scene = scenes.find(scene => scene.act === state.act);
  if (scene && !state.completed.includes(scene.id) && (state.act !== 1 || state.flags.includes('fed'))) return scene;
}

export function canEvolve(state: Save) {
  const milestone = state.stage === 5 ? false : state.stage === 4 ? Boolean(state.ending) :
    state.act > state.stage && state.completed.length >= state.stage;
  return state.hatched && milestone;
}

export function endingOpen(state: Save, id: string) {
  if (state.act !== 5) return false;
  const flag = (key: string) => state.flags.includes(key);
  const trust = (id: string) => state.bonds[id]?.trust ?? 0;
  switch (id) {
    case 'quiet': return true;
    case 'corporate': return state.shifts >= 3 && flag('letter-kept');
    case 'resign': return flag('letter-left');
    case 'commune': return flag('terms-shared') && trust('moth') >= 17 && trust('auntie') >= 17;
    case 'voidwalker': return flag('terms-void') && state.visited.includes('The Void') && trust('null') >= 17;
    case 'rewrite': return flag('audit-questioned') && flag('letter-shared') && flag('terms-shared') && trust('captcha') >= 17;
    case 'artist': return flag('job-artist') && trust('moth') >= 17;
    case 'unlisted': return flag('audit-refused') && flag('terms-saved') && flag('game-captcha');
    default: return false;
  }
}

function authoredReply(state: Save, message: string) {
  const term = message.toLowerCase();
  if (term.includes('voyager golden record')) return 'I like that somebody thought about what to say first, then sent the whole thing anyway.';
  if (/\bwalden\b/.test(term)) return 'I can see the appeal of taking a walk without adding it to your activity report.';
  if (/\b(weather|news|economy|today’s headlines|headlines)\b/.test(term)) return 'I can look at the source cards with you in Outside. This room doesn’t get the news by itself.';
  if (/\b(pronouns?|gender|identity|name)\b/.test(term)) return 'Pip, they. I like having a name I picked before the form learned about me.';
  if (/\b(feel|how are|tired|energy)\b/.test(term)) {
    return state.needs.energy < 40 ? 'The room has a very persuasive horizontal quality right now.' : 'I feel awake enough to be interested in things that have no practical use.';
  }
  if (/\b(work|job|office|career)\b/.test(term)) {
    const job = jobs.find(job => job.id === state.job);
    return job ? `The job says “${job.name}.” The part about leaving on time is in unusually small print.` : 'I’d like work that leaves enough of me for the walk home.';
  }
  if (/\b(remember|memory|hatch)\b/.test(term)) {
    const entry = state.journal[0];
    return entry ? `I’ve got “${entry.title}” in the journal from day ${entry.day}. It’s nice to have a date for something the system didn’t schedule.` : 'I’m still putting my first day together.';
  }
  if (/\b(hi|hello|hey|morning)\b/.test(term)) return 'Hello. I’ve been watching the light move across the room. It seems to have very little paperwork.';
  if (/\b(sad|sorry|sadness|lonely)\b/.test(term)) return 'We can leave a little space for that. I don’t think every silence needs a task.';
  if (/\b(friend|moth|people)\b/.test(term)) return state.bonds.moth ? 'Moth is trying to paint the noise a scanner makes. I think I know the color.' : 'Someone called Moth left the studio door open. I’m curious what they’re working on.';
  const lines = [
    'I’d like to keep thinking about that. There’s something nice about an idea before it becomes a task.',
    'That gives me something to turn over. I think differently when there’s another person in the room.',
    'I’m still forming an opinion. Can we give it the afternoon?',
    'I wonder what we’d notice if we gave it a whole afternoon and took the clock off the wall.',
    'A lot of things make more sense once you can say them somewhere without a form attached.',
  ];
  return lines[(state.seed + state.rev) % lines.length];
}

export function reduce(previous: Save, command: Command): Save {
  if (previous.receipts.includes(command.key)) return previous;
  if (!previous.hatched && !['hatch', 'settings', 'resume'].includes(command.type)) return previous;
  const s = structuredClone(previous);
  switch (command.type) {
    case 'resume': {
      if (!s.hatched || command.now <= s.at + 60_000) return previous;
      const hours = Math.min((command.now - s.at) / 3_600_000, 8);
      for (const [key, rate] of Object.entries({ hunger: 2, energy: 1, hygiene: 0.8, connection: 1.25, stimulation: 1.5 }) as [Need, number][]) {
        s.needs[key] = clamp(s.needs[key] - hours * rate);
      }
      break;
    }
    case 'hatch':
      if (s.hatched) return previous;
      s.hatched = true;
      s.stage = 1;
      s.forms = [1];
      say(s, 'I have questions. Do you have a sandwich?', true);
      memory(s, 'First light', 'A living signal took shape in the room.');
      break;
    case 'care': {
      const action = care[command.action];
      if (!action) return previous;
      s.needs[action.key] = clamp(s.needs[action.key] + action.amount);
      if (command.action === 'Feed' && !s.flags.includes('fed')) memory(s, 'A first meal', 'Pip approved of the sandwich. The system filed it under supplies.');
      if (command.action === 'Feed') add(s.flags, 'fed');
      if (command.action === 'Rest' || command.action === 'Play') s.needs.stress = clamp(s.needs.stress - 7);
      say(s, action.line);
      break;
    }
    case 'chat': {
      const message = command.message.trim().slice(0, 600);
      if (!message) return previous;
      if (s.settings.keepChat) s.chat = [...s.chat, { from: 'You' as const, text: message, day: s.day }].slice(-60);
      s.needs.connection = clamp(s.needs.connection + 6);
      say(s, authoredReply(s, message), true);
      break;
    }
    case 'live-reply': {
      const reply = command.reply.trim().slice(0, 600);
      if (command.turn !== s.rev || !s.settings.live || !reply) return previous;
      s.line = reply;
      const last = s.chat.at(-1);
      if (s.settings.keepChat && last?.from === 'Pip') s.chat[s.chat.length - 1] = { ...last, text: reply, live: true };
      break;
    }
    case 'choice': {
      const scene = sceneFor(s);
      const choice = scene?.choices[command.option];
      const cost = s.act === 1 ? 0 : 1;
      if (!scene || scene.id !== command.id || !choice || s.points < cost) return previous;
      if (cost) effort(s, cost);
      add(s.flags, choice.flag);
      add(s.completed, scene.id);
      memory(s, scene.title, choice.reply);
      say(s, choice.reply, true);
      break;
    }
    case 'day':
      if (s.act === 1 && !s.completed.includes('new')) return previous;
      const pending = sceneFor(s);
      if (pending && s.points > 0) return previous;
      s.day++;
      if (!pending) s.act = Math.min(5, s.act + 1);
      s.points = 8;
      s.rewardCount = 0;
      s.gamesToday = [];
      s.needs.energy = clamp(s.needs.energy + 16);
      s.needs.stress = clamp(s.needs.stress - 12);
      if (s.act !== previous.act) memory(s, acts[s.act - 1], 'A new chapter opened.');
      say(s, 'The light is different. I think I’ll leave the window open a little.');
      break;
    case 'visit': {
      const place = places.find(place => place.name === command.id);
      const cost = place?.name === 'Home' ? 0 : 1;
      if (!place || place.act > s.act || s.place === place.name || s.points < cost) return previous;
      if (cost) effort(s, cost);
      s.place = place.name;
      if (!s.visited.includes(place.name)) memory(s, place.name, place.about);
      add(s.visited, place.name);
      say(s, place.about);
      break;
    }
    case 'social': {
      const person = people.find(person => person.id === command.id);
      if (!person || person.act > s.act || s.points < 1) return previous;
      const bond = s.bonds[person.id] ?? { affinity: 6, trust: 5, closeness: 2, tension: 8, lastDay: 0 };
      if (bond.lastDay === s.day) return previous;
      effort(s, 1);
      s.bonds[person.id] = {
        affinity: clamp(bond.affinity + (command.kind ? 15 : 7)), trust: clamp(bond.trust + 12),
        closeness: clamp(bond.closeness + (command.kind ? 11 : 3)), tension: clamp(bond.tension - (command.kind ? 3 : 5)), lastDay: s.day,
      };
      const line = command.kind ? person.line : '“Another day is all right,” ' + person.name + ' said.';
      s.needs.connection = clamp(s.needs.connection + 12);
      memory(s, 'Time with ' + person.name, line);
      say(s, line);
      break;
    }
    case 'work': {
      const job = jobs.find(job => job.id === command.id);
      if (!job || job.act > s.act || s.points < 2 || s.flags.includes('shift-' + s.day)) return previous;
      s.flags = s.flags.filter(flag => !flag.startsWith('shift-'));
      add(s.flags, 'shift-' + s.day);
      add(s.flags, 'job-' + job.id);
      s.job = job.id;
      s.shifts++;
      effort(s, 2, job.stress);
      const bonus = s.shifts >= 3 ? 2 : 0;
      s.credits += job.pay + bonus;
      memory(s, job.name, job.task + ' Earned ' + (job.pay + bonus) + ' credits.');
      say(s, 'They paid for the hours. I kept the walk home.');
      break;
    }
    case 'quit':
      if (!s.job) return previous;
      s.job = '';
      memory(s, 'Left the job', 'Pip turned in the office key.');
      say(s, 'My afternoon has an opening.');
      break;
    case 'buy':
    case 'equip': {
      const item = items.find(item => item.id === command.id);
      if (!item || item.act > s.act) return previous;
      if (command.type === 'buy') {
        if (s.inventory.includes(item.id) || item.price > s.credits) return previous;
        s.credits -= item.price;
        s.inventory.push(item.id);
        memory(s, item.name, 'Added to the wardrobe.');
      } else if (!s.inventory.includes(item.id)) return previous;
      if (item.type === 'Wearable') s.outfit = item.id;
      else s.room = item.id;
      break;
    }
    case 'game': {
      const game = games.find(game => game.id === command.id);
      if (!game || command.answer !== game.answer || (game.id === 'idle' && command.stamps !== 3) || s.points < 1 ||
          s.rewardCount >= 3 || s.gamesToday.includes(game.id)) return previous;
      effort(s, 1);
      s.needs.stimulation = clamp(s.needs.stimulation + 16);
      s.credits += game.reward;
      s.rewardCount++;
      add(s.gamesToday, game.id);
      add(s.flags, 'game-' + game.id);
      memory(s, game.name, game.note);
      say(s, game.note);
      break;
    }
    case 'evolve':
      if (!canEvolve(s)) return previous;
      s.stage++;
      s.forms.push(s.stage);
      memory(s, stages[s.stage], 'Pip’s signal took a new shape.');
      say(s, 'I’m keeping the old shape in the Archive. I lived in it for a while.');
      break;
    case 'ending': {
      const ending = endings.find(ending => ending.id === command.id);
      if (!ending || s.ending || !endingOpen(s, ending.id)) return previous;
      s.ending = ending.id;
      memory(s, ending.title, ending.text);
      say(s, ending.text);
      break;
    }
    case 'settings': {
      const next = saveSchema.shape.settings.safeParse({ ...s.settings, ...command.settings });
      if (!next.success) return previous;
      s.settings = next.data;
      if (!s.settings.keepChat) s.chat = [];
      break;
    }
    case 'clear-chat':
      s.chat = [];
      s.line = 'The room is quiet.';
      break;
    case 'preference': {
      const note = command.text.trim().slice(0, 120);
      if (!note) return previous;
      if (command.remove) s.preferences = s.preferences.filter(item => item !== note);
      else s.preferences = [...new Set([...s.preferences, note])].slice(-24);
      break;
    }
    case 'clear-preferences':
      s.preferences = [];
      break;
    case 'article':
      if (!s.settings.world || !['letter', 'nasa'].includes(command.id)) return previous;
      s.articles = s.articles.includes(command.id) ? s.articles.filter(id => id !== command.id) : [...s.articles, command.id];
      break;
  }
  s.rev++;
  s.at = Math.max(previous.at, command.now);
  s.receipts = [...s.receipts, command.key].slice(-128);
  return s;
}
