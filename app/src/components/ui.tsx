import { useEffect, useRef, type ReactNode } from 'react';

export const Icon = ({ name, className = '', style }: { name: string; className?: string; style?: React.CSSProperties }) => (
  <i className={`ph ${name} ${className}`} style={style} aria-hidden="true" />
);

const tick = () => { try { navigator.vibrate?.(8); } catch { /* unsupported */ } };

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', 'del'];

/** Number pad. Holding backspace clears the whole amount. */
export function Keypad({ onKey, compact = false }: { onKey: (k: string) => void; compact?: boolean }) {
  const hold = useRef<number | undefined>(undefined);
  const held = useRef(false);
  const startHold = () => {
    held.current = false;
    hold.current = window.setTimeout(() => { held.current = true; tick(); onKey('clear'); }, 550);
  };
  const endHold = () => clearTimeout(hold.current);
  return (
    <div className={`keypad${compact ? ' keypad-compact' : ''}`}>
      {KEYS.map(k => k === 'del' ? (
        <button key={k} type="button" className="key" aria-label="Borrar (mantené apretado para borrar todo)"
          onPointerDown={startHold} onPointerUp={endHold} onPointerLeave={endHold} onPointerCancel={endHold}
          onContextMenu={e => e.preventDefault()}
          onClick={() => { if (!held.current) { tick(); onKey('del'); } held.current = false; }}>
          <Icon name="ph-backspace" />
        </button>
      ) : (
        <button key={k} type="button" className="key" onClick={() => { tick(); onKey(k); }}>{k}</button>
      ))}
    </div>
  );
}

/** The big amount readout above the keypad, with a blinking caret. */
export const AmountDisplay = ({ value, label, size = 'lg' }: { value: string; label: string; size?: 'lg' | 'md' }) => (
  <div className={`amount amount-${size}${value === '$ 0' ? ' amount-empty' : ''}`} role="status" aria-live="polite" aria-label={`${label}: ${value}`}>
    {value}<span className="caret" aria-hidden="true" />
  </div>
);

export function Stepper({ value, onDec, onInc, label }: { value: number; onDec: () => void; onInc: () => void; label: string }) {
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button type="button" onClick={onDec} aria-label={`${label}: antes`}><Icon name="ph-minus" /></button>
      <span aria-live="polite">{value}</span>
      <button type="button" onClick={onInc} aria-label={`${label}: después`}><Icon name="ph-plus" /></button>
    </div>
  );
}

export const Switch = ({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) => (
  <button type="button" role="switch" aria-checked={on} aria-label={label} className={`switch${on ? ' on' : ''}`} onClick={onToggle}>
    <span className="knob" />
  </button>
);

export const Chip = ({ icon, selected, onClick, children, dashed = false }: { icon: string; selected?: boolean; onClick: () => void; children: ReactNode; dashed?: boolean }) => (
  <button type="button" className={`chip${selected ? ' selected' : ''}${dashed ? ' dashed' : ''}`} aria-pressed={dashed ? undefined : !!selected} onClick={onClick}>
    <Icon name={icon} />{children}
  </button>
);

export const Kicker = ({ children }: { children: ReactNode }) => <div className="kicker">{children}</div>;

export interface ToastData { msg: string; action?: { label: string; run: () => void }; key: number }

export function Toast({ toast, onClose }: { toast: ToastData | null; onClose: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, toast.action ? 5000 : 2600);
    return () => clearTimeout(t);
  }, [toast, onClose]);
  return (
    <div className="toast-region" role="status" aria-live="polite">
      {toast && (
        <div className="toast" key={toast.key}>
          <Icon name="ph-check-circle" className="toast-icon" />
          <span className="toast-msg">{toast.msg}</span>
          {toast.action && (
            <button type="button" className="btn btn-ghost toast-action" onClick={() => { toast.action!.run(); onClose(); }}>{toast.action.label}</button>
          )}
        </div>
      )}
    </div>
  );
}

export function ConfirmDialog({ open, title, body, confirm, onConfirm, onCancel }: { open: boolean; title: string; body: string; confirm: string; onConfirm: () => void; onCancel: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);
  if (!open) return null;
  return (
    <div className="dialog-backdrop" onClick={onCancel}>
      <div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dlg-t" aria-describedby="dlg-b" onClick={e => e.stopPropagation()}>
        <div className="dialog-title" id="dlg-t">{title}</div>
        <div className="dialog-body" id="dlg-b">{body}</div>
        <div className="dialog-actions">
          <button type="button" ref={ref} className="btn btn-secondary dialog-btn" onClick={onCancel}>Cancelar</button>
          <button type="button" className="btn btn-primary dialog-btn" onClick={onConfirm}>{confirm}</button>
        </div>
      </div>
    </div>
  );
}
