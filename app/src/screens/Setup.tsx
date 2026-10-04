// Welcome + the three keypad screens: cash, accounts, income.
import { fmt, fmtEntry, num } from '../calc';
import { AmountDisplay, Icon, Keypad, Kicker, Stepper } from '../components/ui';
import { BANKS } from '../state';
import type { ScreenProps } from './types';

export function Welcome() {
  return (
    <div className="screen">
      <div className="hero" aria-hidden="true">
        <div className="hero-glow" />
        <div className="hero-ring" />
        <div className="hero-card" style={{ left: 52, top: 70, width: 128, transform: 'rotate(-7deg)' }}>
          <Icon name="ph-wallet" className="hero-icon" /><div className="hero-label" style={{ marginTop: 6 }}>Billetera</div><div className="hero-amt">$ 42.000</div>
        </div>
        <div className="hero-card" style={{ right: 42, top: 118, width: 140, transform: 'rotate(5deg)' }}>
          <Icon name="ph-bank" className="hero-icon" /><div className="hero-label" style={{ marginTop: 6 }}>Banco</div><div className="hero-amt">$ 860.500</div>
        </div>
        <div className="hero-card hero-card-row" style={{ left: 92, top: 208, width: 160, transform: 'rotate(-2deg)' }}>
          <Icon name="ph-coffee" className="hero-icon" /><div><div className="hero-label">Recién</div><div className="hero-amt" style={{ fontSize: 15 }}>−$ 3.200</div></div>
        </div>
      </div>
      <h1 className="welcome-title" tabIndex={-1} data-autofocus>Toda tu plata, en una sola pantalla.</h1>
      <p className="lead">Cargá lo que tenés en la billetera y en el banco. Nosotros seguimos tus gastos y te decimos dónde — y cuándo — ahorrar.</p>
    </div>
  );
}

function KeypadArea({ value, label, onKey }: { value: string; label: string; onKey: (k: string) => void }) {
  return (
    <div className="keypad-area">
      <div className="amount-wrap"><AmountDisplay value={fmtEntry(value)} label={label} /></div>
      <Keypad onKey={onKey} />
    </div>
  );
}

export function Cash({ s, onKey }: ScreenProps) {
  return (
    <div className="screen">
      <div>
        <Kicker>Paso 1 · Efectivo</Kicker>
        <h2 className="title" tabIndex={-1} data-autofocus>¿Cuánto efectivo tenés en la billetera?</h2>
        <p className="sub">Más o menos está bien. Lo podés corregir cuando quieras.</p>
      </div>
      <KeypadArea value={s.wallet} label="Efectivo" onKey={onKey} />
    </div>
  );
}

export function Accounts({ s, set, onKey }: ScreenProps) {
  const active = s.banks[s.activeBank];
  return (
    <div className="screen">
      <div className="stack-10">
        <div>
          <Kicker>Paso 2 · Plata virtual</Kicker>
          <h2 className="title" tabIndex={-1} data-autofocus style={{ marginBottom: 0 }}>¿Y en tus cuentas?</h2>
        </div>
        <div className="wrap-6">
          {s.banks.map((b, i) => (
            <button key={b.name} type="button" className={`bank${i === s.activeBank ? ' active' : ''}`} aria-pressed={i === s.activeBank} onClick={() => set({ activeBank: i })}>
              <Icon name={b.icon} className="bank-icon" />
              <span className="bank-text"><span className="bank-name">{b.name}</span><span className="bank-amt">{fmt(num(b.amount))}</span></span>
            </button>
          ))}
          {s.banks.length < BANKS.length && (
            <button type="button" className="btn btn-ghost add-bank" onClick={() => set(x => {
              const [name, icon] = BANKS[x.banks.length];
              return { banks: [...x.banks, { name, icon, amount: '' }], activeBank: x.banks.length };
            })}><Icon name="ph-plus" />{BANKS[s.banks.length][0]}</button>
          )}
        </div>
        {s.banks.length > 1 && <p className="hint">Tocá una cuenta para cargar su saldo.</p>}
      </div>
      <KeypadArea value={active?.amount || ''} label={active?.name || 'Cuenta'} onKey={onKey} />
    </div>
  );
}

export function Income({ s, d, set, onKey }: ScreenProps) {
  return (
    <div className="screen">
      <div className="stack-12">
        <div>
          <Kicker>Paso 3 · Ingresos</Kicker>
          <h2 className="title" tabIndex={-1} data-autofocus>¿Cuánto cobrás por mes?</h2>
          <p className="sub" style={{ margin: 0 }}>Tu sueldo neto, lo que te entra. Con esto sabemos cuánto te queda libre.</p>
        </div>
        <div className="row-10 small">
          <Icon name="ph-calendar-blank" className="accent-icon" />
          <span className="muted-60">Cobrás el día</span>
          <Stepper label="Día de cobro" value={s.payday}
            onDec={() => set(x => ({ payday: x.payday <= 1 ? 31 : x.payday - 1 }))}
            onInc={() => set(x => ({ payday: x.payday >= 31 ? 1 : x.payday + 1 }))} />
          <span className="pay-in">{d.daysTo === 0 ? 'Cobrás hoy' : d.daysTo === 1 ? 'Falta 1 día' : `Faltan ${d.daysTo} días`}</span>
        </div>
      </div>
      <KeypadArea value={s.income} label="Ingreso mensual" onKey={onKey} />
    </div>
  );
}
