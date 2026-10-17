import { PARCELS, ROOMS, GEAR, type Game, type Program, type Room } from "@/tycoon/model";

export type CompanyRank = {
  id: string;
  title: string;
  minValuation: number;
  perk: string;
};

export const RANKS: CompanyRank[] = [
  { id: "startup", title: "Startup di Ricerca", minValuation: 0, perk: "Punto di partenza dell'azienda." },
  { id: "cdmo_small", title: "Officina CDMO", minValuation: 5_000_000, perk: "Fiducia di base delle case farmaceutiche +5." },
  { id: "cdmo_tier1", title: "CDMO Specializzata", minValuation: 18_000_000, perk: "Contratti pagati il 6% in più." },
  { id: "biotech", title: "Biotech Emergente", minValuation: 50_000_000, perk: "Costo di deposito brevetti ridotto del 15%." },
  { id: "mid_pharma", title: "Mid-Pharma Internazionale", minValuation: 140_000_000, perk: "Tempo di revisione autorità ridotto di 1 settimana." },
  { id: "big_pharma", title: "Big Pharma Globale", minValuation: 350_000_000, perk: "Traguardo supremo raggiunto: dominanza sul mercato globale." },
];

export function currentRank(val: number): CompanyRank {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (val >= RANKS[i]!.minValuation) return RANKS[i]!;
  }
  return RANKS[0]!;
}

export function nextRank(val: number): CompanyRank | null {
  for (const r of RANKS) {
    if (val < r.minValuation) return r;
  }
  return null;
}

export function calculateEnterpriseValuation(g: Game): {
  total: number;
  cashVal: number;
  facilitiesVal: number;
  pipelineVal: number;
  commercialVal: number;
  reputationMultiplier: number;
} {
  const cashVal = Math.max(0, g.cash);

  // Facilities & Real Estate
  let facilitiesVal = 0;
  for (const pid of g.owned) {
    const p = PARCELS.find((item) => item.id === pid);
    if (p) facilitiesVal += p.cost || 100_000;
  }
  for (const r of g.rooms) {
    const def = ROOMS.find((rm) => rm.type === r.type);
    if (def) {
      facilitiesVal += def.shell * r.level;
    }
    for (const slot of r.slots) {
      if (slot.item) {
        const gDef = GEAR.find((gr) => gr.id === slot.item?.defId);
        if (gDef) facilitiesVal += gDef.cost * slot.item.level;
      }
    }
  }

  // Pipeline NPV
  let pipelineVal = 0;
  const stageNPV: Record<string, number> = {
    discovery: 200_000,
    lead: 600_000,
    preclinical: 1_800_000,
    patent: 3_500_000,
    phase1: 8_500_000,
    phase2: 24_000_000,
    phase3: 65_000_000,
    dossier: 95_000_000,
    review: 120_000_000,
    approved: 160_000_000,
  };

  for (const p of g.pipeline) {
    if (stageNPV[p.stage]) {
      let v = stageNPV[p.stage]!;
      if (p.patented) v *= 1.25;
      if (p.modality === "biologico") v *= 1.15;
      pipelineVal += Math.round(v);
    }
  }

  // Commercial in-market drugs valuation: ~8x annualized run-rate revenue
  const annualDrugRev = g.products.length * Math.max(50_000, g.playerShare * 65_000 * 52);
  const commercialVal = Math.round(annualDrugRev * 3.5);

  const reputationMultiplier = 0.8 + (g.reputation / 100) * 0.4; // 0.8 to 1.2
  const subtotal = cashVal + facilitiesVal + pipelineVal + commercialVal;
  const total = Math.round(subtotal * reputationMultiplier);

  return {
    total,
    cashVal,
    facilitiesVal,
    pipelineVal,
    commercialVal,
    reputationMultiplier: Math.round(reputationMultiplier * 100) / 100,
  };
}
