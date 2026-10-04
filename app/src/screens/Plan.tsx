// Tips, "¿Me lo puedo dar?" and the final summary.
import { fmt, fmtEntry } from '../calc';
import { AmountDisplay, Chip, Icon, Keypad, Kicker } from '../components/ui';
import { ITEMS } from '../state';
import type { ScreenProps } from './types';

export function Tips({ s, d, set }: ScreenProps) {
  return (
    <div className="screen stack-10 pad-bottom">
      <div>
        <Kicker>Tu plan</Kicker>
        <h2 className="title" tabIndex={-1} data-autofocus>Dónde y cuándo optimizar</h2>
        <p className="sub" style={{ margin: 0 }}>Elegí de cuáles querés recordatorio.</p>
      </div>
      {d.recs.map(r => {
        const on = !!s.remind[r.id];
        return (
          <div key={r.id} className={`card rec${on ? ' on' : ''}`}>
            <div className="rec-head">
              <Icon name={r.icon} className="accent-icon" style={{ fontSize: 18 }} />
              <span className="card-kicker rec-when">{r.when}</span>
              <span className="tag tag-accent nowrap">{r.save}</span>
            </div>
            <div className="card-title" style={{ fontSize: 16 }}>{r.title}</div>
            <p className="card-body pretty">{r.body}</p>
            <button type="button" className={`btn ${on ? 'btn-primary' : 'btn-secondary'} rec-btn`} aria-pressed={on}
              onClick={() => set(x => ({ remind: { ...x.remind, [r.id]: !x.remind[r.id] } }))}>
              <Icon name={on ? 'ph-bell-ringing' : 'ph-bell'} />{on ? 'Recordatorio activo' : 'Recordame'}
            </button>
          </div>
        );
      })}
    </div>
  );
}

const TAG = { ok: 'tag-accent', no: 'tag-outline', warn: 'tag-outline' } as Record<string, string>;

export function Afford({ s, d, set, go, onKey }: ScreenProps) {
  const v = d.verdict;
  return (
    <div className="screen stack-10" style={{ paddingBottom: 4 }}>
      <div>
        <Kicker>Antes de comprar</Kicker>
        <h2 className="title" tabIndex={-1} data-autofocus style={{ marginBottom: 0 }}>¿Me lo puedo dar?</h2>
      </div>
      <div className="chip-scroll" role="group" aria-label="Qué querés comprar">
        {ITEMS.map(([name, icon, p]) => <Chip key={name} icon={icon} selected={s.item === name} onClick={() => set({ item: name, price: p })}>{name}</Chip>)}
      </div>
      <div className="price-row">
        <AmountDisplay value={fmtEntry(s.price)} label="Precio" size="md" />
        <div className="seg" role="radiogroup" aria-label="Cuotas">
          {[1, 3, 6, 12].map(n => (
            <label key={n} className="seg-opt seg-tight">
              <input type="radio" name="cuotas" checked={s.cuotas === n} onChange={() => set({ cuotas: n })} />{n === 1 ? 'Contado' : n + 'x'}
            </label>
          ))}
        </div>
      </div>
      <div className={`card verdict${v.k === 'ok' ? ' ok' : ''}`} aria-live="polite">
        <div className="rec-head">
          <Icon name={v.icon} className="accent-icon" style={{ fontSize: 20 }} />
          <span className="card-title" style={{ fontSize: 16, flex: 1, minWidth: 0 }}>{v.title}</span>
          <span className={`tag ${TAG[v.k] || 'tag-neutral'} nowrap`}>{v.label}</span>
        </div>
        <p className="card-body pretty">{v.body}</p>
        <div className="split-bar" aria-hidden="true">
          {d.bar.map(b => <div key={b.label} style={{ width: `${b.w.toFixed(1)}%`, background: b.bg }} />)}
        </div>
        <div className="legend">
          {d.bar.map(b => <span key={b.label}><span className="swatch" style={{ background: b.bg }} />{b.label}</span>)}
        </div>
        {v.k === 'need' && (
          <button type="button" className="btn btn-ghost" style={{ alignSelf: 'flex-start', minHeight: 44 }} onClick={() => go(3)}>
            <Icon name="ph-arrow-left" />Cargar ingresos
          </button>
        )}
      </div>
      <div style={{ marginTop: 'auto' }}><Keypad onKey={onKey} compact /></div>
    </div>
  );
}

export function Done({ d }: ScreenProps) {
  return (
    <div className="screen stack-12">
      <Kicker>Listo</Kicker>
      <div className="muted-60 small" style={{ marginTop: 8 }}>Tenés</div>
      <h2 className="total" tabIndex={-1} data-autofocus>{fmt(d.total)}</h2>
      <div className="split-bar" aria-hidden="true">
        <div style={{ width: `${d.cashShare}%`, background: 'var(--color-accent-500)' }} />
        <div style={{ flex: 1, background: 'var(--color-accent-800)' }} />
      </div>
      <div className="legend legend-lg">
        <span><span className="swatch" style={{ background: 'var(--color-accent-500)' }} />Efectivo {fmt(d.wallet)}</span>
        <span><span className="swatch" style={{ background: 'var(--color-accent-800)' }} />Cuentas {fmt(d.banksSum)}</span>
      </div>
      <div className="summary-grid">
        <div className="card elev-sm"><span className="card-meta">Podés gastar hoy</span><span className="summary-val hi">{fmt(d.safeDay)}</span></div>
        <div className="card elev-sm"><span className="card-meta">Fijos del mes</span><span className="summary-val">{fmt(d.billsTotal)}</span></div>
        <div className="card elev-sm"><span className="card-meta">Libre este mes</span><span className="summary-val">{d.income ? fmt(Math.max(0, d.free)) : '—'}</span></div>
        <div className="card elev-sm"><span className="card-meta">Recordatorios</span><span className="summary-val">{d.remindCount}</span></div>
      </div>
      <p className="sub pretty" style={{ marginTop: 8 }}>Anotá cada gasto con el botón + cuando pagues. Tus datos se actualizan todos los domingos a la noche.</p>
    </div>
  );
}
