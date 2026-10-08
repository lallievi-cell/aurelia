export const COLS = 8;
export const ROWS = 8;

export type Focus = "sintesi" | "biologici";
export type Role = "scientist" | "operator" | "qa" | "clinical" | "regulatory" | "commercial";
export type Kind =
  | "hq"
  | "warehouse"
  | "pilot"
  | "plant"
  | "sterile"
  | "qc"
  | "lab"
  | "clinical"
  | "regulatory"
  | "cold"
  | "pack"
  | "utility";
export type Tone = "good" | "bad" | "info";
export type Stage =
  | "discovery"
  | "lead"
  | "preclinical"
  | "patent"
  | "phase1"
  | "phase2"
  | "phase3"
  | "dossier"
  | "review"
  | "approved"
  | "launched"
  | "licensed"
  | "failed";
export type Ground = "lot" | "garden" | "road" | "water";
export type Tier = "pilota" | "standard" | "premium";
export type Era = "early" | "mid" | "late" | "oltre";
export type TechId =
  | "gmp"
  | "acquisti"
  | "formazione"
  | "ritmo"
  | "asettico"
  | "analitica"
  | "brevetti"
  | "scaleup"
  | "clinica"
  | "freddo"
  | "confezioni"
  | "energia"
  | "affari"
  | "fase3"
  | "globo"
  | "biosimilari"
  | "continuo"
  | "licenze"
  | "piattaforma";

export type Building = { id: string; kind: Kind; level: number; c: number; r: number; halt: number };
export type Cell = { blocked: boolean; ground: Ground; building: Building | null };
export type Staff = {
  id: string;
  name: string;
  role: Role;
  skill: number;
  salary: number;
  buildingId: string | null;
};
export type Offer = {
  id: string;
  client: string;
  title: string;
  kind: "sintesi" | "biologici";
  tier: Tier;
  batches: number;
  pay: number;
  apiEach: number;
  quality: number;
  expires: number;
};
export type Job = Offer & { status: "queued" | "active" | "done" | "failed"; done: number; lineId: string | null };
export type Program = {
  id: string;
  code: string;
  indication: string;
  stage: Stage;
  progress: number;
  waiting: boolean;
  reviewLeft: number;
  authority: string | null;
  patented: boolean;
};
export type Product = {
  id: string;
  code: string;
  indication: string;
  price: number;
  patented: boolean;
  patentLeft: number;
};
export type Rival = { id: string; name: string; share: number; note: string };
export type LogItem = { week: number; text: string; tone: Tone };
export type MarketMod = { label: string; apiMul: number; demandAdd: number; until: number } | null;
export type Stock = { solvent: number; eccipient: number; vials: number };

export type Game = {
  v: 2;
  name: string;
  focus: Focus;
  week: number;
  cash: number;
  reputation: number;
  quality: number;
  seq: number;
  cells: Cell[][];
  staff: Staff[];
  candidates: Staff[];
  api: number;
  stock: Stock;
  science: number;
  tech: TechId[];
  autoBuy: boolean;
  offers: Offer[];
  jobs: Job[];
  pipeline: Program[];
  products: Product[];
  rivals: Rival[];
  log: LogItem[];
  chapter: string;
  goals: string[];
  market: { apiPrice: number; demand: number };
  mod: MarketMod;
  playerShare: number;
  refinanced: boolean;
  nextEvent: number;
  stats: { batches: number; revenue: number; approvals: number; launches: number; licenses: number };
  history: number[];
};

export type CatalogItem = {
  kind: Kind;
  name: string;
  blurb: string;
  cost: number;
  upkeep: number;
  role: Role | null;
  roleLabel: string;
};

export type TechDef = {
  id: TechId;
  era: Era;
  name: string;
  blurb: string;
  cash: number;
  sci: number;
  need: TechId[];
};

export const ROLE_LABEL: Record<Role, string> = {
  scientist: "Scienza",
  operator: "Produzione",
  qa: "Qualità",
  clinical: "Clinica",
  regulatory: "Regolatorio",
  commercial: "Commerciale",
};

export const CATALOG: CatalogItem[] = [
  { kind: "warehouse", name: "Magazzino", blurb: "Principi attivi, solventi, eccipienti.", cost: 180_000, upkeep: 6_000, role: null, roleLabel: "" },
  { kind: "pilot", name: "Impianto pilota", blurb: "Prima linea. Solo lotti piccoli, più lenta.", cost: 260_000, upkeep: 11_000, role: "operator", roleLabel: "Operatori" },
  { kind: "plant", name: "Impianto", blurb: "Piccole molecole a regime. Serve un operatore.", cost: 640_000, upkeep: 28_000, role: "operator", roleLabel: "Operatori" },
  { kind: "qc", name: "Controllo qualità", blurb: "Abbassa i lotti falliti e regge le ispezioni.", cost: 240_000, upkeep: 9_000, role: "qa", roleLabel: "Analisti" },
  { kind: "lab", name: "Laboratorio", blurb: "Genera scienza e fa avanzare le tue molecole.", cost: 340_000, upkeep: 13_000, role: "scientist", roleLabel: "Scienziati" },
  { kind: "utility", name: "Centralina", blurb: "Taglia i costi fissi di tutto il campus.", cost: 150_000, upkeep: 4_000, role: null, roleLabel: "" },
  { kind: "pack", name: "Confezionamento", blurb: "Alza il prezzo dei lotti e delle vendite. Non serve personale.", cost: 220_000, upkeep: 8_000, role: null, roleLabel: "" },
  { kind: "cold", name: "Cella frigo", blurb: "Senza freddo i biologici falliscono più spesso.", cost: 230_000, upkeep: 9_000, role: null, roleLabel: "" },
  { kind: "sterile", name: "Suite sterile", blurb: "Biologici. Contratti ricchi, qualità esigente.", cost: 980_000, upkeep: 42_000, role: "operator", roleLabel: "Operatori" },
  { kind: "clinical", name: "Unità clinica", blurb: "Fasi I, II e III. Si sblocca con la tecnica.", cost: 540_000, upkeep: 18_000, role: "clinical", roleLabel: "Clinici" },
  { kind: "regulatory", name: "Affari regolatori", blurb: "Brevetti, dossier, AIFA, EMA, FDA.", cost: 300_000, upkeep: 11_000, role: "regulatory", roleLabel: "Regolatori" },
  { kind: "hq", name: "Direzione", blurb: "I commerciali alzano il prezzo dei contratti.", cost: 0, upkeep: 14_000, role: "commercial", roleLabel: "Commerciali" },
];

const GATE: Partial<Record<Kind, TechId>> = {
  sterile: "asettico",
  cold: "freddo",
  pack: "confezioni",
  utility: "energia",
  clinical: "clinica",
  regulatory: "affari",
};

export const TECH: TechDef[] = [
  { id: "gmp", era: "early", name: "GMP di base", blurb: "La qualità sale e i primi lotti reggono.", cash: 28_000, sci: 5, need: [] },
  { id: "acquisti", era: "early", name: "Ufficio acquisti", blurb: "Il principio attivo costa meno.", cash: 32_000, sci: 5, need: [] },
  { id: "formazione", era: "early", name: "Formazione", blurb: "Puoi far crescere l'abilità delle persone.", cash: 24_000, sci: 4, need: [] },
  { id: "ritmo", era: "early", name: "Ritmo di linea", blurb: "L'impianto pilota consegna più spesso.", cash: 40_000, sci: 6, need: ["gmp"] },
  { id: "asettico", era: "early", name: "Processo asettico", blurb: "Sblocca la suite sterile.", cash: 70_000, sci: 8, need: ["gmp"] },
  { id: "energia", era: "early", name: "Utilities", blurb: "Sblocca la centralina e taglia i fissi.", cash: 36_000, sci: 5, need: [] },
  { id: "analitica", era: "mid", name: "Analitica", blurb: "Meno fuori specifica. Serve per lo scale-up.", cash: 90_000, sci: 12, need: ["gmp"] },
  { id: "brevetti", era: "mid", name: "Ufficio brevetti", blurb: "Depositare costa meno. Apre le licenze.", cash: 80_000, sci: 10, need: [] },
  { id: "scaleup", era: "mid", name: "Scale-up", blurb: "Gli edifici salgono fino al livello 4.", cash: 140_000, sci: 14, need: ["analitica"] },
  { id: "freddo", era: "mid", name: "Catena del freddo", blurb: "Sblocca la cella frigo per i biologici.", cash: 110_000, sci: 12, need: ["asettico"] },
  { id: "confezioni", era: "mid", name: "Packaging", blurb: "Sblocca il confezionamento.", cash: 75_000, sci: 8, need: [] },
  { id: "clinica", era: "mid", name: "Sviluppo clinico", blurb: "Sblocca l'unità e abbassa il rischio di fase.", cash: 160_000, sci: 16, need: ["brevetti"] },
  { id: "affari", era: "late", name: "Affari regolatori", blurb: "Sblocca l'ufficio e accorcia le revisioni.", cash: 180_000, sci: 18, need: ["clinica"] },
  { id: "fase3", era: "late", name: "Fase III robusta", blurb: "La fase più cara fallisce meno.", cash: 240_000, sci: 22, need: ["clinica"] },
  { id: "biosimilari", era: "late", name: "Piattaforma bio", blurb: "I contratti sterili pagano di più.", cash: 200_000, sci: 18, need: ["asettico", "analitica"] },
  { id: "licenze", era: "late", name: "Licensing", blurb: "Puoi cedere una molecola brevettata.", cash: 120_000, sci: 14, need: ["brevetti"] },
  { id: "globo", era: "oltre", name: "Lancio globale", blurb: "Il tetto di quota di mercato sale.", cash: 320_000, sci: 26, need: ["fase3"] },
  { id: "continuo", era: "oltre", name: "Processo continuo", blurb: "L'impianto a volte consegna un lotto extra.", cash: 380_000, sci: 28, need: ["scaleup", "ritmo"] },
  { id: "piattaforma", era: "oltre", name: "Piattaforma", blurb: "Il secondo farmaco non si mangia il primo.", cash: 420_000, sci: 30, need: ["globo"] },
];

export const ERA_LABEL: Record<Era, string> = {
  early: "Inizio",
  mid: "Crescita",
  late: "Espansione",
  oltre: "Oltre",
};

export const INDICATIONS = ["Infezioni", "Oncologia", "Metabolico", "Malattie rare", "Immunologia", "Cardiologia", "Neurologia", "Respiratorio"];

export const AUTHORITIES = [
  { id: "aifa", name: "AIFA", weeks: 6, strict: 0.18 },
  { id: "ema", name: "EMA", weeks: 10, strict: 0.26 },
  { id: "fda", name: "FDA", weeks: 12, strict: 0.32 },
];

export const STAGE_NEED: Partial<Record<Stage, number>> = {
  discovery: 4,
  lead: 5,
  preclinical: 6,
  phase1: 5,
  phase2: 7,
  phase3: 9,
  dossier: 4,
};

export const STAGE_LABEL: Record<Stage, string> = {
  discovery: "Scoperta",
  lead: "Lead",
  preclinical: "Preclinica",
  patent: "Brevetto",
  phase1: "Fase I",
  phase2: "Fase II",
  phase3: "Fase III",
  dossier: "Dossier",
  review: "Revisione",
  approved: "Approvato",
  launched: "In commercio",
  licensed: "In licenza",
  failed: "Fermato",
};

export const NEXT_STAGE: Partial<Record<Stage, { stage: Stage; cost: number; label: string }>> = {
  discovery: { stage: "lead", cost: 90_000, label: "Passa al lead" },
  lead: { stage: "preclinical", cost: 160_000, label: "Avvia la preclinica" },
  preclinical: { stage: "patent", cost: 0, label: "Pronto per il brevetto" },
  patent: { stage: "phase1", cost: 280_000, label: "Deposita il brevetto" },
  phase1: { stage: "phase2", cost: 420_000, label: "Apri la fase II" },
  phase2: { stage: "phase3", cost: 780_000, label: "Apri la fase III" },
  phase3: { stage: "dossier", cost: 220_000, label: "Scrivi il dossier" },
  dossier: { stage: "review", cost: 160_000, label: "Scegli l'autorità" },
};

export const CHAPTER_BLURB: Record<string, string> = {
  Fondazione: "Magazzino, pilota, un operatore. I lotti piccoli pagano gli stipendi.",
  Officina: "La qualità e un secondo turno rendono la CDMO credibile.",
  CDMO: "I contratti grossi finanziano il laboratorio tuo.",
  Ricerca: "La pipeline costa. I clienti tengono accese le luci.",
  Clinica: "Fasi lunghe. Un brevetto si può anche cedere.",
  "Big Pharma": "Il farmaco vende. Difendi quota, prezzo e brevetto.",
  Piattaforma: "Più di un prodotto. Il campus lavora per te, non solo per gli altri.",
};

const FIRST = ["Giulia", "Marco", "Lea", "Davide", "Noor", "Chiara", "Andrea", "Sara", "Luca", "Marta", "Elena", "Pietro", "Amina", "Rosa", "Ivan"];
const LAST = ["Riva", "Conti", "Greco", "Ferrari", "Sala", "Costa", "Marini", "Gallo", "Leone", "Vitale"];
const CLIENTS = ["Lumen", "Oster & Vale", "Marrow", "Siena Labs", "Quill", "Nordlicht", "Petra Bio", "Ilex", "Monteluce", "Casa Verde", "Nara", "Belmonte"];

const MAT_PRICE = { solvent: 2200, eccipient: 1600, vials: 3800 };

export function catalog(kind: Kind) {
  return CATALOG.find((item) => item.kind === kind)!;
}

export function euro(n: number) {
  const sign = n < 0 ? "−" : "";
  const v = Math.abs(Math.round(n));
  if (v >= 1_000_000) return `${sign}${(v / 1_000_000).toFixed(2).replace(".", ",")} M€`;
  if (v >= 10_000) return `${sign}${Math.round(v / 1000)} mila €`;
  return `${sign}${v.toLocaleString("it-IT")} €`;
}

export function roll(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export function yearOf(week: number) {
  return Math.floor((Math.max(1, week) - 1) / 52) + 1;
}

export function hasTech(g: Game, id: TechId) {
  return g.tech.includes(id);
}

export function levelCap(g: Game) {
  return hasTech(g, "scaleup") ? 4 : 3;
}

export function shareCap(g: Game) {
  return hasTech(g, "globo") ? 52 : hasTech(g, "piattaforma") ? 58 : 34;
}

function nid(g: Game, prefix: string) {
  g.seq += 1;
  return `${prefix}${g.seq}`;
}

function person(g: Game, role: Role, skill: number): Staff {
  const salaryBase: Record<Role, number> = {
    scientist: 9000,
    operator: 6000,
    qa: 7000,
    clinical: 8500,
    regulatory: 8000,
    commercial: 7500,
  };
  return {
    id: nid(g, "p"),
    name: `${FIRST[Math.floor(roll(g.seq + 3) * FIRST.length)]} ${LAST[Math.floor(roll(g.seq + 9) * LAST.length)]}`,
    role,
    skill,
    salary: Math.round(salaryBase[role] * (0.82 + skill * 0.08)),
    buildingId: null,
  };
}

export function capacityApi(g: Game) {
  const warehouses = allBuildings(g).filter((b) => b.kind === "warehouse");
  return Math.max(24, warehouses.reduce((sum, b) => sum + b.level * 70, 0));
}

export function capacityDry(g: Game) {
  const warehouses = allBuildings(g).filter((b) => b.kind === "warehouse");
  return Math.max(16, warehouses.reduce((sum, b) => sum + b.level * 40, 0));
}

export function capacityVials(g: Game) {
  const cold = allBuildings(g).filter((b) => b.kind === "cold").reduce((sum, b) => sum + b.level, 0);
  return 8 + cold * 36;
}

export function allBuildings(g: Game) {
  const list: Building[] = [];
  for (const row of g.cells) for (const cell of row) if (cell.building) list.push(cell.building);
  return list;
}

export function buildingById(g: Game, id: string | null) {
  if (!id) return null;
  return allBuildings(g).find((b) => b.id === id) ?? null;
}

export function staffIn(g: Game, buildingId: string, role?: Role) {
  return g.staff.filter((s) => s.buildingId === buildingId && (!role || s.role === role));
}

function paint(c: number, r: number): Ground {
  if (c >= 2 && c <= 3 && r >= 2 && r <= 3) return "garden";
  if (c === 7 && r >= 5) return "water";
  if (r === 0 && c >= 2 && c <= 5) return "road";
  if (r === 4 && c <= 6) return "road";
  if (c === 4 && r >= 1 && r <= 6) return "road";
  return "lot";
}

function emptyCell(c: number, r: number, fresh: boolean, prev?: { blocked?: boolean; building?: Building | null }): Cell {
  if (prev?.building) {
    return { blocked: false, ground: "lot", building: { ...prev.building, c, r, halt: prev.building.halt ?? 0 } };
  }
  if (prev && !fresh) {
    const ground: Ground = prev.blocked ? "garden" : "lot";
    return { blocked: ground !== "lot", ground, building: null };
  }
  const ground = paint(c, r);
  return { blocked: ground !== "lot", ground, building: null };
}

function layCampus(g: Game, fresh: boolean, prev: { blocked?: boolean; building?: Building | null }[][]) {
  const cells: Cell[][] = [];
  for (let r = 0; r < ROWS; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < COLS; c++) row.push(emptyCell(c, r, fresh, prev[r]?.[c]));
    cells.push(row);
  }
  g.cells = cells;
}

export function newGame(name: string, focus: Focus): Game {
  const g: Game = {
    v: 2,
    name: name.trim().slice(0, 22) || "Aurelia",
    focus,
    week: 1,
    cash: 2_400_000,
    reputation: 46,
    quality: 44,
    seq: 1,
    cells: [],
    staff: [],
    candidates: [],
    api: 14,
    stock: { solvent: 10, eccipient: 10, vials: 4 },
    science: 2,
    tech: focus === "biologici" ? ["gmp", "asettico"] : [],
    autoBuy: true,
    offers: [],
    jobs: [],
    pipeline: [],
    products: [],
    rivals: [
      { id: "helix", name: "Helix Nord", share: 31, note: "Conto terzi nel Nord Europa. Prezzi stabili." },
      { id: "vanta", name: "Vanta Bio", share: 27, note: "Biologici. Ti soffia i clienti sterili." },
      { id: "kite", name: "Kite & Morrow", share: 24, note: "Big lenta, piena di brevetti in scadenza." },
    ],
    log: [],
    chapter: "Fondazione",
    goals: [],
    market: { apiPrice: 7800, demand: 40 },
    mod: null,
    playerShare: 0,
    refinanced: false,
    nextEvent: 8,
    stats: { batches: 0, revenue: 0, approvals: 0, launches: 0, licenses: 0 },
    history: [2_400_000],
  };
  layCampus(g, true, []);
  g.cells[1]![1]!.building = { id: "hq", kind: "hq", level: 1, c: 1, r: 1, halt: 0 };
  g.cells[1]![1]!.blocked = false;
  g.cells[1]![1]!.ground = "lot";
  g.staff.push(person(g, "scientist", 3), person(g, "operator", 3));
  g.candidates.push(person(g, "qa", 3), person(g, "operator", 4), person(g, "commercial", 2));
  pushLog(g, `${g.name} apre il campus. Prima il magazzino e una linea pilota, poi i clienti.`, "info");
  refreshOffers(g, true);
  return g;
}

export function normalize(input: unknown): Game | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, any>;
  if (!raw.cells || typeof raw.name !== "string" || (raw.v !== 1 && raw.v !== 2)) return null;
  const base = newGame(raw.name, raw.focus === "biologici" ? "biologici" : "sintesi");
  const g = structuredClone(base) as Game;
  g.week = raw.week ?? 1;
  g.cash = raw.cash ?? g.cash;
  g.reputation = raw.reputation ?? g.reputation;
  g.quality = raw.quality ?? g.quality;
  g.seq = raw.seq ?? 4;
  g.staff = raw.staff ?? g.staff;
  g.candidates = raw.candidates ?? [];
  g.api = raw.api ?? g.api;
  g.autoBuy = raw.autoBuy ?? true;
  g.pipeline = raw.pipeline ?? [];
  g.products = raw.products ?? [];
  g.rivals = raw.rivals?.length ? raw.rivals : g.rivals;
  g.log = raw.log ?? [];
  g.chapter = raw.chapter ?? "Fondazione";
  g.goals = raw.goals ?? [];
  g.market = raw.market ?? g.market;
  g.mod = raw.mod ?? null;
  g.playerShare = raw.playerShare ?? 0;
  g.refinanced = raw.refinanced ?? false;
  g.nextEvent = raw.nextEvent ?? g.week + 6;
  g.history = raw.history?.length ? raw.history : [g.cash];
  g.science = raw.science ?? 2;
  g.tech = Array.isArray(raw.tech) ? raw.tech : g.focus === "biologici" ? ["gmp", "asettico"] : [];
  g.stock = {
    solvent: raw.stock?.solvent ?? 8,
    eccipient: raw.stock?.eccipient ?? 8,
    vials: raw.stock?.vials ?? 4,
  };
  g.stats = {
    batches: raw.stats?.batches ?? 0,
    revenue: raw.stats?.revenue ?? 0,
    approvals: raw.stats?.approvals ?? 0,
    launches: raw.stats?.launches ?? 0,
    licenses: raw.stats?.licenses ?? 0,
  };
  layCampus(g, false, raw.cells);
  const tierOf = (kind: string, title: string): Tier => {
    if (kind === "biologici") return "premium";
    if (/pilot|piccol|Piccol/i.test(title)) return "pilota";
    return "standard";
  };
  g.offers = ((raw.offers ?? []) as Offer[]).map((o) => ({ ...o, tier: o.tier ?? tierOf(o.kind, o.title) }));
  g.jobs = ((raw.jobs ?? []) as Job[]).map((j) => ({ ...j, tier: j.tier ?? tierOf(j.kind, j.title) }));
  g.v = 2;
  refreshChapter(g);
  return g;
}

export function pushLog(g: Game, text: string, tone: Tone) {
  g.log.unshift({ week: g.week, text, tone });
  if (g.log.length > 48) g.log.length = 48;
}

export function apiPrice(g: Game) {
  const mul = (g.mod ? g.mod.apiMul : 1) * (hasTech(g, "acquisti") ? 0.88 : 1);
  return Math.round(g.market.apiPrice * mul);
}

export function matPrice(g: Game, key: keyof Stock) {
  const mul = g.mod ? g.mod.apiMul : 1;
  return Math.round(MAT_PRICE[key] * (key === "vials" ? 1 : mul));
}

export function demandOf(g: Game) {
  return g.market.demand + (g.mod ? g.mod.demandAdd : 0);
}

function refreshOffers(g: Game, force: boolean) {
  g.offers = g.offers.filter((o) => o.expires >= g.week);
  if (!force && g.week % 3 !== 1 && g.offers.length >= 3) return;
  let guard = 0;
  while (g.offers.length < 4 && guard < 6) {
    guard += 1;
    const rollA = roll(g.week * 17 + g.seq + g.offers.length * 3);
    const canBio = hasTech(g, "asettico") || allBuildings(g).some((b) => b.kind === "sterile") || g.focus === "biologici";
    const bio = canBio && rollA > (g.focus === "biologici" ? 0.42 : 0.78);
    let tier: Tier = "standard";
    if (bio) tier = "premium";
    else if (rollA < 0.5 || g.reputation < 58) tier = roll(g.seq + g.offers.length) < 0.62 ? "pilota" : "standard";
    else if (g.reputation >= 62 && roll(g.seq + 2) > 0.55) tier = "premium";
    const batches = tier === "pilota" ? 2 : 2 + Math.floor(roll(g.seq + 4 + g.offers.length) * (tier === "premium" ? 3 : 2));
    const apiEach = bio ? 3 : tier === "pilota" ? 1 : 2;
    const client = CLIENTS[Math.floor(roll(g.seq + 11 + g.week + guard) * CLIENTS.length)]!;
    const payEach = bio ? 250_000 : tier === "pilota" ? 145_000 : tier === "premium" ? 210_000 : 165_000;
    const quality = tier === "pilota" ? 44 + Math.floor(roll(g.seq) * 8) : tier === "premium" ? 64 + Math.floor(roll(g.seq) * 10) : 54 + Math.floor(roll(g.seq) * 10);
    g.offers.push({
      id: nid(g, "o"),
      client,
      title: bio ? `Sterile ${client}` : tier === "pilota" ? `Pilota ${client}` : tier === "premium" ? `Scala ${client}` : `Sintesi ${client}`,
      kind: bio ? "biologici" : "sintesi",
      tier,
      batches,
      pay: batches * payEach,
      apiEach,
      quality,
      expires: g.week + (tier === "pilota" ? 5 : 7),
    });
  }
}

export function buildCost(g: Game, kind: Kind) {
  const base = catalog(kind).cost;
  if (kind === "sterile" && g.focus === "biologici") return Math.round(base * 0.85);
  if (kind === "plant" && g.focus === "sintesi") return Math.round(base * 0.9);
  if (kind === "pilot" && g.week < 20) return Math.round(base * 0.92);
  return base;
}

export function canBuild(g: Game, kind: Kind, c: number, r: number) {
  const cell = g.cells[r]?.[c];
  if (!cell || cell.blocked || cell.building) return "Lotto non libero.";
  if (kind === "hq") return "La direzione c'è già.";
  const gate = GATE[kind];
  if (gate && !hasTech(g, gate)) {
    const tech = TECH.find((t) => t.id === gate)!;
    return `Prima la tecnica «${tech.name}».`;
  }
  if (g.cash < buildCost(g, kind)) return "Cassa insufficiente.";
  return null;
}

export function place(g: Game, kind: Kind, c: number, r: number) {
  const err = canBuild(g, kind, c, r);
  if (err) return err;
  const next = structuredClone(g) as Game;
  next.cash -= buildCost(next, kind);
  next.seq += 1;
  next.cells[r]![c]!.building = { id: `b${next.seq}`, kind, level: 1, c, r, halt: 0 };
  pushLog(next, `${catalog(kind).name} è in piedi.`, "good");
  markGoals(next);
  refreshChapter(next);
  return next;
}

export function upgradeCost(b: Building) {
  return Math.round(catalog(b.kind).cost * 0.55 * b.level) || 80_000;
}

export function upgrade(g: Game, id: string) {
  const next = structuredClone(g) as Game;
  const b = allBuildings(next).find((item) => item.id === id);
  if (!b || b.kind === "hq") return g;
  if (b.level >= levelCap(next)) return g;
  const cost = upgradeCost(b);
  if (next.cash < cost) return g;
  next.cash -= cost;
  b.level += 1;
  pushLog(next, `${catalog(b.kind).name} sale a livello ${b.level}.`, "good");
  return next;
}

export function hire(g: Game, id: string) {
  const next = structuredClone(g) as Game;
  const idx = next.candidates.findIndex((c) => c.id === id);
  if (idx < 0) return g;
  const fee = 12_000;
  if (next.cash < fee) return g;
  const hired = next.candidates.splice(idx, 1)[0]!;
  next.cash -= fee;
  next.staff.push(hired);
  pushLog(next, `${hired.name} entra in ${next.name}.`, "good");
  return next;
}

export function dismiss(g: Game, id: string) {
  const next = structuredClone(g) as Game;
  const gone = next.staff.find((s) => s.id === id);
  if (!gone) return g;
  next.staff = next.staff.filter((s) => s.id !== id);
  next.cash -= Math.round(gone.salary * 2);
  pushLog(next, `${gone.name} lascia l'azienda. Liquidazione ${euro(gone.salary * 2)}.`, "info");
  return next;
}

export function assign(g: Game, staffId: string, buildingId: string | null) {
  const next = structuredClone(g) as Game;
  const member = next.staff.find((s) => s.id === staffId);
  const building = buildingById(next, buildingId);
  if (!member) return g;
  if (building) {
    const item = catalog(building.kind);
    if (!item.role || item.role !== member.role) return g;
    const used = staffIn(next, building.id).filter((s) => s.id !== member.id).length;
    const slots = building.level + (building.kind === "hq" ? 2 : 1);
    if (used >= slots) return g;
  }
  member.buildingId = buildingId;
  markGoals(next);
  return next;
}

export function train(g: Game, id: string) {
  const next = structuredClone(g) as Game;
  if (!hasTech(next, "formazione")) return "Prima la tecnica Formazione.";
  const member = next.staff.find((s) => s.id === id);
  if (!member) return g;
  if (member.skill >= 6) return "È già al massimo.";
  const cost = 18_000 + member.skill * 8_000;
  if (next.cash < cost) return "Cassa insufficiente.";
  next.cash -= cost;
  member.skill += 1;
  member.salary = Math.round(member.salary * 1.08);
  pushLog(next, `${member.name} sale ad abilità ${member.skill}.`, "good");
  return next;
}

export function buyTech(g: Game, id: TechId) {
  const next = structuredClone(g) as Game;
  const tech = TECH.find((t) => t.id === id);
  if (!tech || hasTech(next, id)) return g;
  if (tech.need.some((n) => !hasTech(next, n))) return "Manca una tecnica precedente.";
  if (next.science < tech.sci) return "Scienza insufficiente.";
  if (next.cash < tech.cash) return "Cassa insufficiente.";
  next.science -= tech.sci;
  next.cash -= tech.cash;
  next.tech.push(id);
  if (id === "gmp") next.quality = clamp(next.quality + 6, 0, 100);
  pushLog(next, `Tecnica sbloccata: ${tech.name}.`, "good");
  markGoals(next);
  return next;
}

export function acceptOffer(g: Game, id: string) {
  const next = structuredClone(g) as Game;
  const idx = next.offers.findIndex((o) => o.id === id);
  if (idx < 0) return g;
  const offer = next.offers.splice(idx, 1)[0]!;
  next.jobs.push({ ...offer, status: "queued", done: 0, lineId: null });
  pushLog(next, `Contratto ${offer.client}: ${offer.batches} lotti, ${euro(offer.pay)}.`, "info");
  const needs = offer.kind === "biologici" ? "sterile" : offer.tier === "pilota" ? "pilot" : "plant";
  const ok = allBuildings(next).some((b) => (needs === "pilot" ? b.kind === "pilot" || b.kind === "plant" : b.kind === needs));
  if (!ok) pushLog(next, needs === "sterile" ? "Serve una suite sterile." : needs === "pilot" ? "Serve un pilota o un impianto." : "Serve un impianto vero, non solo il pilota.", "bad");
  markGoals(next);
  return next;
}

function roomFor(g: Game, key: "api" | keyof Stock) {
  if (key === "api") return capacityApi(g) - g.api;
  return (key === "vials" ? capacityVials(g) : capacityDry(g)) - g.stock[key];
}

export function orderApi(g: Game, units: number) {
  return orderMat(g, "api", units);
}

export function orderMat(g: Game, key: "api" | keyof Stock, units: number) {
  const next = structuredClone(g) as Game;
  const n = Math.max(0, Math.min(units, roomFor(next, key)));
  const price = key === "api" ? apiPrice(next) : matPrice(next, key);
  const cost = n * price;
  if (n <= 0 || next.cash < cost) return g;
  next.cash -= cost;
  if (key === "api") next.api += n;
  else next.stock[key] += n;
  const label = key === "api" ? "principio attivo" : key === "solvent" ? "solvente" : key === "eccipient" ? "eccipiente" : "flaconi";
  pushLog(next, `Ordine di ${n} ${label}.`, "info");
  return next;
}

export function setAutoBuy(g: Game, on: boolean) {
  const next = structuredClone(g) as Game;
  next.autoBuy = on;
  return next;
}

export function startProgram(g: Game, indication: string) {
  const next = structuredClone(g) as Game;
  const active = next.pipeline.filter((p) => !["failed", "launched", "licensed"].includes(p.stage)).length;
  const slots = 1 + (hasTech(next, "piattaforma") ? 1 : 0) + (allBuildings(next).filter((b) => b.kind === "lab").length > 1 ? 1 : 0);
  const lab = allBuildings(next).some((b) => b.kind === "lab");
  const scientists = next.staff.some((s) => s.role === "scientist" && buildingById(next, s.buildingId)?.kind === "lab");
  if (!lab || !scientists) return "Metti uno scienziato nel laboratorio.";
  if (active >= slots) return "La pipeline è piena.";
  if (next.cash < 70_000) return "Cassa insufficiente.";
  next.cash -= 70_000;
  const code = `AUR-${140 + next.pipeline.length}`;
  next.pipeline.push({
    id: nid(next, "r"),
    code,
    indication,
    stage: "discovery",
    progress: 0,
    waiting: false,
    reviewLeft: 0,
    authority: null,
    patented: false,
  });
  pushLog(next, `${code} parte in ${indication}.`, "good");
  markGoals(next);
  refreshChapter(next);
  return next;
}

export function advanceProgram(g: Game, id: string, authorityId?: string) {
  const next = structuredClone(g) as Game;
  const program = next.pipeline.find((p) => p.id === id);
  if (!program || !program.waiting || program.stage === "failed") return g;
  const step = NEXT_STAGE[program.stage];
  if (!step) return g;
  let cost = step.cost;
  if (program.stage === "patent" && hasTech(next, "brevetti")) cost = Math.round(cost * 0.72);
  if (program.stage === "dossier") {
    const authority = AUTHORITIES.find((a) => a.id === authorityId) ?? AUTHORITIES[0]!;
    if (next.cash < cost) return g;
    if (!allBuildings(next).some((b) => b.kind === "regulatory")) {
      pushLog(next, "Serve l'ufficio affari regolatori, e la tecnica per costruirlo.", "bad");
      return next;
    }
    next.cash -= cost;
    program.stage = "review";
    program.waiting = false;
    program.progress = 0;
    program.authority = authority.name;
    const reg = next.staff.some((s) => s.role === "regulatory" && buildingById(next, s.buildingId)?.kind === "regulatory");
    const cut = (reg ? 2 : 0) + (hasTech(next, "affari") ? 2 : 0);
    program.reviewLeft = Math.max(3, authority.weeks - cut);
    pushLog(next, `${program.code} è in revisione da ${authority.name}.`, "info");
    refreshChapter(next);
    return next;
  }
  if (program.stage === "patent") {
    if (!hasTech(next, "clinica") || !allBuildings(next).some((b) => b.kind === "clinical")) {
      pushLog(next, "Il brevetto può aspettare: prima tecnica clinica e unità clinica.", "bad");
      return next;
    }
  }
  if (next.cash < cost) return g;
  const risky = program.stage === "phase1" || program.stage === "phase2" || program.stage === "phase3";
  const baseRisk = program.stage === "phase1" ? 0.1 : program.stage === "phase2" ? 0.2 : program.stage === "phase3" ? 0.28 : 0;
  const skill = avgSkill(next, risky ? "clinical" : "scientist");
  let chance = baseRisk - skill * 0.035 - next.quality / 420;
  if (hasTech(next, "clinica")) chance -= 0.04;
  if (program.stage === "phase3" && hasTech(next, "fase3")) chance -= 0.08;
  if (risky && roll(next.week * 3 + next.seq) < chance) {
    next.cash -= Math.round(cost * 0.35);
    program.stage = "failed";
    program.waiting = false;
    next.reputation = clamp(next.reputation - 4, 0, 100);
    pushLog(next, `${program.code} si ferma in ${STAGE_LABEL[step.stage]}. I dati non reggono.`, "bad");
    return next;
  }
  next.cash -= cost;
  if (program.stage === "patent") program.patented = true;
  program.stage = step.stage;
  program.waiting = step.stage === "patent";
  program.progress = 0;
  pushLog(next, `${program.code}: ${STAGE_LABEL[program.stage]}.`, "good");
  markGoals(next);
  refreshChapter(next);
  return next;
}

export function licenseOut(g: Game, id: string) {
  const next = structuredClone(g) as Game;
  if (!hasTech(next, "licenze")) return "Prima la tecnica Licensing.";
  const program = next.pipeline.find((p) => p.id === id);
  if (!program || !program.patented) return "Si cede solo una molecola già brevettata.";
  if (["failed", "launched", "licensed", "approved"].includes(program.stage)) return g;
  const bonus = program.stage === "phase3" ? 700_000 : program.stage === "phase2" ? 380_000 : program.stage === "phase1" ? 180_000 : 0;
  const pay = 420_000 + bonus;
  program.stage = "licensed";
  program.waiting = false;
  next.cash += pay;
  next.reputation = clamp(next.reputation + 3, 0, 100);
  next.stats.licenses += 1;
  next.stats.revenue += pay;
  pushLog(next, `${program.code} ceduta in licenza per ${euro(pay)}.`, "good");
  markGoals(next);
  refreshChapter(next);
  return next;
}

export function launchProduct(g: Game, id: string) {
  const next = structuredClone(g) as Game;
  const program = next.pipeline.find((p) => p.id === id);
  if (!program || program.stage !== "approved") return g;
  program.stage = "launched";
  next.products.push({
    id: nid(next, "d"),
    code: program.code,
    indication: program.indication,
    price: 100,
    patented: program.patented,
    patentLeft: program.patented ? 48 : 0,
  });
  const bump = hasTech(next, "globo") ? 10 : 7;
  next.playerShare = clamp(next.playerShare + bump, 0, shareCap(next));
  takeShare(next, bump);
  next.stats.launches += 1;
  pushLog(next, `${program.code} entra in commercio.`, "good");
  markGoals(next);
  refreshChapter(next);
  return next;
}

export function setPrice(g: Game, id: string, price: number) {
  const next = structuredClone(g) as Game;
  const product = next.products.find((p) => p.id === id);
  if (!product) return g;
  product.price = clamp(Math.round(price), 70, 160);
  return next;
}

export function audit(g: Game) {
  const next = structuredClone(g) as Game;
  if (next.cash < 50_000) return "Cassa insufficiente.";
  if (!allBuildings(next).some((b) => b.kind === "qc")) return "Serve il controllo qualità.";
  next.cash -= 50_000;
  next.quality = clamp(next.quality + 7, 0, 100);
  pushLog(next, "Audit interno. La qualità sale.", "good");
  return next;
}

function avgSkill(g: Game, role: Role) {
  const list = g.staff.filter((s) => s.role === role && s.buildingId);
  if (!list.length) return 1;
  return list.reduce((sum, s) => sum + s.skill, 0) / list.length;
}

function takeShare(g: Game, amount: number) {
  const ranked = [...g.rivals].sort((a, b) => b.share - a.share);
  let left = amount;
  for (const rival of ranked) {
    const cut = Math.min(rival.share - 4, left);
    if (cut <= 0) continue;
    rival.share -= cut;
    left -= cut;
    if (left <= 0) break;
  }
}

function markGoals(g: Game) {
  const has = (kind: Kind) => allBuildings(g).some((b) => b.kind === kind);
  const lines = allBuildings(g).filter((b) => b.kind === "pilot" || b.kind === "plant" || b.kind === "sterile").length;
  const done = new Set(g.goals);
  const give = (id: string, text: string, cash: number) => {
    if (done.has(id)) return;
    g.goals.push(id);
    g.cash += cash;
    pushLog(g, `${text} Premio ${euro(cash)}.`, "good");
  };
  if (has("warehouse")) give("wh", "Magazzino pronto.", 35_000);
  if (lines > 0) give("line", "La prima linea esiste.", 45_000);
  if (g.staff.some((s) => s.role === "operator" && s.buildingId)) give("op", "Operatore in linea.", 25_000);
  if (g.jobs.length) give("job", "Primo contratto firmato.", 30_000);
  if (g.stats.batches > 0) give("batch", "Primo lotto consegnato.", 55_000);
  if (has("qc")) give("qc", "Il controllo qualità è aperto.", 30_000);
  if (g.tech.length) give("tech", "Prima tecnica in casa.", 20_000);
  if (lines >= 2) give("due", "Due linee accese.", 60_000);
  if (has("lab")) give("lab", "Ricerca propria aperta.", 40_000);
  if (g.pipeline.length) give("pipe", "Pipeline accesa.", 50_000);
  if (g.pipeline.some((p) => p.patented)) give("pat", "Brevetto in cassaforte.", 70_000);
  if (g.stats.licenses > 0) give("lic", "Prima licenza ceduta.", 40_000);
  if (g.stats.approvals > 0) give("ok", "Prima approvazione.", 180_000);
  if (g.stats.launches > 0) give("go", "Farmaco in commercio.", 140_000);
  if (g.stats.launches >= 2) give("duego", "Due farmaci tuoi.", 200_000);
  if (g.playerShare >= 18) give("quota", "Quota di mercato vera.", 160_000);
}

function refreshChapter(g: Game) {
  const phase = g.pipeline.some((p) => ["phase1", "phase2", "phase3", "dossier", "review", "approved"].includes(p.stage));
  if (g.stats.launches >= 2 || g.playerShare >= 22) g.chapter = "Piattaforma";
  else if (g.stats.launches > 0) g.chapter = "Big Pharma";
  else if (phase) g.chapter = "Clinica";
  else if (g.pipeline.length > 0) g.chapter = "Ricerca";
  else if (g.stats.batches >= 6) g.chapter = "CDMO";
  else if (g.stats.batches > 0) g.chapter = "Officina";
  else g.chapter = "Fondazione";
}

function lineFits(b: Building, job: Job) {
  if (b.halt > 0) return false;
  if (job.kind === "biologici") return b.kind === "sterile";
  if (job.tier === "pilota") return b.kind === "pilot" || b.kind === "plant";
  if (job.tier === "premium") return b.kind === "plant" && b.level >= 2;
  return b.kind === "plant";
}

function assignLines(g: Game) {
  for (const job of g.jobs) {
    if (job.status !== "queued") continue;
    const line = allBuildings(g).find((b) => {
      if (!lineFits(b, job)) return false;
      const ops = staffIn(g, b.id, "operator").length;
      const used = g.jobs.filter((j) => j.lineId === b.id && j.status === "active").length;
      return ops > 0 && used < Math.min(b.level, ops);
    });
    if (!line) continue;
    job.lineId = line.id;
    job.status = "active";
  }
}

function failChance(g: Game, job: Job) {
  const analyst = g.staff.some((s) => s.role === "qa" && buildingById(g, s.buildingId)?.kind === "qc");
  const qc = allBuildings(g).filter((b) => b.kind === "qc").reduce((sum, b) => sum + b.level, 0);
  const skill = avgSkill(g, "qa");
  let score = 22 + g.quality * 0.5 + (analyst ? 16 + skill * 3 : 0) + qc * 8;
  if (hasTech(g, "gmp")) score += 8;
  if (hasTech(g, "analitica")) score += 10;
  let gap = job.quality - score;
  let p = gap <= 0 ? 0.025 : Math.min(0.45, 0.05 + gap / 160);
  if (job.kind === "biologici") {
    const cold = allBuildings(g).some((b) => b.kind === "cold");
    p += cold ? -0.04 : 0.12;
    if (hasTech(g, "asettico")) p -= 0.03;
  }
  return clamp(p, 0.02, 0.5);
}

function tryFill(g: Game, key: "api" | keyof Stock, need: number) {
  const have = key === "api" ? g.api : g.stock[key];
  if (have >= need) return true;
  if (!g.autoBuy) return false;
  const missing = need - have;
  const space = roomFor(g, key);
  const price = key === "api" ? apiPrice(g) : matPrice(g, key);
  const n = Math.min(missing, space);
  if (n < missing || g.cash < n * price) return false;
  g.cash -= n * price;
  if (key === "api") g.api += n;
  else g.stock[key] += n;
  return true;
}

function produce(g: Game) {
  assignLines(g);
  const commercial = g.staff.some((s) => s.role === "commercial" && buildingById(g, s.buildingId)?.kind === "hq");
  const packed = allBuildings(g).some((b) => b.kind === "pack");
  for (const job of g.jobs) {
    if (job.status !== "active" || !job.lineId) continue;
    const line = buildingById(g, job.lineId);
    if (!line || line.halt > 0) continue;
    const solvent = job.kind === "sintesi" ? 1 : 0;
    const ecc = job.kind === "sintesi" ? 1 : 0;
    const vials = job.kind === "biologici" ? 2 : 0;
    const ok =
      tryFill(g, "api", job.apiEach) &&
      (solvent === 0 || tryFill(g, "solvent", solvent)) &&
      (ecc === 0 || tryFill(g, "eccipient", ecc)) &&
      (vials === 0 || tryFill(g, "vials", vials));
    if (!ok) {
      if (g.week % 3 === 0) pushLog(g, `${job.client} fermo: manca materiale o spazio in magazzino.`, "bad");
      continue;
    }
    if (line.kind === "pilot") {
      const pace = hasTech(g, "ritmo") ? 0.92 : 0.74;
      if (roll(g.week * 9 + job.done + line.c) > pace) continue;
    }
    g.api -= job.apiEach;
    g.stock.solvent -= solvent;
    g.stock.eccipient -= ecc;
    g.stock.vials -= vials;
    if (roll(g.week * 19 + job.done + g.seq) < failChance(g, job)) {
      g.quality = clamp(g.quality - 2, 0, 100);
      g.reputation = clamp(g.reputation - 2, 0, 100);
      pushLog(g, `Lotto ${job.client} fuori specifica.`, "bad");
      continue;
    }
    job.done += 1;
    g.stats.batches += 1;
    let slice = Math.round((job.pay / job.batches) * (commercial ? 1.08 : 1));
    if (job.kind === "biologici" && hasTech(g, "biosimilari")) slice = Math.round(slice * 1.16);
    if (packed) slice = Math.round(slice * 1.08);
    if (line.kind === "pilot") slice = Math.round(slice * 0.92);
    g.cash += slice;
    g.stats.revenue += slice;
    g.reputation = clamp(g.reputation + 0.6, 0, 100);
    g.quality = clamp(g.quality + 0.35, 0, 100);
    if (job.done >= job.batches) {
      job.status = "done";
      job.lineId = null;
      pushLog(g, `Contratto ${job.client} chiuso.`, "good");
    } else if (hasTech(g, "continuo") && line.kind === "plant" && line.level >= 2 && job.done < job.batches && roll(g.week + job.done) > 0.78 && g.api >= job.apiEach) {
      g.api -= job.apiEach;
      job.done += 1;
      g.stats.batches += 1;
      g.cash += slice;
      g.stats.revenue += slice;
      if (job.done >= job.batches) {
        job.status = "done";
        job.lineId = null;
        pushLog(g, `Contratto ${job.client} chiuso, con un lotto di processo continuo.`, "good");
      }
    }
  }
  g.jobs = g.jobs.filter((j) => j.status === "queued" || j.status === "active");
}

function research(g: Game) {
  let science = 0;
  for (const s of g.staff) {
    if (s.role !== "scientist") continue;
    const home = buildingById(g, s.buildingId);
    science += home?.kind === "lab" ? 0.45 * s.skill : 0.55;
  }
  g.science += science;
  const scientists = g.staff.filter((s) => s.role === "scientist" && buildingById(g, s.buildingId)?.kind === "lab");
  const clinicians = g.staff.filter((s) => s.role === "clinical" && buildingById(g, s.buildingId)?.kind === "clinical");
  const regulators = g.staff.filter((s) => s.role === "regulatory" && buildingById(g, s.buildingId)?.kind === "regulatory");
  for (const program of g.pipeline) {
    if (["failed", "launched", "licensed", "approved"].includes(program.stage)) continue;
    if (program.stage === "review") {
      program.reviewLeft -= 1;
      if (program.reviewLeft <= 0) {
        const authority = AUTHORITIES.find((a) => a.name === program.authority) ?? AUTHORITIES[0]!;
        const bonus = (regulators.length ? 0.12 : 0) + g.quality / 300 + (program.patented ? 0.05 : 0) + (hasTech(g, "affari") ? 0.06 : 0);
        const ok = roll(g.week * 5 + g.seq) > authority.strict - bonus;
        if (ok) {
          program.stage = "approved";
          g.stats.approvals += 1;
          g.reputation = clamp(g.reputation + 8, 0, 100);
          pushLog(g, `${authority.name} approva ${program.code}.`, "good");
        } else {
          program.stage = "dossier";
          program.waiting = true;
          program.progress = STAGE_NEED.dossier ?? 4;
          g.reputation = clamp(g.reputation - 4, 0, 100);
          pushLog(g, `${authority.name} rimanda ${program.code}. Si riparte dal dossier.`, "bad");
        }
        refreshChapter(g);
      }
      continue;
    }
    if (program.waiting || program.stage === "patent") {
      if (program.stage === "patent") program.waiting = true;
      continue;
    }
    const clinical = program.stage === "phase1" || program.stage === "phase2" || program.stage === "phase3";
    const dossier = program.stage === "dossier";
    const team = clinical ? clinicians : dossier ? regulators : scientists;
    if (!team.length) continue;
    const labs = allBuildings(g).filter((b) => b.kind === (clinical ? "clinical" : dossier ? "regulatory" : "lab"));
    const level = labs.reduce((sum, b) => sum + b.level, 0);
    const speed = 0.65 + team.reduce((sum, s) => sum + s.skill, 0) / team.length / 5 + level * 0.08;
    program.progress += speed;
    const need = STAGE_NEED[program.stage] ?? 4;
    if (program.progress >= need) {
      program.progress = need;
      program.waiting = true;
      pushLog(g, `${program.code} attende una decisione: ${STAGE_LABEL[program.stage]}.`, "info");
    }
  }
}

function commerce(g: Game) {
  if (!g.products.length) return;
  const sellers = g.staff.filter((s) => s.role === "commercial" && s.buildingId).length;
  const cap = shareCap(g);
  const packed = allBuildings(g).some((b) => b.kind === "pack");
  let drift = sellers * 0.15 - 0.08;
  for (const product of g.products) {
    if (product.price > 122) drift -= 0.35;
    else if (product.price < 90) drift += 0.2;
    const revenue = Math.round(g.playerShare * demandOf(g) * (product.price / 100) * (packed ? 1250 : 1050));
    g.cash += revenue;
    g.stats.revenue += revenue;
    if (product.patentLeft > 0) {
      product.patentLeft -= 1;
      if (product.patentLeft === 0) {
        g.playerShare = clamp(g.playerShare - 3, 0, cap);
        pushLog(g, `Il brevetto di ${product.code} è scaduto. I generici arrivano.`, "bad");
      }
    }
  }
  if (g.products.length > 1 && hasTech(g, "piattaforma")) drift += 0.12 * (g.products.length - 1);
  g.playerShare = clamp(g.playerShare + drift, 0, cap);
  for (const rival of g.rivals) rival.share = clamp(rival.share + (roll(g.week + rival.share) - 0.52) * 0.4, 4, 48);
}

function worldEvent(g: Game) {
  if (g.week < g.nextEvent) return;
  g.nextEvent = g.week + 7 + Math.floor(roll(g.week * 13) * 5);
  const n = Math.floor(roll(g.week * 29) * 12);
  if (n === 0 && g.week > 30) {
    g.mod = { label: "Pandemia respiratoria", apiMul: 1.65, demandAdd: 28, until: g.week + 8 };
    pushLog(g, "Pandemia respiratoria. Domanda su, principi attivi rari.", "bad");
  } else if (n === 1) {
    if (g.quality < 60) {
      g.cash -= 140_000;
      for (const b of allBuildings(g)) if (b.kind === "plant" || b.kind === "sterile" || b.kind === "pilot") b.halt = Math.max(b.halt, 2);
      g.reputation = clamp(g.reputation - 5, 0, 100);
      pushLog(g, "Ispezione a sorpresa. Linee ferme e multa.", "bad");
    } else {
      g.reputation = clamp(g.reputation + 4, 0, 100);
      pushLog(g, "Ispezione superata. La reputazione sale.", "good");
    }
  } else if (n === 2) {
    g.mod = { label: "Crisi dei solventi", apiMul: 1.4, demandAdd: 0, until: g.week + 5 };
    pushLog(g, "Crisi dei solventi. Materie prime più care.", "bad");
  } else if (n === 3) {
    const rival = g.rivals[Math.floor(roll(g.week) * g.rivals.length)]!;
    rival.share = clamp(rival.share - 5, 4, 48);
    if (g.quality > 50) g.reputation = clamp(g.reputation + 3, 0, 100);
    pushLog(g, `Scandalo in ${rival.name}. Una fetta di mercato si libera.`, "good");
  } else if (n === 4 && allBuildings(g).some((b) => b.kind === "lab")) {
    g.cash += 220_000;
    g.science += 4;
    pushLog(g, "Bando pubblico. Cassa e un po' di scienza.", "good");
  } else if (n === 5) {
    const role: Role = (["operator", "qa", "scientist", "clinical"] as Role[])[Math.floor(roll(g.week * 3) * 4)]!;
    g.candidates.push(person(g, role, 4 + Math.floor(roll(g.seq) * 2)));
    pushLog(g, "Un talento da un congresso bussa alla porta.", "good");
  } else if (n === 6 && g.pipeline.some((p) => p.patented)) {
    g.cash -= 120_000;
    pushLog(g, "Un rivale contesta un brevetto. Costa difenderlo.", "bad");
  } else if (n === 7 && g.reputation < 50 && g.staff.length > 2) {
    const target = g.staff[Math.floor(roll(g.week) * g.staff.length)]!;
    g.staff = g.staff.filter((s) => s.id !== target.id);
    pushLog(g, `${target.name} passa a un rivale. La reputazione non bastava.`, "bad");
  } else if (n === 8) {
    g.offers.push({
      id: nid(g, "o"),
      client: "Gara pubblica",
      title: "Pilota Gara pubblica",
      kind: "sintesi",
      tier: "pilota",
      batches: 2,
      pay: 280_000,
      apiEach: 1,
      quality: 48,
      expires: g.week + 4,
    });
    pushLog(g, "Una gara pubblica lascia un contratto piccolo sul tavolo.", "good");
  } else if (n === 9 && g.pipeline.some((p) => p.stage === "review")) {
    for (const p of g.pipeline) if (p.stage === "review") p.reviewLeft += 2;
    pushLog(g, "Nuova linea guida. Le revisioni aperte durano di più.", "bad");
  } else if (n === 10) {
    g.stock.solvent = Math.min(capacityDry(g), g.stock.solvent + 6);
    g.stock.eccipient = Math.min(capacityDry(g), g.stock.eccipient + 6);
    pushLog(g, "Un fornitore chiude un lotto invenduto. Solventi in casa.", "good");
  } else {
    g.reputation = clamp(g.reputation + 4, 0, 100);
    pushLog(g, "Congresso mondiale. Il nome circola.", "good");
  }
}

function upkeep(g: Game) {
  let burn = 0;
  for (const b of allBuildings(g)) burn += catalog(b.kind).upkeep * (b.kind === "hq" ? 1 : b.level);
  for (const s of g.staff) burn += s.salary;
  if (allBuildings(g).some((b) => b.kind === "utility")) burn = Math.round(burn * 0.9);
  g.cash -= burn;
  for (const b of allBuildings(g)) if (b.halt > 0) b.halt -= 1;
  if (g.staff.some((s) => s.role === "qa" && buildingById(g, s.buildingId)?.kind === "qc")) {
    g.quality = clamp(g.quality + 0.8, 0, 100);
  }
}

function maybeRefinance(g: Game) {
  if (g.cash < -1_600_000 && !g.refinanced) {
    g.cash = 350_000;
    g.reputation = clamp(g.reputation - 10, 0, 100);
    g.refinanced = true;
    pushLog(g, "I soci rifinanziano una volta sola. La reputazione ne risente.", "bad");
  } else if (g.cash < 0 && g.week % 2 === 0) {
    pushLog(g, "Cassa sotto zero. Firma un lotto piccolo o taglia stipendi.", "bad");
  }
}

function rivalPress(g: Game) {
  if (g.week % 10 !== 0) return;
  const rival = g.rivals[Math.floor(roll(g.week * 7) * g.rivals.length)]!;
  if (!g.products.length) {
    pushLog(g, `${rival.name} si prende un cliente che non hai firmato.`, "info");
    return;
  }
  if (roll(g.week) > 0.45) {
    g.playerShare = clamp(g.playerShare - 0.8, 0, shareCap(g));
    rival.share = clamp(rival.share + 0.8, 4, 48);
    pushLog(g, `${rival.name} taglia il prezzo sul tuo bersaglio.`, "bad");
  }
}

function candidates(g: Game) {
  if (g.week % 5 !== 0) return;
  const pool: Role[] = ["operator", "qa", "scientist"];
  if (g.chapter === "Clinica" || g.chapter === "Big Pharma" || g.chapter === "Piattaforma" || hasTech(g, "clinica")) pool.push("clinical", "regulatory");
  if (g.stats.batches > 3) pool.push("commercial");
  const role = pool[Math.floor(roll(g.week * 11) * pool.length)]!;
  const skill = 2 + Math.floor(roll(g.week + g.seq) * 4);
  g.candidates.push(person(g, role, skill));
  if (g.candidates.length > 5) g.candidates.shift();
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export function tick(g: Game) {
  const next = structuredClone(g) as Game;
  next.week += 1;
  if (next.mod && next.week > next.mod.until) next.mod = null;
  upkeep(next);
  produce(next);
  research(next);
  commerce(next);
  worldEvent(next);
  rivalPress(next);
  candidates(next);
  refreshOffers(next, false);
  maybeRefinance(next);
  markGoals(next);
  refreshChapter(next);
  next.history.push(Math.round(next.cash));
  if (next.history.length > 36) next.history.shift();
  return next;
}

export function waitingProgram(g: Game) {
  return g.pipeline.find((p) => p.waiting && !["failed", "launched", "licensed"].includes(p.stage)) ?? null;
}

export const GOAL_TEXT: { id: string; label: string }[] = [
  { id: "wh", label: "Costruisci un magazzino" },
  { id: "line", label: "Costruisci il pilota o un impianto" },
  { id: "op", label: "Metti un operatore in linea" },
  { id: "job", label: "Firma un contratto" },
  { id: "batch", label: "Consegna un lotto" },
  { id: "qc", label: "Apri il controllo qualità" },
  { id: "tech", label: "Sblocca una tecnica" },
  { id: "due", label: "Tieni due linee" },
  { id: "lab", label: "Apri il laboratorio" },
  { id: "pipe", label: "Avvia una molecola tua" },
  { id: "pat", label: "Deposita un brevetto" },
  { id: "lic", label: "Cedi una licenza, se ti serve cassa" },
  { id: "ok", label: "Ottieni un'approvazione" },
  { id: "go", label: "Lancia il farmaco" },
  { id: "quota", label: "Arriva al 18% di quota" },
  { id: "duego", label: "Metti in commercio un secondo farmaco" },
];
