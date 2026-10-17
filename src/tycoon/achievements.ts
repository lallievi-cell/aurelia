import { type Game } from "@/tycoon/model";

export type Achievement = {
  id: string;
  title: string;
  category: "produzione" | "scienza" | "finanza" | "impero" | "qualita";
  description: string;
  icon: string;
  rewardCash?: number;
  rewardSci?: number;
  isUnlocked: (g: Game) => boolean;
};

export const ACHIEVEMENTS_LIST: Achievement[] = [
  // Produzione
  {
    id: "first_clean_batch",
    title: "Prima Consegna Pulita",
    category: "produzione",
    description: "Consegna il tuo primo lotto farmaceutico senza scarti.",
    icon: "📦",
    rewardCash: 25_000,
    isUnlocked: (g) => g.stats.batches >= 1,
  },
  {
    id: "batch_master",
    title: "Fabbrica Infaticabile",
    category: "produzione",
    description: "Raggiungi 25 lotti consegnati alle case clienti.",
    icon: "🏭",
    rewardCash: 120_000,
    isUnlocked: (g) => g.stats.batches >= 25,
  },
  {
    id: "sterile_pioneer",
    title: "Purezza Assoluta",
    category: "produzione",
    description: "Attiva un bioreattore in suite sterile con acqua WFI e isolatore.",
    icon: "🧪",
    rewardCash: 150_000,
    isUnlocked: (g) => g.rooms.some((r) => r.type === "sterile" && r.slots.some((s) => s.item?.defId === "bioreattore")),
  },
  {
    id: "industrial_scale",
    title: "Impianto a Regime",
    category: "produzione",
    description: "Porta l'impianto GMP a livello 3 con linea di riempimento.",
    icon: "⚙️",
    rewardCash: 180_000,
    isUnlocked: (g) => g.rooms.some((r) => r.type === "plant" && r.level >= 3 && r.slots.some((s) => s.item?.defId === "riempimento")),
  },

  // Scienza
  {
    id: "first_molecule",
    title: "Primo Quaderno Aperto",
    category: "scienza",
    description: "Avvia il programma di sviluppo per una molecola proprietaria.",
    icon: "🔬",
    rewardSci: 5,
    isUnlocked: (g) => g.pipeline.length >= 1,
  },
  {
    id: "patent_holder",
    title: "Proprietà Intellettuale",
    category: "scienza",
    description: "Deposita un brevetto farmaceutico internazionale.",
    icon: "📜",
    rewardCash: 80_000,
    rewardSci: 4,
    isUnlocked: (g) => g.pipeline.some((p) => p.patented),
  },
  {
    id: "clinical_phase3",
    title: "Alla Soglia del Mercato",
    category: "scienza",
    description: "Porta una molecola fino alla Fase III di sperimentazione clinica.",
    icon: "🏥",
    rewardCash: 250_000,
    rewardSci: 6,
    isUnlocked: (g) => g.pipeline.some((p) => p.stage === "phase3" || p.stage === "dossier" || p.stage === "review" || p.stage === "approved" || p.stage === "launched"),
  },
  {
    id: "regulatory_greenlight",
    title: "Bollino d'Oro",
    category: "scienza",
    description: "Ottieni l'approvazione formale da FDA o EMA per un farmaco.",
    icon: "✅",
    rewardCash: 400_000,
    isUnlocked: (g) => g.stats.approvals >= 1,
  },

  // Finanza
  {
    id: "self_funded",
    title: "Cassa Positiva",
    category: "finanza",
    description: "Accumula oltre 10 Milioni di Euro in tesoreria.",
    icon: "💰",
    rewardCash: 100_000,
    isUnlocked: (g) => g.cash >= 10_000_000,
  },
  {
    id: "ipo_bell",
    title: "La Campanella della Borsa",
    category: "finanza",
    description: "Completa la quotazione in Borsa (IPO) di Aurelia.",
    icon: "🔔",
    rewardCash: 500_000,
    isUnlocked: (g) => (g as any).finance?.ipoDone === true,
  },
  {
    id: "credit_aaa",
    title: "Affidabilità Tripla A",
    category: "finanza",
    description: "Raggiungi il massimo rating creditizio bancario (AAA).",
    icon: "⭐",
    rewardCash: 150_000,
    isUnlocked: (g) => (g as any).finance?.creditRating === "AAA",
  },

  // Qualità & Reputazione
  {
    id: "impeccable_quality",
    title: "Eccellenza GMP",
    category: "qualita",
    description: "Raggiungi un punteggio di Qualità di sito pari a 90 o superiore.",
    icon: "🛡️",
    rewardCash: 100_000,
    isUnlocked: (g) => g.quality >= 90,
  },
  {
    id: "legendary_trust",
    title: "Partner di Riferimento",
    category: "qualita",
    description: "Porta la fiducia di almeno una casa farmaceutica a 90 o più.",
    icon: "🤝",
    rewardCash: 90_000,
    isUnlocked: (g) => g.clients.some((c) => c.trust >= 90),
  },
  {
    id: "zero_scrap_campaign",
    title: "Campagna Perfetta",
    category: "qualita",
    description: "Chiudi un contratto di scala clinica da 3 lotti con zero scarti.",
    icon: "🎯",
    rewardCash: 120_000,
    isUnlocked: (g) => g.processes.some((p) => p.tier === "premium" && p.runs >= 3 && p.scrap === 0),
  },

  // Impero & Big Pharma
  {
    id: "campus_expander",
    title: "Cittadella Farmaceutica",
    category: "impero",
    description: "Acquista tutti i 5 lotti del campus industriale.",
    icon: "🗺️",
    rewardCash: 300_000,
    isUnlocked: (g) => g.owned.length >= 5,
  },
  {
    id: "veteran_crew",
    title: "Team dei Maestri",
    category: "impero",
    description: "Avere almeno 3 membri dello staff con abilità massima (6).",
    icon: "🎖️",
    rewardCash: 150_000,
    isUnlocked: (g) => g.staff.filter((s) => s.skill >= 6).length >= 3,
  },
  {
    id: "market_blockbuster",
    title: "Farmaco Blockbuster",
    category: "impero",
    description: "Porta la tua quota di mercato di un farmaco proprio oltre il 30%.",
    icon: "💊",
    rewardCash: 500_000,
    isUnlocked: (g) => g.playerShare >= 30,
  },
  {
    id: "big_pharma_titan",
    title: "Titano Big Pharma",
    category: "impero",
    description: "Raggiungi una valutazione d'impresa superiore a 350 Milioni di Euro.",
    icon: "👑",
    rewardCash: 1_000_000,
    isUnlocked: (g) => ((g as any).stats?.highestValuation ?? 0) >= 350_000_000,
  },
];
