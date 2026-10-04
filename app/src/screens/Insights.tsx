// The three playful insight screens: bubbles, weekday bars, jars.
import { fmt } from '../calc';
import { Icon, Kicker } from '../components/ui';
import type { ScreenProps } from './types';

// Bubble centres in the design's 342×340 frame; rendered relative to the box width.
const SLOTS = [[100, 110], [250, 80], [255, 210], [150, 250], [52, 245], [292, 296]];
const FILLS = [
  ['var(--color-accent-500)', 'var(--color-bg)'], ['var(--color-accent-700)', 'var(--color-text)'],
  ['var(--color-accent-800)', 'var(--color-text)'], ['var(--color-accent-800)', 'var(--color-text)'],
  ['var(--color-accent-900)', 'var(--color-text)'], ['var(--color-accent-900)', 'var(--color-text)'],
];
const W = 342, H = 340;

export function WhereItGoes({ d, grow }: ScreenProps) {
  const max = d.catData[0].v;
  return (
    <div className="screen stack-6">
      <Kicker>Dato 1 de 3 · En qué se va</Kicker>
      <h2 className="title balance" tabIndex={-1} data-autofocus style={{ margin: 0 }}>{d.top.name} se lleva el {Math.round(d.top.v / d.catTotal * 100)}% de tu mes.</h2>
      {d.second && <p className="sub" style={{ margin: 0 }}>Le sigue {d.second.name.toLowerCase()} con {fmt(d.second.v)}. Burbuja más grande, mordida más grande.</p>}
      <ul className="bubbles" aria-label="Gastos por categoría">
        {d.catData.map((c, i) => {
          const size = grow ? 48 + 100 * Math.sqrt(c.v / max) : 0;
          const [x, y] = SLOTS[i];
          return (
            <li key={c.name} className="bubble" style={{
              left: `${(x - size / 2) / W * 100}%`, top: `${(y - size / 2) / H * 100}%`,
              width: `${size / W * 100}cqw`, height: `${size / W * 100}cqw`,
              background: FILLS[i][0], color: FILLS[i][1], transitionDelay: `${i * 0.08}s`,
            }}>
              <Icon name={c.icon} className="bubble-icon" />
              <span className="bubble-name">{c.name}</span>
              <span className="bubble-amt">{fmt(c.v)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function WhenItGoes({ d, grow }: ScreenProps) {
  const muted = 'color-mix(in srgb, var(--color-text) 55%, transparent)';
  return (
    <div className="screen stack-6">
      <Kicker>Dato 2 de 3 · Cuándo se va</Kicker>
      <h2 className="title balance" tabIndex={-1} data-autofocus style={{ margin: 0 }}>Los {d.dayFull} son tu día de darte gustos.</h2>
      <p className="sub" style={{ margin: 0 }}>Gastás {fmt(d.peak[1])} los {d.dayFull} vs {fmt(d.weekday)} un día de semana.</p>
      <ul className="bars" aria-label="Gasto por día de la semana">
        {d.week.map((w, i) => {
          const label = w.hot ? 'var(--color-accent-300)' : muted;
          return (
            <li key={w.d} className="bar-col" aria-label={`${w.d}: ${fmt(w.v)}`}>
              <span className="bar-amt" style={{ color: label }}>{w.amt}</span>
              <div className="bar" style={{
                height: grow ? Math.max(8, 220 * w.ratio) : 4,
                background: w.hot ? 'var(--color-accent-500)' : w.mid ? 'var(--color-accent-700)' : 'var(--color-accent-900)',
                borderColor: w.hot ? 'var(--color-accent-400)' : 'var(--color-accent-800)',
                transitionDelay: `${i * 0.06}s`,
              }} />
              <span className="bar-day" style={{ color: label }}>{w.d}</span>
            </li>
          );
        })}
      </ul>
      <div className="card elev-sm callout">
        <Icon name="ph-confetti" className="callout-icon" />
        <div className="small pretty">El finde gastás <b className="hi">{(d.weekend / d.weekday).toFixed(1).replace('.', ',')} veces más</b> que un día de semana. Ahí vive casi todo tu “comer afuera”.</div>
      </div>
    </div>
  );
}

export function CashVsVirtual({ d, grow }: ScreenProps) {
  const jars = [
    { name: 'Efectivo', icon: 'ph-money', amt: d.cashV, pct: d.cashPct, h: grow ? Math.max(d.cashPct, 8) : 0, fill: 'var(--color-accent-600)', top: 'var(--color-accent-400)', delay: 0 },
    { name: 'Virtual', icon: 'ph-credit-card', amt: d.virtV, pct: 100 - d.cashPct, h: grow ? 100 - d.cashPct : 0, fill: 'var(--color-accent-900)', top: 'var(--color-accent-700)', delay: 0.15 },
  ];
  return (
    <div className="screen stack-6">
      <Kicker>Dato 3 de 3 · Cómo se va</Kicker>
      <h2 className="title balance" tabIndex={-1} data-autofocus style={{ margin: 0 }}>El efectivo se esfuma calladito.</h2>
      <p className="sub" style={{ margin: 0 }}>Solo el {d.cashPct}% de lo que gastás es efectivo, pero es lo que menos recordás.</p>
      <div className="jars">
        {jars.map(j => (
          <div key={j.name} className="jar-col" role="img" aria-label={`${j.name}: ${j.pct}%, ${fmt(j.amt)}`}>
            <div className="jar-lid" />
            <div className="jar">
              <div className="jar-fill" style={{ height: `${j.h}%`, background: `linear-gradient(to top, ${j.fill}, ${j.top})`, transitionDelay: `${j.delay}s` }} />
              <div className="jar-pct">{j.pct}%</div>
            </div>
            <div className="jar-name"><Icon name={j.icon} className="accent-icon" />{j.name}</div>
            <div className="jar-amt">{fmt(j.amt)}</div>
          </div>
        ))}
      </div>
      <div className="card elev-sm" style={{ marginTop: 16, padding: '12px 14px', gap: 4 }}>
        <div className="card-kicker">Gastos hormiga</div>
        <div className="small pretty">Cafecitos y snacks suman <b className="hi">{fmt(d.coffee)}</b> por mes — casi una compra grande en el súper.</div>
      </div>
    </div>
  );
}
