export type CreditRating = "AAA" | "AA" | "A" | "BBB" | "BB" | "B" | "CCC" | "D";

export type InvestmentRoundId = "pre_seed" | "seed" | "series_a" | "series_b" | "pre_ipo" | "ipo";

export type InvestmentRound = {
  id: InvestmentRoundId;
  name: string;
  investor: string;
  blurb: string;
  equityPercent: number; // e.g. 10%
  valuationPre: number;
  cashRaised: number;
  needBatches?: number;
  needTech?: string;
  needDrugPhase?: string;
  completed: boolean;
};

export type FinanceState = {
  loan: number; // Total principal currently borrowed
  maxLoan: number;
  creditRating: CreditRating;
  weeklyInterestRate: number; // fraction, e.g. 0.001 (0.1% per week ~ 5.2% p.a.)
  equityOwned: number; // starts at 100, drops with rounds
  rounds: InvestmentRound[];
  ipoDone: boolean;
  sharesFloat?: number;
  stockPrice?: number;
};

export const INITIAL_ROUNDS: InvestmentRound[] = [
  {
    id: "pre_seed",
    name: "Business Angels",
    investor: "Milano Bio-Angels",
    blurb: "Capitale iniziale per avviare il laboratorio senza debiti bancari.",
    equityPercent: 8,
    valuationPre: 3_000_000,
    cashRaised: 300_000,
    needBatches: 0,
    completed: false,
  },
  {
    id: "seed",
    name: "Seed Venture",
    investor: "Lombardia Innovazione Fund",
    blurb: "Fondi per espandere il campus e acquistare i primi reattori industriali.",
    equityPercent: 10,
    valuationPre: 7_500_000,
    cashRaised: 850_000,
    needBatches: 3,
    completed: false,
  },
  {
    id: "series_a",
    name: "Serie A - CDMO Scaleup",
    investor: "Pan-European Life Sciences",
    blurb: "Accelerazione della capacità GMP e avvio dei primi studi preclinici.",
    equityPercent: 12,
    valuationPre: 18_000_000,
    cashRaised: 2_500_000,
    needBatches: 10,
    completed: false,
  },
  {
    id: "series_b",
    name: "Serie B - Pipeline Discovery",
    investor: "Geneva Biotech Capital",
    blurb: "Finanziamento massiccio per portare la prima molecola proprietaria in clinica.",
    equityPercent: 12,
    valuationPre: 45_000_000,
    cashRaised: 6_000_000,
    needBatches: 18,
    completed: false,
  },
  {
    id: "pre_ipo",
    name: "Round Mezzanino / Pre-IPO",
    investor: "Sovereign Wealth Pharma Fund",
    blurb: "Consolidamento patrimoniale prima della quotazione sui mercati globali.",
    equityPercent: 8,
    valuationPre: 120_000_000,
    cashRaised: 12_000_000,
    needBatches: 25,
    completed: false,
  },
  {
    id: "ipo",
    name: "IPO - Quotazione in Borsa",
    investor: "Piazza Affari & Euronext",
    blurb: "Offerta pubblica iniziale: Aurelia diventa una Public Company quotata.",
    equityPercent: 18,
    valuationPre: 250_000_000,
    cashRaised: 45_000_000,
    needBatches: 30,
    completed: false,
  },
];

export function initialFinanceState(): FinanceState {
  return {
    loan: 0,
    maxLoan: 500_000,
    creditRating: "A",
    weeklyInterestRate: 0.0012, // ~6.2% annual
    equityOwned: 100,
    rounds: structuredClone(INITIAL_ROUNDS),
    ipoDone: false,
  };
}

export function calculateCreditRating(revenuePastYear: number, cash: number, debt: number, reputation: number): { rating: CreditRating; interestRate: number; maxLoan: number } {
  let score = 50; // Base score

  // Revenue power
  if (revenuePastYear > 5_000_000) score += 25;
  else if (revenuePastYear > 2_000_000) score += 18;
  else if (revenuePastYear > 500_000) score += 10;
  else if (revenuePastYear > 100_000) score += 4;

  // Liquidity
  if (cash > 2_000_000) score += 15;
  else if (cash > 500_000) score += 10;
  else if (cash < 0) score -= 25;

  // Debt ratio
  const debtRatio = revenuePastYear > 0 ? debt / revenuePastYear : debt > 0 ? 5 : 0;
  if (debtRatio > 2.5) score -= 30;
  else if (debtRatio > 1.2) score -= 15;
  else if (debtRatio === 0) score += 10;

  // Reputation
  score += Math.round((reputation - 50) * 0.3);

  let rating: CreditRating = "BBB";
  let annualRate = 0.07;
  let maxLoan = 800_000;

  if (score >= 85) {
    rating = "AAA";
    annualRate = 0.035;
    maxLoan = 12_000_000;
  } else if (score >= 75) {
    rating = "AA";
    annualRate = 0.045;
    maxLoan = 7_000_000;
  } else if (score >= 65) {
    rating = "A";
    annualRate = 0.055;
    maxLoan = 4_000_000;
  } else if (score >= 50) {
    rating = "BBB";
    annualRate = 0.07;
    maxLoan = 2_000_000;
  } else if (score >= 38) {
    rating = "BB";
    annualRate = 0.095;
    maxLoan = 1_000_000;
  } else if (score >= 25) {
    rating = "B";
    annualRate = 0.125;
    maxLoan = 500_000;
  } else if (score >= 12) {
    rating = "CCC";
    annualRate = 0.16;
    maxLoan = 250_000;
  } else {
    rating = "D";
    annualRate = 0.22;
    maxLoan = 50_000;
  }

  const weeklyInterestRate = annualRate / 52;
  return { rating, interestRate: weeklyInterestRate, maxLoan };
}
