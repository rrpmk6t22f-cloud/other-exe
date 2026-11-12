import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { Archive as ArchiveIcon, ArrowRight, Briefcase, CircleHelp, Coins, Compass, Ellipsis, Gamepad2, Globe2, House, MessageCircle, Settings2, Shirt, Sprout, Users, WifiOff } from 'lucide-react';
import { Archive, Evolution } from './Archive';
import { Conversation } from './Conversation';
import { Home } from './Home';
import { Outside } from './Outside';
import { Settings } from './Settings';
import { Career, Games, Social, Wardrobe, World } from './World';
import { reduce, type Command, type Save } from './engine';
import { boot, freshSave, issue, transact } from './storage';
import type { GameUI, Input, Page } from './types';
import { Button, Heading, Meta, Modal } from './ui';
import { clearWeather } from './weather';
import './tokens.css';
import './style.css';

const pages = [
  ['home', 'Home', House], ['mind', 'Mind', MessageCircle], ['outside', 'Outside', Globe2],
  ['world', 'World', Compass], ['social', 'Social', Users], ['career', 'Career', Briefcase],
  ['wardrobe', 'Wardrobe', Shirt], ['archive', 'Archive', ArchiveIcon], ['settings', 'Settings', Settings2],
  ['evolution', 'Evolution', Sprout], ['games', 'Mini-games', Gamepad2],
] as const;
const pageFromUrl = (): Page => {
  const target = location.hash.slice(1);
  return pages.find(([id]) => id === target)?.[0] ?? 'home';
};

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

function App() {
  const [save, setSave] = useState<Save>();
  const current = useRef<Save | undefined>(undefined);
  const volatile = useRef(false);
  const [storageWarning, warn] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [page, setPage] = useState(pageFromUrl);
  const [dialog, setDialog] = useState<{ title: string; content: ReactNode }>();
  const closeOnSave = useRef(false);
  const [notice, setNotice] = useState('');
  const [reaction, setReaction] = useState('');
  const [firstMessage, setFirstMessage] = useState('');
  const installPrompt = useRef<InstallPrompt | undefined>(undefined);
  const reactionTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const channel = useRef<BroadcastChannel | undefined>(undefined);

  function setState(next: Save) {
    current.current = next;
    setSave(next);
  }

  useEffect(() => {
    let alive = true;
    const load = () => {
      if (volatile.current) return;
      void boot().then(next => { if (alive) setState(next); }).catch(() => {
        if (!alive) return;
        volatile.current = true;
        warn(true);
        if (!current.current) setState(freshSave());
      });
    };
    load();
    const navigate = () => { setPage(pageFromUrl()); };
    const network = () => setOnline(navigator.onLine);
    const onFocus = () => { if (!document.hidden) load(); };
    const onInstall = (event: Event) => { event.preventDefault(); installPrompt.current = event as InstallPrompt; };
    window.addEventListener('hashchange', navigate);
    window.addEventListener('online', network);
    window.addEventListener('offline', network);
    window.addEventListener('beforeinstallprompt', onInstall);
    document.addEventListener('visibilitychange', onFocus);
    if ('BroadcastChannel' in window) {
      channel.current = new BroadcastChannel('other-exe:' + new URL('.', location.href).pathname);
      channel.current.onmessage = load;
    }
    return () => {
      alive = false;
      channel.current?.close();
      window.removeEventListener('hashchange', navigate);
      window.removeEventListener('online', network);
      window.removeEventListener('offline', network);
      window.removeEventListener('beforeinstallprompt', onInstall);
      document.removeEventListener('visibilitychange', onFocus);
      clearTimeout(reactionTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    document.documentElement.dataset.theme = save?.settings.theme ?? 'paper';
    document.documentElement.dataset.contrast = save?.settings.contrast ? 'high' : 'standard';
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', save?.settings.theme === 'night' ? '#111A17' : '#F4F0E7');
    if (!save?.settings.world || !save.settings.city) clearWeather();
  }, [save?.settings.theme, save?.settings.contrast, save?.settings.world, save?.settings.city]);

  const go = useCallback((target: Page) => {
    if (target !== 'mind') setFirstMessage('');
    setDialog(undefined);
    closeOnSave.current = false;
    if (target !== pageFromUrl()) {
      location.hash = target;
      window.scrollTo(0, 0);
      requestAnimationFrame(() => document.querySelector<HTMLElement>('main h1')?.focus({ preventScroll: true }));
    }
  }, []);

  function ask(title: string, content: ReactNode, close = false) {
    closeOnSave.current = close;
    setDialog({ title, content });
  }
  function close() { closeOnSave.current = false; setDialog(undefined); }

  const send: GameUI['send'] = async (input: Input) => {
    const before = current.current;
    if (!before) return;
    const command = issue(input) as Command;
    let next: Save;
    try {
      next = volatile.current ? reduce(before, command) : await transact(saved => reduce(saved ?? before, command));
    } catch {
      warn(true);
      setNotice('Couldn’t write the save. Export a copy in Settings.');
      return;
    }
    setState(next);
    if (!next.receipts.includes(command.key)) {
      if (input.type !== 'live-reply') setNotice('That action is unavailable right now.');
      return;
    }
    if (closeOnSave.current && !['chat', 'live-reply'].includes(input.type)) close();
    channel.current?.postMessage(next.rev);
    if (['care', 'choice', 'game', 'social', 'work', 'evolve', 'buy'].includes(input.type)) setNotice(next.line);
    return next;
  };

  const replace = async (next: Save) => {
    try {
      const installed = volatile.current ? next : await transact(() => next);
      setState(installed);
      channel.current?.postMessage(installed.rev);
      close();
      go('home');
      setNotice('Backup imported.');
    } catch {
      setNotice('The backup could not be saved on this device.');
    }
  };

  function reactTo(value: string) {
    clearTimeout(reactionTimer.current);
    setReaction(value);
    reactionTimer.current = setTimeout(() => setReaction(''), 2000);
  }

  function install() {
    if (matchMedia('(display-mode: standalone)').matches) { setNotice('OTHER.EXE is already running as an app.'); return; }
    if (installPrompt.current) {
      const prompt = installPrompt.current;
      installPrompt.current = undefined;
      void prompt.prompt().then(() => prompt.userChoice).then(choice => {
        if (choice.outcome === 'accepted') setNotice('OTHER.EXE installed.');
      }).catch(() => setNotice('Use the browser menu to install OTHER.EXE.'));
      return;
    }
    ask('Install OTHER.EXE', <><p>On iPhone or iPad, open the game in Safari and choose Share → Add to Home Screen.</p><p>In a supported desktop or Android browser, look for Install or Add to Home screen in the browser menu.</p></>);
  }

  if (!save) return <main className="loading" aria-live="polite">Opening the room…</main>;
  const ui = { s: save, send, go, ask, notify: setNotice };
  const beforeHatch = !save.hatched && !['home', 'settings', 'outside'].includes(page);
  const date = new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'short' }).format(new Date());
  const nav = ([id, label, Icon]: typeof pages[number]) => <a href={'#' + id} key={id} className="nav-link" aria-current={page === id ? 'page' : undefined}
    onClick={event => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); go(id); }}><Icon size={18} strokeWidth={1.65} /><span>{label}</span></a>;
  return <>
    <a href="#content" className="skip" onClick={event => { event.preventDefault(); document.querySelector<HTMLElement>('main')?.focus(); }}>Skip to content</a>
    <header className="topbar">
      <a href="#home" onClick={event => { event.preventDefault(); go('home'); }} className="wordmark">OTHER.EXE</a>
      <Meta className="tagline">A small life, still in progress</Meta>
      <div className="header-right">
        {!online && <Meta className="network"><WifiOff size={14} /> Offline</Meta>}
        {save.hatched && <Meta className="balance"><Coins size={15} /> {save.credits}<span> credits</span></Meta>}
        <Meta className="wall-date">{date}</Meta>
      </div>
    </header>
    {storageWarning && <div className="save-warning" role="status"><CircleHelp size={16} /> This browser can’t save progress reliably. Export a backup in Settings.</div>}
    <div className="app-shell">
      <nav className="rail" aria-label="Main navigation">
        {pages.slice(0, 9).map(nav)}
        <div className="rail-end"><Meta>Day {save.day}</Meta><div>{save.points}/8 activity points</div></div>
      </nav>
      <main id="content" tabIndex={-1} className={page === 'home' ? 'home-page' : 'inner-page'}>
        {beforeHatch ? <><Heading over="Home" title="A signal" italic="is waiting.">Hatch Pip to open this part of their world.</Heading><Button primary onClick={() => go('home')}>Return to the room <ArrowRight size={17} /></Button></> :
          page === 'home' ? <Home {...ui} reaction={reaction} reactTo={reactTo} /> :
          page === 'mind' ? <Conversation {...ui} firstMessage={firstMessage} /> :
          page === 'outside' ? <Outside {...ui} discuss={title => { setFirstMessage('What do you think about ' + title + '?'); go('mind'); }} /> :
          page === 'world' ? <World {...ui} /> :
          page === 'social' ? <Social {...ui} /> :
          page === 'career' ? <Career {...ui} /> :
          page === 'wardrobe' ? <Wardrobe {...ui} /> :
          page === 'archive' ? <Archive {...ui} /> :
          page === 'evolution' ? <Evolution {...ui} /> :
          page === 'games' ? <Games {...ui} /> : <Settings {...ui} replace={replace} install={install} />}
      </main>
    </div>
    <nav className="mobile-nav" aria-label="Main navigation">
      {[pages[0], pages[1], pages[2], pages[3]].map(nav)}
      <button type="button" className="nav-link" aria-haspopup="dialog" aria-current={['home', 'mind', 'outside', 'world'].includes(page) ? undefined : 'page'} onClick={() => ask('More', <div className="menu-grid">{pages.slice(4).map(nav)}</div>)}><Ellipsis size={18} /><span>More</span></button>
    </nav>
    {notice && <div className="toast" role="status">{notice}</div>}
    {dialog && <Modal key={dialog.title} title={dialog.title} onClose={close}>{dialog.content}</Modal>}
  </>;
}

createRoot(document.getElementById('root')!).render(<App />);
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => { void navigator.serviceWorker.register('./sw.js').catch(console.warn); });
}
