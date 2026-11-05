import test from "node:test";
import assert from "node:assert/strict";
import { computePayroll, history, dayKey, shiftMonth } from "./payroll.mjs";

test("base salary accrues per elapsed weekday and leads add 2,000 MAD", () => {
  // October 2026: 22 weekdays. 30 Oct is a Friday -> all 22 elapsed.
  const p = computePayroll({ month: "2026-10", today: "2026-10-30", verifiedDates: ["2026-10-05", "2026-10-21", "2026-10-21", "2026-09-30"] });
  assert.equal(p.working_days, 22);
  assert.equal(p.elapsed_days, 22);
  assert.equal(p.verified_count, 3);
  assert.equal(p.commission, 6000);
  assert.equal(p.projected_total, 9000);
  assert.equal(p.earned_to_date, 9000);
  assert.equal(p.days.find(d => d.date === "2026-10-21").verified, 2);
  assert.equal(p.days.find(d => d.date === "2026-10-03").workday, false);
});

test("mid-month and future months", () => {
  const mid = computePayroll({ month: "2026-10", today: "2026-10-09", verifiedDates: [] });
  assert.equal(mid.elapsed_days, 7);
  assert.equal(mid.base_accrued, Math.round(3000 / 22 * 7 * 100) / 100);
  const future = computePayroll({ month: "2026-12", today: "2026-10-09" });
  assert.equal(future.elapsed_days, 0);
  assert.equal(future.earned_to_date, 0);
});

test("history, month shifting and Morocco dates", () => {
  assert.equal(shiftMonth("2026-01", -1), "2025-12");
  assert.equal(history({ month: "2026-10", today: "2026-10-30", verifiedDates: [] }).length, 9);
  assert.equal(dayKey("2026-10-30T23:30:00Z"), "2026-10-31");
  assert.equal(computePayroll({ month: "2026-10", today: "2026-10-30", perLead: 2500, verifiedDates: ["2026-10-01"] }).commission, 2500);
});

test("v22 · contract start: prorated first month, nothing before, full after", () => {
  // October 2026: 22 weekdays; starting Wed 14 Oct leaves 13 payable weekdays (14–30 Oct).
  const first = computePayroll({ month: "2026-10", today: "2026-10-30", contractStart: "2026-10-14" });
  assert.equal(first.working_days, 22);
  assert.equal(first.payable_days, 13);
  assert.equal(first.prorated, true);
  assert.equal(first.base_month, Math.round(3000 / 22 * 13 * 100) / 100);
  assert.equal(first.projected_total, first.base_month);
  assert.equal(first.earned_to_date, first.base_month);
  assert.equal(first.days.find(d => d.date === "2026-10-13").payable, false);
  // Mid-month: only payable days that already passed are accrued (14, 15, 16 Oct).
  const mid = computePayroll({ month: "2026-10", today: "2026-10-16", contractStart: "2026-10-14" });
  assert.equal(mid.elapsed_days, 3);
  // Before the contract: 0.
  const before = computePayroll({ month: "2026-09", today: "2026-10-30", contractStart: "2026-10-14" });
  assert.equal(before.payable_days, 0);
  assert.equal(before.projected_total, 0);
  // After: the full salary.
  const after = computePayroll({ month: "2026-11", today: "2026-11-30", contractStart: "2026-10-14" });
  assert.equal(after.projected_total, 3000);
  // Commission still counts and history respects the start date.
  assert.equal(computePayroll({ month: "2026-10", today: "2026-10-30", contractStart: "2026-10-14", verifiedDates: ["2026-10-20"] }).commission, 2000);
  const h = history({ month: "2026-10", today: "2026-10-30", verifiedDates: [], contractStart: "2026-10-14" });
  assert.equal(h.find(x => x.month === "2026-09").total, 0);
  // Invalid or empty start dates are ignored.
  assert.equal(computePayroll({ month: "2026-10", today: "2026-10-30", contractStart: "" }).projected_total, 3000);
  assert.equal(computePayroll({ month: "2026-10", today: "2026-10-30", contractStart: "14/10/2026" }).projected_total, 3000);
});
