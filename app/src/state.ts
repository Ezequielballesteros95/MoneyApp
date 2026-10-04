// App state, defaults and persistence. Amount entries typed on the keypad are
// kept as digit strings (like the prototype) so "000" and backspace behave.

export const STEPS = [
  'Bienvenida', 'Efectivo', 'Cuentas', 'Ingresos', 'Gastos fijos', 'Anotar un gasto',
  'En qué se va', 'Cuándo se va', 'Efectivo vs virtual', 'Dónde optimizar', '¿Me alcanza?', 'Listo',
] as const;
export const LAST_STEP = STEPS.length - 1;

export const BANKS: [string, string][] = [
  ['Banco principal', 'ph-bank'], ['Ahorros', 'ph-piggy-bank'], ['Billetera virtual', 'ph-device-mobile'],
];
export const CATS: [string, string][] = [
  ['Súper', 'ph-basket'], ['Comer afuera', 'ph-fork-knife'], ['Transporte', 'ph-bus'],
  ['Café', 'ph-coffee'], ['Salidas', 'ph-ticket'], ['Otros', 'ph-dots-three'],
];
export const ITEMS: [string, string, string][] = [
  ['Celular', 'ph-device-mobile', '650000'], ['Zapatillas', 'ph-sneaker', '180000'],
  ['Escapada', 'ph-airplane-tilt', '420000'], ['Otra cosa', 'ph-shopping-cart', ''],
];
// [name, icon, amount, due day | null]
export const BILL_SUGGEST: [string, string, number, number | null][] = [
  ['Alquiler', 'ph-house-line', 450000, 10], ['Súper', 'ph-basket', 180000, null],
  ['Gastos diarios', 'ph-shopping-bag', 90000, null], ['Internet y celular', 'ph-wifi-high', 25000, 15],
  ['Expensas', 'ph-buildings', 85000, 10], ['Gimnasio', 'ph-barbell', 35000, 5],
  ['Streaming', 'ph-television-simple', 12000, 20], ['Seguro', 'ph-shield-check', 40000, 15],
  ['Otro', 'ph-receipt', 0, 1],
];

export type Method = 'cash' | 'virtual';
export interface Bank { name: string; icon: string; amount: string }
export interface Bill { id: string; name: string; icon: string; amount: number; on: boolean; due: number | null; custom?: boolean }
export interface Logged { amt: number; method: Method; cat: string }

export interface State {
  step: number;
  wallet: string;
  banks: Bank[];
  activeBank: number;
  bills: Bill[];
  income: string;
  payday: number;
  price: string;
  cuotas: number;
  item: string;
  spendAmt: string;
  method: Method;
  cat: string;
  logged: Logged[];
  remind: Record<string, boolean>;
}

let seq = 0;
export const newId = () => `b${Date.now().toString(36)}${(seq++).toString(36)}`;

export const initialState = (): State => ({
  step: 0, wallet: '', banks: [{ name: 'Banco principal', icon: 'ph-bank', amount: '' }], activeBank: 0,
  bills: [
    { id: 'rent', name: 'Alquiler', icon: 'ph-house-line', amount: 450000, on: true, due: 10 },
    { id: 'market', name: 'Súper', icon: 'ph-basket', amount: 180000, on: true, due: null },
    { id: 'daily', name: 'Gastos diarios', icon: 'ph-shopping-bag', amount: 90000, on: true, due: null },
    { id: 'net', name: 'Internet y celular', icon: 'ph-wifi-high', amount: 25000, on: false, due: 15 },
  ],
  income: '', payday: 1, price: '650000', cuotas: 1, item: 'Celular',
  spendAmt: '', method: 'cash', cat: 'Comer afuera', logged: [], remind: {},
});

const KEY = 'toda-tu-plata/v1';

export function loadState(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<State>;
      const s = { ...initialState(), ...saved };
      s.step = Math.max(0, Math.min(LAST_STEP, Number(s.step) || 0));
      if (!s.banks.length) s.banks = initialState().banks;
      s.activeBank = Math.min(s.activeBank, s.banks.length - 1);
      return s;
    }
  } catch { /* storage unavailable or corrupt — start fresh */ }
  return initialState();
}

export function saveState(s: State) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* private mode, quota… */ }
}

export function clearState() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

/** Keypad editing: max 9 digits, "000" only after a first digit, no leading zero. */
export function editAmount(s: string, k: string): string {
  if (k === 'del') return s.slice(0, -1);
  if (k === 'clear') return '';
  const add = k === '000' ? (s ? '000' : '') : k;
  if ((s + add).length > 9) return s;
  return s === '0' ? add : s + add;
}
