export type RevenueBreakdown = {
  batches: number;
  commerce: number;
  licenses: number;
  goals: number;
  grants: number;
  finance: number;
  total: number;
};

export type ExpenseBreakdown = {
  payroll: number;
  upkeep: number;
  materials: number;
  penalties: number;
  research: number;
  interest: number;
  total: number;
};

export type WeekLedger = {
  week: number;
  revenue: RevenueBreakdown;
  expenses: ExpenseBreakdown;
  net: number;
  cashEnd: number;
};

export function createEmptyLedger(week: number, cash: number): WeekLedger {
  return {
    week,
    revenue: { batches: 0, commerce: 0, licenses: 0, goals: 0, grants: 0, finance: 0, total: 0 },
    expenses: { payroll: 0, upkeep: 0, materials: 0, penalties: 0, research: 0, interest: 0, total: 0 },
    net: 0,
    cashEnd: cash,
  };
}

export function finalizeLedger(ledger: WeekLedger, cashEnd: number): WeekLedger {
  const rev = ledger.revenue;
  rev.total = rev.batches + rev.commerce + rev.licenses + rev.goals + rev.grants + rev.finance;

  const exp = ledger.expenses;
  exp.total = exp.payroll + exp.upkeep + exp.materials + exp.penalties + exp.research + exp.interest;

  ledger.net = rev.total - exp.total;
  ledger.cashEnd = cashEnd;
  return ledger;
}

export type FinancialHealth = {
  burnRate: number; // average weekly net burn (positive if losing money)
  runwayWeeks: number; // weeks left at current burn rate, or Infinity
  revenueAverage: number;
  expenseAverage: number;
  marginPercent: number;
  status: "solid" | "stable" | "tight" | "critical";
  statusLabel: string;
};

export function analyzeFinancialHealth(cash: number, history: WeekLedger[]): FinancialHealth {
  if (!history || history.length === 0) {
    return {
      burnRate: 0,
      runwayWeeks: Infinity,
      revenueAverage: 0,
      expenseAverage: 0,
      marginPercent: 0,
      status: "solid",
      statusLabel: "Inizio attività",
    };
  }

  const sample = history.slice(-12); // last 12 weeks
  const totalRev = sample.reduce((acc, l) => acc + l.revenue.total, 0);
  const totalExp = sample.reduce((acc, l) => acc + l.expenses.total, 0);
  const revenueAverage = Math.round(totalRev / sample.length);
  const expenseAverage = Math.round(totalExp / sample.length);
  const netAverage = revenueAverage - expenseAverage;

  const marginPercent = revenueAverage > 0 ? Math.round((netAverage / revenueAverage) * 100) : -100;
  const burnRate = netAverage < 0 ? -netAverage : 0;
  const runwayWeeks = burnRate > 0 ? (cash > 0 ? Math.floor(cash / burnRate) : 0) : Infinity;

  let status: FinancialHealth["status"] = "solid";
  let statusLabel = "Cassa florida";

  if (cash < 0) {
    status = "critical";
    statusLabel = "In rosso!";
  } else if (runwayWeeks <= 6) {
    status = "critical";
    statusLabel = `Rischio fallimento (${runwayWeeks} sett.)`;
  } else if (runwayWeeks <= 16) {
    status = "tight";
    statusLabel = `Cassa stretta (${runwayWeeks} sett.)`;
  } else if (burnRate > 0) {
    status = "stable";
    statusLabel = `In perdita controllata (${runwayWeeks} sett.)`;
  } else if (marginPercent > 20) {
    status = "solid";
    statusLabel = `Alta marginalità (+${marginPercent}%)`;
  } else {
    status = "stable";
    statusLabel = "In utile";
  }

  return {
    burnRate,
    runwayWeeks,
    revenueAverage,
    expenseAverage,
    marginPercent,
    status,
    statusLabel,
  };
}
