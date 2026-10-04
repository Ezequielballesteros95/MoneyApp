// Paso 4 (monthly bills) and Paso 5 (log a spend).
import { useRef } from 'react';
import { fmt, fmtEntry, num } from '../calc';
import { AmountDisplay, Chip, Icon, Keypad, Kicker, Stepper, Switch } from '../components/ui';
import { BILL_SUGGEST, CATS, newId, type Bill } from '../state';
import type { ScreenProps } from './types';

/** Text field with thousands separators and the numeric keyboard on phones. */
function MoneyInput({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  return (
    <div className="money-input">
      <span aria-hidden="true">$</span>
      <input className="input" inputMode="numeric" enterKeyHint="done" aria-label={label}
        value={value ? value.toLocaleString('es-AR') : ''} placeholder="0"
        onFocus={e => e.currentTarget.select()}
        onChange={e => onChange(Math.min(999_999_999, parseInt(e.target.value.replace(/\D/g, ''), 10) || 0))} />
    </div>
  );
}

export function Bills({ s, d, set, notify }: ScreenProps) {
  // A bill added with "Otro" gets its name field focused as soon as it mounts.
  const focusNext = useRef<string | null>(null);

  const patch = (id: string, p: Partial<Bill>) => set(x => ({ bills: x.bills.map(b => (b.id === id ? { ...b, ...p } : b)) }));
  const remove = (bill: Bill) => {
    const idx = s.bills.findIndex(b => b.id === bill.id);
    set(x => ({ bills: x.bills.filter(b => b.id !== bill.id) }));
    notify(`Quitaste ${bill.name || 'el gasto'}`, {
      label: 'Deshacer',
      run: () => set(x => { const bills = [...x.bills]; bills.splice(Math.min(idx, bills.length), 0, bill); return { bills }; }),
    });
  };
  const suggestions = BILL_SUGGEST.filter(([n]) => n === 'Otro' || !s.bills.some(b => b.name === n));

  return (
    <div className="screen stack-10 pad-bottom">
      <div>
        <Kicker>Paso 4 · Todos los meses</Kicker>
        <h2 className="title" tabIndex={-1} data-autofocus>¿Qué pagás cada mes?</h2>
        <p className="sub" style={{ margin: 0 }}>Con el día de vencimiento te avisamos a tiempo. Apagá o quitá lo que no tengas.</p>
      </div>

      {s.bills.map(b => {
        const label = b.name || 'Gasto nuevo';
        return (
          <div key={b.id} className={`card bill${b.on ? '' : ' off'}`}>
            <div className="bill-row">
              <Icon name={b.icon} className="bill-icon" />
              {b.custom ? (
                <input className="input bill-name-input" value={b.name} placeholder="Nombre del gasto" aria-label="Nombre del gasto"
                  ref={el => { if (el && focusNext.current === b.id) { focusNext.current = null; el.focus(); } }} enterKeyHint="next"
                  onChange={e => patch(b.id, { name: e.target.value })} />
              ) : (
                <div className="bill-name">{b.name}</div>
              )}
              <Switch on={b.on} label={`Incluir ${label}`} onToggle={() => patch(b.id, { on: !b.on })} />
              <button type="button" className="btn btn-icon bill-remove" aria-label={`Quitar ${label}`} onClick={() => remove(b)}><Icon name="ph-x" /></button>
            </div>
            <div className="bill-sub">
              <MoneyInput label={`Monto de ${label}`} value={b.amount} onChange={amount => patch(b.id, { amount })} />
              {b.on && b.due != null && (
                <div className="bill-due">
                  <span className="muted-60">Vence el</span>
                  <Stepper label={`Vencimiento de ${label}`} value={b.due}
                    onDec={() => patch(b.id, { due: Math.max(1, b.due! - 1) })}
                    onInc={() => patch(b.id, { due: Math.min(28, b.due! + 1) })} />
                </div>
              )}
              {b.on && b.due == null && <span className="muted-60 bill-weekly">≈ {fmt(b.amount / 4)} por semana</span>}
            </div>
          </div>
        );
      })}

      <div className="stack-6" style={{ marginTop: 2 }}>
        <span className="label">Agregar otro gasto fijo</span>
        <div className="wrap-6">
          {suggestions.map(([name, icon, amount, due]) => (
            <Chip key={name} icon="ph-plus" dashed onClick={() => {
              const id = newId();
              set(x => ({ bills: [...x.bills, { id, name: name === 'Otro' ? '' : name, icon, amount, on: true, due, custom: name === 'Otro' }] }));
              if (name === 'Otro') focusNext.current = id;
            }}>{name}</Chip>
          ))}
        </div>
      </div>

      <div className="bills-total">
        <span className="muted-60 small">{s.bills.length ? 'Fijos por mes' : 'Sin gastos fijos por ahora. Agregá uno si lo tenés.'}</span>
        <span className="bills-total-amt">{fmt(d.billsTotal)}</span>
      </div>
    </div>
  );
}

export function LogSpend({ s, set, onKey }: ScreenProps) {
  const from = s.method === 'cash' ? num(s.wallet) : num(s.banks[0]?.amount || '');
  const left = from - num(s.spendAmt);
  return (
    <div className="screen">
      <div className="stack-10">
        <div>
          <Kicker>Paso 5 · Probalo</Kicker>
          <h2 className="title" tabIndex={-1} data-autofocus style={{ marginBottom: 0 }}>Anotá tu último gasto</h2>
        </div>
        <div className="seg" role="radiogroup" aria-label="Cómo pagaste" style={{ alignSelf: 'flex-start' }}>
          <label className="seg-opt seg-tall"><input type="radio" name="method" checked={s.method === 'cash'} onChange={() => set({ method: 'cash' })} /><Icon name="ph-money" />Efectivo</label>
          <label className="seg-opt seg-tall"><input type="radio" name="method" checked={s.method === 'virtual'} onChange={() => set({ method: 'virtual' })} /><Icon name="ph-credit-card" />Tarjeta</label>
        </div>
        <div className="chip-scroll" role="group" aria-label="Categoría">
          {CATS.map(([name, icon]) => <Chip key={name} icon={icon} selected={s.cat === name} onClick={() => set({ cat: name })}>{name}</Chip>)}
        </div>
        <div className="small muted-55" style={{ fontSize: 12 }}>
          Sale de <span className="text">{s.method === 'cash' ? 'tu billetera' : s.banks[0]?.name}</span> · te queda: <span className={left < 0 ? 'warn-text' : ''}>{fmt(left)}</span>
        </div>
      </div>
      <div className="keypad-area">
        <div className="amount-wrap"><AmountDisplay value={fmtEntry(s.spendAmt)} label="Gasto" /></div>
        <Keypad onKey={onKey} />
      </div>
    </div>
  );
}
