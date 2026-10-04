// Everything the screens show that is derived from state. Pure functions — the
// insight screens mix sample data with what the user logs, as in the design.
import type { State } from './state';

export const num = (s: string) => parseFloat(s) || 0;
export const fmt = (n: number) => (n < 0 ? '−' : '') + '$ ' + Math.round(Math.abs(n)).toLocaleString('es-AR');
export const fmtEntry = (s: string) => '$ ' + (s ? Number(s).toLocaleString('es-AR') : '0');
const short = (v: number) => (v >= 1000 ? '$' + Math.round(v / 1000) + 'k' : '$' + v);
const round1k = (v: number) => Math.round(v / 1000) * 1000;

/** Days from today until the next payday (payday clamped to the month's length). */
export function daysUntil(payday: number, today = new Date()): number {
  const d = today.getDate();
  const thisLen = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const thisPay = Math.min(payday, thisLen);
  if (thisPay >= d) return thisPay - d;
  const nextLen = new Date(today.getFullYear(), today.getMonth() + 2, 0).getDate();
  return thisLen - d + Math.min(payday, nextLen);
}

export type VerdictKind = 'need' | 'idle' | 'ok' | 'tight' | 'warn' | 'no';
export interface Verdict { k: VerdictKind; icon: string; label: string; title: string; body: string }

export function derive(s: State, today = new Date()) {
  const wallet = num(s.wallet);
  const banksSum = s.banks.reduce((a, b) => a + num(b.amount), 0);
  const total = wallet + banksSum;
  const billAmt = (b: State['bills'][number]) => (b.on ? b.amount : 0);
  const billsTotal = s.bills.reduce((a, b) => a + billAmt(b), 0);
  const loggedBy = (cat: string) => s.logged.filter(l => l.cat === cat).reduce((a, l) => a + l.amt, 0);
  const loggedCash = s.logged.filter(l => l.method === 'cash').reduce((a, l) => a + l.amt, 0);
  const loggedVirt = s.logged.filter(l => l.method !== 'cash').reduce((a, l) => a + l.amt, 0);
  const loggedAll = s.logged.reduce((a, l) => a + l.amt, 0);

  // — Dato 1: where it goes —
  const catData = [
    { name: 'Alquiler', icon: 'ph-house-line', v: s.bills.filter(b => b.name === 'Alquiler').reduce((a, b) => a + billAmt(b), 0) },
    { name: 'Súper', icon: 'ph-basket', v: 196000 + loggedBy('Súper') },
    { name: 'Comer afuera', icon: 'ph-fork-knife', v: 118000 + loggedBy('Comer afuera') },
    { name: 'Salidas', icon: 'ph-ticket', v: 80000 + loggedBy('Salidas') },
    { name: 'Transporte', icon: 'ph-bus', v: 42000 + loggedBy('Transporte') },
    { name: 'Café', icon: 'ph-coffee', v: 31000 + loggedBy('Café') + loggedBy('Otros') },
  ].filter(c => c.v > 0).sort((a, b) => b.v - a.v);
  const catTotal = catData.reduce((a, c) => a + c.v, 0);
  const top = catData[0], second = catData[1];
  const marketV = catData.find(c => c.name === 'Súper')?.v || 0;
  const eatV = catData.find(c => c.name === 'Comer afuera')?.v || 0;

  // — Dato 2: when it goes —
  const wk: [string, number][] = [['Lun', 9500], ['Mar', 13000], ['Mié', 10200], ['Jue', 15000], ['Vie', 37000], ['Sáb', 30500 + loggedAll], ['Dom', 11300]];
  const wMax = Math.max(...wk.map(w => w[1]));
  const peak = wk.find(w => w[1] === wMax)!;
  const weekday = (9500 + 13000 + 10200 + 15000) / 4;
  const weekend = (wk[4][1] + wk[5][1]) / 2;
  const dayFull = ({ Lun: 'lunes', Mar: 'martes', Mié: 'miércoles', Jue: 'jueves', Vie: 'viernes', Sáb: 'sábados', Dom: 'domingos' } as Record<string, string>)[peak[0]];
  const week = wk.map(([d, v]) => ({ d, v, amt: short(v), ratio: v / wMax, hot: v === wMax, mid: v > 25000 }));

  // — Dato 3: how it goes —
  const cashV = 96000 + loggedCash, virtV = 410000 + loggedVirt;
  const cashPct = Math.round(cashV / (cashV + virtV) * 100);

  // — Budget & "¿Me lo puedo dar?" —
  const income = num(s.income);
  const variable = catData.filter(c => c.name !== 'Alquiler' && c.name !== 'Súper').reduce((a, c) => a + c.v, 0);
  const savings = round1k(income * 0.1);
  const free = income - billsTotal - variable - savings;
  const weekly = Math.max(0, (income ? income - billsTotal - savings : total - billsTotal) / 4);
  const daysTo = daysUntil(s.payday, today);
  const price = num(s.price), monthly = price / s.cuotas;

  let verdict: Verdict;
  if (!income) verdict = { k: 'need', icon: 'ph-question', label: 'Falta un dato', title: 'Cargá tus ingresos', body: 'Sin tu sueldo no podemos decirte si te alcanza.' };
  else if (!price) verdict = { k: 'idle', icon: 'ph-pencil-simple', label: 'Precio', title: 'Escribí cuánto sale', body: `Este mes te quedan ${fmt(Math.max(0, free))} libres después de fijos, gastos del día a día y ahorro.` };
  else if (monthly <= free * 0.5) verdict = { k: 'ok', icon: 'ph-check-circle', label: 'Dale', title: 'Te lo podés dar', body: `${s.cuotas > 1 ? s.cuotas + ' cuotas de ' + fmt(monthly) : fmt(price)} usa el ${Math.round(monthly / free * 100)}% de lo que te queda libre. Seguís ahorrando ${fmt(savings)}.` };
  else if (monthly <= free) verdict = { k: 'tight', icon: 'ph-scales', label: 'Con ajuste', title: 'Se puede, pero ajustado', body: `Te quedarían ${fmt(free - monthly)} libres este mes. ${daysTo > 0 ? 'Esperá al ' + s.payday + ', que cobrás (faltan ' + daysTo + (daysTo === 1 ? ' día).' : ' días).') : 'Hoy cobrás: buen día para comprarlo.'}` };
  else if (monthly <= free + savings) verdict = { k: 'warn', icon: 'ph-warning', label: 'Ojo', title: 'Solo si tocás tu ahorro', body: `Te faltan ${fmt(monthly - Math.max(0, free))} por mes. ${s.cuotas < 12 ? 'Probá en más cuotas o esperá un mes.' : 'Mejor esperá un mes.'}` };
  else {
    const per = Math.max(0, free) + savings;
    verdict = { k: 'no', icon: 'ph-hourglass-medium', label: 'Mejor esperá', title: 'Hoy no te alcanza', body: per > 0 ? `Guardando ${fmt(per)} por mes lo tenés en ${Math.ceil(price / per)} meses.` : 'Primero conviene bajar algún gasto fijo.' };
  }
  const pctI = (x: number) => (income ? Math.max(0, x / income * 100) : 0);
  const buy = Math.min(monthly, Math.max(0, free));
  const bar = [
    { label: 'Fijos', w: pctI(billsTotal), bg: 'var(--color-neutral-700)' },
    { label: 'Día a día', w: pctI(variable), bg: 'var(--color-neutral-800)' },
    { label: 'Ahorro', w: pctI(savings), bg: 'var(--color-accent-800)' },
    { label: 'Esta compra', w: pctI(buy), bg: 'var(--color-accent-500)' },
    { label: 'Libre', w: pctI(Math.max(0, free - buy)), bg: 'var(--color-neutral-600)' },
  ].map(b => ({ ...b, w: Math.min(100, b.w) }));

  // — Tips —
  const keep = 40000, extraCash = Math.max(0, wallet - keep);
  const dueBill = s.bills.find(b => b.name === 'Alquiler' && b.on && b.due != null) || s.bills.find(b => b.on && b.due != null);
  const billPayDay = Math.max(1, ((dueBill && dueBill.due) || 10) - 2);
  const bank0 = s.banks[0]?.name || 'tu cuenta';
  const recs = [
    extraCash > 0
      ? { id: 'cash', icon: 'ph-piggy-bank', when: 'Lunes · 9:00', title: `Pasá ${fmt(extraCash)} del efectivo a ahorro`, body: `Quedate con ${fmt(keep)} para la semana. La plata que no llevás encima no se gasta de impulso.`, save: `+${fmt(extraCash)}` }
      : { id: 'cash', icon: 'ph-piggy-bank', when: 'El día que cobrás', title: 'Separá el 10% apenas entra el sueldo', body: 'Movelo a Ahorros antes de que la semana empiece a gastarlo.', save: 'Ahorro automático' },
    { id: 'alert', icon: 'ph-bell-simple-ringing', when: 'Alerta · Comer afuera', title: `Avisame al llegar a ${fmt(round1k(eatV * 0.8))}`, body: `Este mes llevás ${fmt(eatV)} en comer afuera. Te avisamos al 80% para que decidas a tiempo.`, save: '−15% posible' },
    { id: 'bills', icon: 'ph-calendar-check', when: `Día ${billPayDay} · 10:00`, title: dueBill ? `Pagá ${dueBill.name.trim().toLowerCase() || 'tus fijos'} dos días antes` : 'Pagá tus fijos apenas cobrás', body: `${dueBill ? 'Vence el ' + dueBill.due + '.' : 'Así no se te mezclan con los gastos del día a día.'} Transferí desde ${bank0} y no toques el efectivo de la semana.`, save: 'Sin recargos' },
    { id: 'weekly', icon: 'ph-calendar-blank', when: 'Domingos · 20:00', title: `Tu presupuesto semanal: ${fmt(weekly)}`, body: `Es lo que te queda libre después de los fijos, dividido en 4. Los ${dayFull} conviene ponerles un tope.`, save: 'Semana a semana' },
    { id: 'card', icon: 'ph-credit-card', when: 'Miércoles · súper', title: 'Pagá el súper con débito, no en efectivo', body: `Con los reintegros de mitad de semana tu compra de ${fmt(marketV)} baja cerca de un 10%.`, save: `~${fmt(round1k(marketV * 0.1))}/mes` },
  ];

  return {
    wallet, banksSum, total, billsTotal, income, free, savings, daysTo,
    catData, catTotal, top, second, week, peak, weekday, weekend, dayFull,
    cashV, virtV, cashPct, coffee: 31000 + loggedBy('Café'),
    verdict, bar, recs,
    remindCount: Object.values(s.remind).filter(Boolean).length,
    cashShare: total ? Math.round(wallet / total * 100) : 0,
    safeDay: Math.max(0, (total - billsTotal) / 28),
  };
}
export type Derived = ReturnType<typeof derive>;
