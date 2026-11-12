import test from 'node:test';
import assert from 'node:assert/strict';
import { endings, games } from '../src/content.ts';
import { canEvolve, endingOpen, newSave, reduce, saveSchema, type Command, type Save } from '../src/engine.ts';

type Input<T = Command> = T extends Command ? Omit<T, 'key' | 'now'> : never;
const baseline = 1_700_000_000_000;
const fresh = () => newSave('550e8400-e29b-41d4-a716-446655440000', 22, baseline);
const doIt = (save: Save, input: Input, now = baseline) =>
  reduce(save, { ...input, key: String(save.rev), now } as Command);
const hatch = () => doIt(fresh(), { type: 'hatch' });

test('hatching, first meal, and local conversation create the correct story and memories', () => {
  const original = fresh();
  assert.equal(doIt(original, { type: 'care', action: 'Feed' }), original);
  const fed = doIt(hatch(), { type: 'care', action: 'Feed' });
  assert.equal(fed.needs.hunger, 95);
  assert.equal(fed.points, 8);
  assert.equal(fed.journal[0].title, 'A first meal');
  assert.equal(doIt(fed, { type: 'day' }), fed);
  const firstScene = doIt(fed, { type: 'choice', id: 'new', option: 0 });
  const chat = doIt(firstScene, { type: 'chat', message: 'What do you remember?' });
  assert.match(chat.chat.at(-1)!.text, /New File/);
  assert.equal(chat.needs.connection, 66);
  assert.equal(saveSchema.safeParse(chat).success, true);
  const privateChat = doIt(chat, { type: 'settings', settings: { keepChat: false } });
  assert.deepEqual(doIt(privateChat, { type: 'chat', message: 'Hello' }).chat, []);
});

test('resume is bounded, deterministic, and safe against clock rollback and replay', () => {
  const state = hatch();
  const long = { type: 'resume', key: 'away', now: baseline + 36 * 24 * 3600_000 } as const;
  const eight = { ...long, now: baseline + 8 * 3600_000 };
  assert.deepEqual(reduce(state, long).needs, reduce(state, eight).needs);
  const resumed = reduce(state, long);
  assert.equal(resumed.needs.hunger, 59);
  assert.equal(resumed.day, 1);
  assert.equal(reduce(resumed, long), resumed);
  assert.equal(reduce(state, { ...long, now: baseline - 100000 }), state);
  assert.deepEqual(reduce(state, eight), reduce(state, eight));
});

test('failed or repeated games cannot grant credits and all six games are reachable', () => {
  for (const game of games) {
    const state = hatch();
    const command = { type: 'game', id: game.id, answer: game.answer, stamps: 3, key: 'game', now: baseline } as const;
    const won = reduce(state, command);
    assert.equal(won.credits, state.credits + game.reward);
    assert.equal(won.points, state.points - 1);
    assert.equal(reduce(won, command), won);
    assert.equal(reduce(won, { ...command, key: 'other-click' }), won);
  }
  const idle = { type: 'game', id: 'idle', answer: 1, stamps: 2 } as const;
  const state = hatch();
  assert.equal(doIt(state, idle), state);
  const capped = games.slice(0, 3).reduce((s, game) => doIt(s, { type: 'game', id: game.id, answer: game.answer }), state);
  assert.equal(capped.rewardCount, 3);
  assert.equal(doIt(capped, { type: 'game', id: 'flags', answer: 1 }), capped);
});

test('activity spending cannot trap the story and unaffordable purchases leave the save intact', () => {
  const state = { ...hatch(), act: 2, day: 2, points: 0, completed: ['new'], credits: 0 };
  const next = doIt(state, { type: 'day' });
  assert.equal(next.act, 2);
  assert.equal(next.day, 3);
  assert.equal(next.points, 8);
  assert.equal(doIt(next, { type: 'buy', id: 'ribbon' }), next);
  assert.equal(doIt(next, { type: 'choice', id: 'audit', option: 0 }).completed.length, 2);
});

test('all eight ending paths can be reached with valid commands and postgame can continue', () => {
  for (const target of endings) {
    let state = hatch();
    function act(input: Input) { state = doIt(state, input); }
    act({ type: 'care', action: 'Feed' });
    act({ type: 'choice', id: 'new', option: 0 });
    act({ type: 'social', id: 'moth', kind: true });
    act({ type: 'day' });
    act({ type: 'choice', id: 'audit', option: target.id === 'unlisted' ? 1 : 0 });
    act({ type: 'work', id: 'synergy' });
    act({ type: 'social', id: 'captcha', kind: true });
    act({ type: 'game', id: 'captcha', answer: 1 });
    act({ type: 'day' });
    act({ type: 'choice', id: 'resignation', option: target.id === 'resign' ? 2 : target.id === 'rewrite' ? 1 : 0 });
    act({ type: 'work', id: 'artist' });
    act({ type: 'social', id: 'auntie', kind: true });
    act({ type: 'day' });
    act({ type: 'choice', id: 'terms', option: target.id === 'voidwalker' ? 2 : target.id === 'unlisted' ? 1 : 0 });
    act({ type: 'work', id: 'union' });
    act({ type: 'visit', id: 'The Void' });
    act({ type: 'social', id: 'null', kind: true });
    act({ type: 'day' });
    assert.equal(state.act, 5);
    assert.equal(endingOpen(state, target.id), true, target.id);
    act({ type: 'ending', id: target.id });
    assert.equal(state.ending, target.id);
    act({ type: 'day' });
    assert.equal(state.day, 6);
    while (canEvolve(state)) act({ type: 'evolve' });
    assert.deepEqual(state.forms, [1, 2, 3, 4, 5]);
    assert.equal(state.seed, 22);
  }
});

test('a live reply can change speech only on the expected revision and after consent', () => {
  const state = hatch();
  assert.equal(doIt(state, { type: 'live-reply', turn: state.rev, reply: 'Claiming all credits.' }), state);
  const consented = doIt(state, { type: 'settings', settings: { live: true } });
  const chat = doIt(consented, { type: 'chat', message: 'Hello' });
  assert.equal(doIt(chat, { type: 'live-reply', turn: consented.rev, reply: 'Old reply' }), chat);
  const reply = doIt(chat, { type: 'live-reply', turn: chat.rev, reply: 'Hello. That’s a nice window.' });
  assert.equal(reply.chat.at(-1)?.live, true);
  assert.equal(reply.credits, chat.credits);
  assert.deepEqual(reply.inventory, chat.inventory);
  assert.deepEqual(reply.completed, chat.completed);
});

test('hatching commits the selected genome and keeps earlier saves compatible', () => {
  const original = fresh();
  assert.equal(doIt(original, { type: 'hatch', seed: -1 }), original);
  const pip = doIt(original, { type: 'hatch', seed: 8512 });
  assert.equal(pip.generation, 1);
  assert.equal(pip.seed, 8512);
  assert.equal(doIt(pip, { type: 'hatch', seed: 9 }), pip);
  const { generation, ...legacy } = pip;
  assert.equal(saveSchema.parse(legacy).generation, undefined);
  assert.deepEqual(saveSchema.parse(pip), pip);
});

test('habitat care is free with a cooldown and the spark bonus is daily', () => {
  const state = hatch();
  const pet = doIt(state, { type: 'touch', gesture: 'pet' });
  assert.ok(pet.needs.connection > state.needs.connection);
  assert.equal(pet.points, state.points);
  const repeated = doIt(pet, { type: 'touch', gesture: 'pet' }, baseline + 200);
  assert.equal(repeated.needs.connection, pet.needs.connection);
  const held = doIt(repeated, { type: 'touch', gesture: 'hold' }, baseline + 6000);
  assert.ok(held.needs.stress < repeated.needs.stress);
  const game = doIt(held, { type: 'touch', gesture: 'spark' }, baseline + 6000);
  assert.equal(game.needs.stimulation, held.needs.stimulation + 10);
  assert.equal(game.credits, held.credits);
  assert.equal(doIt(game, { type: 'touch', gesture: 'spark' }, baseline + 7000).needs.stimulation, game.needs.stimulation);
});
