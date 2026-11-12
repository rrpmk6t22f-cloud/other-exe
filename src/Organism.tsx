import { useEffect, useRef, type Ref, type RefObject } from 'react';
import { genome } from './genome';
import { items } from './content';

export const figma = (name: string) => import.meta.env.BASE_URL + 'figma/' + name + '.svg';

function generator(seed: number) {
  let state = seed | 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) | 0;
    return (state >>> 0) / 4294967296;
  };
}

const colors = ['#f7f4cc', '#e4ebb1', '#6e8655', '#809455', '#f4dca1', '#a6ad68', '#faf7df'];

export type Contact = { x: number; y: number; active: boolean; at: number };

export function Organism({ seed, stage, generation, contact, canvasRef, outfit = 'bare', mood = 'Curious', still = false, reaction = '', className = '' }: {
  seed: number; stage: number; generation?: 1; contact?: RefObject<Contact>; canvasRef?: Ref<HTMLCanvasElement>; outfit?: string; mood?: string; still?: boolean; reaction?: string; className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const rng = generator(seed);
    const dna = generation ? genome(seed) : undefined;
    const family = dna?.family;
    const palette = family?.palette ?? colors;
    const ambient = family?.tint ?? '#b8cf85';
    const accent = outfit === 'bare' ? ambient : items.find(item => item.id === outfit)?.color ?? ambient;
    const specks = Array.from({ length: 1720 }, (_, index) => {
      const angle = rng() * Math.PI * 2;
      const radius = Math.sqrt(rng());
      const edge = index > 1540 ? 1.08 + rng() * 0.27 : radius;
      return { angle, radius: edge, weight: 0.35 + rng() * 1.22, opacity: 0.27 + rng() * .69, color: palette[Math.floor(rng() * palette.length)], phase: rng() * 6.28 };
    });
    let frame = 0;
    let last = -Infinity;
    const started = performance.now();
    const draw = (time: number) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio, 2);
      const w = Math.round(rect.width * dpr);
      const h = Math.round(rect.height * dpr);
      if (!w || !h) return;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      const unit = Math.min(w, h) / 380;
      const t = still || motion.matches ? 0 : time / 1000;
      const sleeping = reaction === 'Rest' || reaction === 'Hold' || mood === 'Depleted';
      const grow = 1 + stage * .065;
      const breathe = 1 + Math.sin(t * .94) * .034;
      const pulse = reaction && t ? Math.sin(Math.min(1, (time - started) / 1600) * Math.PI) * .105 : 0;
      const point = contact?.current;
      const reach = t && point?.active ? 1 : 0;
      const leanX = ((point?.x ?? .5) - .5) * 44 * reach;
      const leanY = ((point?.y ?? .5) - .5) * 32 * reach;
      ctx.setTransform(unit, 0, 0, unit, w * .5 + leanX * unit, h * .46 + (leanY + Math.sin(t * .81) * 4) * unit);
      ctx.clearRect(-w / unit, -h / unit, w * 2 / unit, h * 2 / unit);

      const halo = ctx.createRadialGradient(0, -8, 0, 0, 0, 168);
      halo.addColorStop(0, stage ? accent + 'bb' : '#d8c58e88');
      halo.addColorStop(.43, stage ? ambient + '61' : '#e6d39b64');
      halo.addColorStop(.77, '#c8cc7430');
      halo.addColorStop(1, '#c8cc7400');
      ctx.fillStyle = halo;
      ctx.fillRect(-170, -170, 340, 340);

      ctx.lineWidth = .55;
      [96, 122, 145].forEach((radius, i) => {
        ctx.strokeStyle = ['#68734e47', '#68734e31', '#fbf6d87a'][i];
        ctx.setLineDash(i === 0 ? [] : [1, 6]);
        ctx.beginPath();
        ctx.ellipse(0, 0, radius, radius * .94, -.4, 0, 2 * Math.PI);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      if (point && t) {
        const age = (time - point.at) / 720;
        if (age >= 0 && age < 1) {
          ctx.beginPath();
          ctx.strokeStyle = '#41634d' + Math.round((1 - age) * 155).toString(16).padStart(2, '0');
          ctx.lineWidth = 1.4;
          ctx.arc((point.x - .5) * w / unit - leanX, (point.y - .46) * h / unit - leanY, 10 + age * 58, 0, 2 * Math.PI);
          ctx.stroke();
        }
      }
      for (const p of specks) {
        const a = p.angle + (dna?.rotation ?? 0);
        const distortion = 1 + (family?.ripple ?? (stage > 1 ? .09 : .052)) * Math.sin(a * (stage > 3 ? (family?.lobes ?? 3) + 2 : family?.lobes ?? 3) + .6)
          + .042 * Math.cos(a * 5 + t * .6);
        const radius = p.radius * grow * (breathe + pulse) * distortion;
        const x = Math.cos(a) * radius * (stage ? 94 * (family?.width ?? 1) : 62) + Math.sin(t * .9 + p.phase) * 1.5;
        const y = Math.sin(a) * radius * (stage ? 83 * (family?.height ?? 1) : 72) + Math.cos(t * .8 + p.phase) * 1.6;
        ctx.globalAlpha = p.opacity * (p.radius > 1 ? .55 : .84);
        ctx.fillStyle = outfit !== 'bare' && Math.sin(a) > .5 && p.radius > .65 ? accent : p.color;
        ctx.fillRect(x, y, p.weight * (p.radius > 1 ? .72 : 1.35), p.weight * .82);
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = ctx.fillStyle = '#25372a';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      if (stage) {
        const blink = sleeping || (t > 0 && t % 6.7 > 6.52);
        const look = leanX * .27 + (reaction === 'Play' ? 4 : 0);
        const spacing = family?.eyes ?? 25;
        for (const x of [-spacing + look, spacing + look]) {
          ctx.beginPath();
          if (blink) {
            ctx.moveTo(x - 5, 1);
            ctx.quadraticCurveTo(x, 4, x + 5, 1);
            ctx.stroke();
          } else {
            ctx.ellipse(x, -3, 3.6 * (dna?.eyeScale ?? 1), (mood === 'Anxious' ? 7 : 5.8) * (dna?.eyeScale ?? 1), .08, 0, 2 * Math.PI);
            ctx.fill();
          }
        }
        ctx.beginPath();
        if (mood === 'Anxious' || mood === 'Lonely') {
          ctx.moveTo(-10, 21); ctx.quadraticCurveTo(0, 14, 10, 21);
        } else {
          ctx.moveTo(-14, 19); ctx.quadraticCurveTo(0, sleeping ? 24 : 34, 14, 19);
        }
        ctx.stroke();
      }
    };

    const animate = (time: number) => {
      if (time - last >= 32 && !document.hidden) {
        draw(time);
        last = time;
      }
      frame = requestAnimationFrame(animate);
    };
    const update = () => {
      cancelAnimationFrame(frame);
      draw(performance.now());
      if (!still && !motion.matches) frame = requestAnimationFrame(animate);
    };
    const resize = new ResizeObserver(update);
    resize.observe(canvas);
    motion.addEventListener('change', update);
    update();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      motion.removeEventListener('change', update);
    };
  }, [seed, stage, generation, contact, outfit, mood, still, reaction]);
  return <canvas ref={element => { ref.current = element; if (typeof canvasRef === 'function') canvasRef(element); else if (canvasRef) canvasRef.current = element; }} className={className} role="img" aria-label={stage ? `Pip, a ${mood.toLowerCase()} living signal` : 'An unhatched signal'} />;
}
