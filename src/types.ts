import type { ReactNode } from 'react';
import type { Command, Save } from './engine';

type Unstamp<T> = T extends unknown ? Omit<T, 'key' | 'now'> : never;
export type Input = Unstamp<Command>;
export type Page = 'home' | 'mind' | 'outside' | 'world' | 'social' | 'career' | 'wardrobe' | 'archive' | 'settings' | 'evolution' | 'games';
export type GameUI = {
  s: Save;
  send: (input: Input) => Promise<Save | undefined>;
  go: (page: Page) => void;
  ask: (title: string, content: ReactNode, closeOnSave?: boolean) => void;
  notify: (message: string) => void;
};
