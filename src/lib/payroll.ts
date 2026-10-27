// Deterministic demo payroll arithmetic. NOT legally verified payroll rules.
export type LineItem = { label: string; amount: number };

export type PayPolicy = {
  hourlyRate: number;
  standardDailyHours: number;
  overtimeMultiplier: number;
  extraShiftMultiplier: number;
  unpaidLeaveFactor: number; // fraction of a standard day's pay deducted per unpaid day
  allowances: LineItem[];
  deductions: LineItem[];
};

export type Shift = {
  id: string;
  date: string; // YYYY-MM-DD
  hours: number;
  isExtraShift: boolean; // a scheduled day off worked as an additional shift
  note?: string | undefined;
};

export type ShiftSplit = { regular: number; extra: number; overtime: number };

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Each hour is classified exactly once, so nothing is counted twice. */
export function classifyShift(s: Shift, p: PayPolicy): ShiftSplit {
  const hours = Math.max(0, s.hours);
  const base = Math.min(hours, p.standardDailyHours);
  const overtime = Math.max(0, hours - p.standardDailyHours);
  return s.isExtraShift
    ? { regular: 0, extra: base, overtime }
    : { regular: base, extra: 0, overtime };
}

export function computePayslip(shifts: Shift[], unpaidLeaveDays: number, p: PayPolicy) {
  const totals = shifts.reduce<ShiftSplit>(
    (acc, s) => {
      const c = classifyShift(s, p);
      return { regular: acc.regular + c.regular, extra: acc.extra + c.extra, overtime: acc.overtime + c.overtime };
    },
    { regular: 0, extra: 0, overtime: 0 },
  );
  const extraRate = r2(p.hourlyRate * p.extraShiftMultiplier);
  const otRate = r2(p.hourlyRate * p.overtimeMultiplier);
  const regularPay = r2(totals.regular * p.hourlyRate);
  const extraPay = r2(totals.extra * extraRate);
  const overtimePay = r2(totals.overtime * otRate);
  const allowances = r2(p.allowances.reduce((a, b) => a + b.amount, 0));
  const gross = r2(regularPay + extraPay + overtimePay + allowances);
  const perUnpaidDay = r2(p.standardDailyHours * p.hourlyRate * p.unpaidLeaveFactor);
  const unpaidLeave = r2(unpaidLeaveDays * perUnpaidDay);
  const otherDeductions = r2(p.deductions.reduce((a, b) => a + b.amount, 0));
  const totalDeductions = r2(unpaidLeave + otherDeductions);
  const net = r2(gross - totalDeductions);
  return {
    hours: totals, extraRate, otRate, regularPay, extraPay, overtimePay, allowances,
    gross, perUnpaidDay, unpaidLeaveDays, unpaidLeave, otherDeductions, totalDeductions, net,
  };
}

/** Inclusive number of days of [start,end] falling inside month "YYYY-MM". */
export function leaveDaysInMonth(start: string, end: string, month: string): number {
  const [y = 1970, m = 1] = month.split("-").map(Number);
  const mStart = Date.UTC(y, m - 1, 1);
  const mEnd = Date.UTC(y, m, 0);
  const s = Math.max(Date.parse(start + "T00:00:00Z"), mStart);
  const e = Math.min(Date.parse(end + "T00:00:00Z"), mEnd);
  if (Number.isNaN(s) || Number.isNaN(e) || e < s) return 0;
  return Math.round((e - s) / 86400000) + 1;
}

export function leaveDays(start: string, end: string): number {
  const s = Date.parse(start + "T00:00:00Z");
  const e = Date.parse(end + "T00:00:00Z");
  if (Number.isNaN(s) || Number.isNaN(e) || e < s) return 0;
  return Math.round((e - s) / 86400000) + 1;
}

export const inr = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
