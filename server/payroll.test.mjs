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
