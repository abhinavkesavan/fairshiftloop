import { describe, expect, it } from "vitest";
import { classifyShift, computePayslip, leaveDaysInMonth, type PayPolicy } from "./payroll";

const p: PayPolicy = {
  hourlyRate: 100, standardDailyHours: 8, overtimeMultiplier: 1.5, extraShiftMultiplier: 1.25,
  unpaidLeaveFactor: 1, allowances: [{ label: "A", amount: 500 }], deductions: [{ label: "D", amount: 200 }],
};

describe("payroll", () => {
  it("never counts an hour twice on an extra shift with overtime", () => {
    const c = classifyShift({ id: "1", date: "2026-10-04", hours: 10, isExtraShift: true }, p);
    expect(c).toEqual({ regular: 0, extra: 8, overtime: 2 });
  });

  it("computes gross, deductions and net", () => {
    const r = computePayslip(
      [
        { id: "1", date: "2026-10-01", hours: 10, isExtraShift: false },
        { id: "2", date: "2026-10-04", hours: 8, isExtraShift: true },
      ],
      1,
      p,
    );
    // regular 8*100=800, OT 2*150=300, extra 8*125=1000, allowance 500
    expect(r.gross).toBe(2600);
    // unpaid 1 day * 8 * 100 = 800, other 200
    expect(r.totalDeductions).toBe(1000);
    expect(r.net).toBe(1600);
  });

  it("counts leave days only inside the month", () => {
    expect(leaveDaysInMonth("2026-09-29", "2026-10-02", "2026-10")).toBe(2);
  });
});
