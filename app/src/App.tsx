import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { derive, fmt, num } from './calc';
import { ConfirmDialog, Icon, Toast, type ToastData } from './components/ui';
import { Bills, LogSpend } from './screens/Bills';
import { CashVsVirtual, WhenItGoes, WhereItGoes } from './screens/Insights';
import { Afford, Done, Tips } from './screens/Plan';
import { Accounts, Cash, Income, Welcome } from './screens/Setup';
import type { ScreenProps, SetState } from './screens/types';
import { clearState, editAmount, initialState, LAST_STEP, loadState, saveState, STEPS, type State } from './state';

const SCREENS = [Welcome, Cash, Accounts, Income, Bills, LogSpend, WhereItGoes, WhenItGoes, CashVsVirtual, Tips, Afford, Done];
const KEYPAD_STEPS = new Set([1, 2, 3, 5, 10]);

export default function App() {
  const [s, setS] = useState<State>(loadState);
  const [grow, setGrow] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  // When a screen sends the user back to fill something in, return there afterwards.
  const [detour, setDetour] = useState<{ at: number; back: number } | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);
  const step = s.step;

  const set: SetState = useCallback(p => setS(x => ({ ...x, ...(typeof p === 'function' ? p(x) : p) })), []);
  const d = useMemo(() => derive(s), [s]);

  useEffect(() => { saveState(s); }, [s]);

  // — Navigation, synced with the browser / Android back button —
  useEffect(() => {
    // Going back across a reload loads a fresh document whose history entry already names a step.
    if (history.state?.step == null) history.replaceState({ step, idx: 0 }, '');
    else if (history.state.step !== step) set({ step: Math.max(0, Math.min(LAST_STEP, history.state.step)) });
    const onPop = (e: PopStateEvent) => set({ step: Math.max(0, Math.min(LAST_STEP, e.state?.step ?? 0)) });
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const go = useCallback((n: number) => {
    const next = Math.max(0, Math.min(LAST_STEP, n));
    history.pushState({ step: next, idx: (history.state?.idx ?? 0) + 1 }, '');
    set({ step: next });
  }, [set]);
  const back = () => {
    if ((history.state?.idx ?? 0) > 0) history.back();
    else { history.replaceState({ step: step - 1, idx: 0 }, ''); set({ step: step - 1 }); }
  };

  // — Per-screen entrance: replay grow animations, reset scroll, move focus to the heading —
  useEffect(() => {
    setGrow(false);
    const t = setTimeout(() => setGrow(true), 90);
    scroller.current?.scrollTo({ top: 0 });
    if (!firstRender.current) scroller.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus({ preventScroll: true });
    firstRender.current = false;
    setDetour(x => (x && x.at !== step ? null : x));
    return () => clearTimeout(t);
  }, [step]);

  const notify = useCallback((msg: string, action?: ToastData['action']) => setToast({ msg, action, key: Date.now() }), []);
  const closeToast = useCallback(() => setToast(null), []);

  const onKey = useCallback((k: string) => set(x => {
    switch (x.step) {
      case 1: return { wallet: editAmount(x.wallet, k) };
      case 2: return { banks: x.banks.map((b, i) => (i === x.activeBank ? { ...b, amount: editAmount(b.amount, k) } : b)) };
      case 3: return { income: editAmount(x.income, k) };
      case 5: return { spendAmt: editAmount(x.spendAmt, k) };
      case 10: return { price: editAmount(x.price, k) };
      default: return {};
    }
  }), [set]);

  const logSpend = () => {
    const amt = num(s.spendAmt);
    const prev = { wallet: s.wallet, banks: s.banks, logged: s.logged };
    const upd = s.method === 'cash'
      ? { wallet: String(Math.max(0, num(s.wallet) - amt)) }
      : { banks: s.banks.map((b, i) => (i === 0 ? { ...b, amount: String(Math.max(0, num(b.amount) - amt)) } : b)) };
    set({ ...upd, logged: [...s.logged, { amt, method: s.method, cat: s.cat }], spendAmt: '' });
    go(6);
    notify(`Anotado: ${fmt(amt)} · ${s.cat} · ${s.method === 'cash' ? 'Efectivo' : 'Tarjeta'}`, { label: 'Deshacer', run: () => set(prev) });
  };

  const wallet = num(s.wallet), income = num(s.income);
  const cta = ['Empecemos', wallet ? `Guardar ${fmt(wallet)}` : 'No tengo efectivo', 'Continuar',
    income ? `Guardar ${fmt(income)}` : 'Prefiero no decirlo', 'Guardar fijos', 'Anotar',
    'Siguiente dato', 'Siguiente dato', 'Ver mi plan', 'Probar', 'Terminar', 'Volver a empezar'][step];
  const returnTo = detour && detour.at === step ? detour.back : null;
  const ctaDisabled = step === 5 && !num(s.spendAmt);
  const next = () => {
    if (ctaDisabled) return;
    if (step === 5) return logSpend();
    if (returnTo != null) { setDetour(null); return go(returnTo); }
    go(step === LAST_STEP ? 0 : step + 1);
  };
  const goFrom = useCallback((n: number) => { setDetour({ at: n, back: step }); go(n); }, [go, step]);

  // Physical keyboard: digits and backspace on keypad screens, Enter continues.
  const nextRef = useRef(next);
  nextRef.current = next;
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (confirmReset || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement;
      if (t.closest('input, textarea, select, [contenteditable]')) return;
      if (!KEYPAD_STEPS.has(step)) return;
      if (/^[0-9]$/.test(e.key)) { e.preventDefault(); onKey(e.key); }
      else if (e.key === 'Backspace') { e.preventDefault(); onKey('del'); }
      else if (e.key === 'Delete' || e.key === 'Escape') { e.preventDefault(); onKey('clear'); }
      else if (e.key === 'Enter' && !t.closest('button, a')) { e.preventDefault(); nextRef.current(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [step, onKey, confirmReset]);

  const Screen = SCREENS[step];
  const props: ScreenProps = { s, d, set, go: step === 10 ? goFrom : go, grow, notify, onKey };

  return (
    <div className="app">
      <header className="topbar">
        <button type="button" className="btn btn-icon back" onClick={back} disabled={step === 0} aria-label="Atrás"><Icon name="ph-caret-left" /></button>
        <div className="progress" role="progressbar" aria-label="Progreso" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1} aria-valuetext={`Paso ${step + 1} de ${STEPS.length}: ${STEPS[step]}`}>
          {STEPS.map((_, j) => <div key={j} className={`seg-bar${j <= step ? ' done' : ''}`} />)}
        </div>
        <span className="count" aria-hidden="true">{step + 1}/{STEPS.length}</span>
      </header>

      <Toast toast={toast} onClose={closeToast} />

      <main className="content noscroll" ref={scroller}>
        <Screen {...props} />
      </main>

      <footer className="footer">
        <button type="button" className="btn btn-primary btn-block cta" onClick={next} disabled={ctaDisabled}>
          {returnTo != null ? 'Guardar y volver' : cta}<Icon name={returnTo != null ? 'ph-arrow-u-up-left' : 'ph-arrow-right'} />
        </button>
        {step === 5 && <button type="button" className="btn btn-ghost secondary-action" onClick={() => go(6)}>Saltear por ahora</button>}
        {step === LAST_STEP && <button type="button" className="btn btn-ghost secondary-action" onClick={() => setConfirmReset(true)}>Borrar mis datos</button>}
      </footer>

      <ConfirmDialog open={confirmReset} title="¿Borrar todo?" confirm="Sí, borrar"
        body="Se borran tu efectivo, cuentas, ingresos, gastos fijos y lo que anotaste. No se puede deshacer."
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          clearState();
          setS(initialState());
          history.replaceState({ step: 0, idx: 0 }, '');
          setConfirmReset(false);
          notify('Listo, empezamos de cero');
        }} />
    </div>
  );
}
