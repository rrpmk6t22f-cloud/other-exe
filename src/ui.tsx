import { useEffect, useRef, type ComponentProps, type ReactNode } from 'react';
import { ArrowUpRight, X } from 'lucide-react';
import { figma } from './Organism';

export function Button({ primary = false, className = '', ...props }: ComponentProps<'button'> & { primary?: boolean }) {
  return <button type="button" className={`button ${primary ? 'primary' : ''} ${className}`} {...props} />;
}

export function Meta({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={'meta ' + className}>{children}</span>;
}

export function External({ href, children }: { href: string; children: ReactNode }) {
  return <a className="text-link" href={href} target="_blank" rel="noopener noreferrer">{children}<ArrowUpRight size={15} aria-hidden="true" /></a>;
}

export function Atmosphere({ variant }: { variant: 'home' | 'mind' | 'outside' | 'evolution' }) {
  const art = {
    home: [['5-3', 3], ['5-379', 3]],
    mind: [['7-3', 2], ['7-394', 1]],
    outside: [['7-27', 2], ['7-413', 1]],
    evolution: [['7-51', 2], ['7-51', 2]],
  } as const;
  return <div aria-hidden="true" className={'atmosphere ' + variant}>
    {art[variant].map(([id, count], mode) => <div key={mode} className={mode ? 'wash-mobile' : 'wash-desktop'}>
      {Array.from({ length: count }, (_, i) => <img key={i} src={figma(id + '-imgEllipse' + (i || ''))} alt="" />)}
    </div>)}
  </div>;
}

export function Heading({ over, title, italic, children }: { over: string; title: string; italic?: string; children?: ReactNode }) {
  return <header className="page-heading">
    <Meta>{over}</Meta>
    <h1 tabIndex={-1}>{title}{italic && <> <em>{italic}</em></>}</h1>
    {children && <p>{children}</p>}
  </header>;
}

export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => { dialog?.close(); };
  }, []);
  return <dialog ref={ref} aria-labelledby="modal-title" onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => { if (event.target === ref.current) onClose(); }}>
    <div className="dialog-content">
      <button type="button" className="icon-button close" aria-label="Close dialog" onClick={onClose}><X size={19} /></button>
      <h2 id="modal-title">{title}</h2>
      {children}
    </div>
  </dialog>;
}
