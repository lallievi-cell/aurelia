export const COLS = 6;
export const ROWS = 6;

export type Focus = "sintesi" | "biologici";
export type Role = "scientist" | "operator" | "qa" | "clinical" | "regulatory" | "commercial";
export type Kind = "hq" | "warehouse" | "plant" | "sterile" | "qc" | "lab" | "clinical" | "regulatory";
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
  | "failed";

export type Building = { id: string; kind: Kind; level: number; c: number; r: number; halt: number };
export type Cell = { blocked: boolean; building: Building | null };
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

export type Game = {
  v: 1;
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
  stats: { batches: number; revenue: number; approvals: number; launches: number };
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

export const ROLE_LABEL: Record<Role, string> = {
  scientist: "Scienza",
  operator: "Produzione",
  qa: "Qualità",
  clinical: "Clinica",
  regulatory: "Regolatorio",
  commercial: "Commerciale",
};

export const CATALOG: CatalogItem[] = [
  { kind: "warehouse", name: "Magazzino", blurb: "Principi attivi e lotti. Senza spazio non si produce.", cost: 180_000, upkeep: 6_000, role: null, roleLabel: "" },
  { kind: "plant", name: "Impianto", blurb: "Linee per piccole molecole. Serve un operatore.", cost: 640_000, upkeep: 28_000, role: "operator", roleLabel: "Operatori" },
  { kind: "sterile", name: "Suite sterile", blurb: "Biologici. Contratti più ricchi, costi più alti.", cost: 980_000, upkeep: 42_000, role: "operator", roleLabel: "Operatori" },
  { kind: "qc", name: "Controllo qualità", blurb: "Abbassa i lotti falliti e regge le ispezioni.", cost: 260_000, upkeep: 10_000, role: "qa", roleLabel: "Analisti" },
  { kind: "lab", name: "Laboratorio", blurb: "La tua pipeline, non solo il conto terzi.", cost: 360_000, upkeep: 14_000, role: "scientist", roleLabel: "Scienziati" },
  { kind: "clinical", name: "Unità clinica", blurb: "Fasi I, II e III.", cost: 540_000, upkeep: 18_000, role: "clinical", roleLabel: "Clinici" },
  { kind: "regulatory", name: "Affari regolatori", blurb: "Brevetti, dossier, AIFA, EMA, FDA.", cost: 300_000, upkeep: 11_000, role: "regulatory", roleLabel: "Regolatori" },
  { kind: "hq", name: "Direzione", blurb: "I commerciali alzano il prezzo dei contratti.", cost: 0, upkeep: 22_000, role: "commercial", roleLabel: "Commerciali" },
];

export const INDICATIONS = ["Infezioni", "Oncologia", "Metabolico", "Malattie rare", "Immunologia", "Cardiologia"];

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
  phase3: 8,
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
  failed: "Fermato",
};

export const NEXT_STAGE: Partial<Record<Stage, { stage: Stage; cost: number; label: string }>> = {
  discovery: { stage: "lead", cost: 120_000, label: "Passa al lead" },
  lead: { stage: "preclinical", cost: 200_000, label: "Avvia la preclinica" },
  preclinical: { stage: "patent", cost: 0, label: "Pronto per il brevetto" },
  patent: { stage: "phase1", cost: 350_000, label: "Deposita il brevetto" },
  phase1: { stage: "phase2", cost: 480_000, label: "Apri la fase II" },
  phase2: { stage: "phase3", cost: 860_000, label: "Apri la fase III" },
  phase3: { stage: "dossier", cost: 240_000, label: "Scrivi il dossier" },
  dossier: { stage: "review", cost: 180_000, label: "Scegli l'autorità" },
};

const FIRST = ["Giulia", "Marco", "Lea", "Davide", "Noor", "Chiara", "Andrea", "Sara", "Luca", "Marta", "Elena", "Pietro", "Amina", "Rosa", "Ivan"];
const LAST = ["Riva", "Conti", "Greco", "Ferrari", "Sala", "Costa", "Marini", "Gallo", "Leone", "Vitale"];
const CLIENTS = ["Lumen", "Oster & Vale", "Marrow", "Siena Labs", "Quill", "Nordlicht", "Petra Bio", "Ilex", "Monteluce", "Casa Verde"];

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
  return Math.max(20, warehouses.reduce((sum, b) => sum + b.level * 80, 0));
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

function garden(c: number, r: number) {
  return c >= 2 && c <= 3 && r >= 2 && r <= 3;
}

export function newGame(name: string, focus: Focus): Game {
  const g = {
    v: 1 as const,
    name: name.trim().slice(0, 22) || "Aurelia",
    focus,
    week: 1,
    cash: 2_400_000,
    reputation: 48,
    quality: 46,
    seq: 1,
    cells: [] as Cell[][],
    staff: [] as Staff[],
    candidates: [] as Staff[],
    api: 12,
    autoBuy: true,
    offers: [] as Offer[],
    jobs: [] as Job[],
    pipeline: [] as Program[],
    products: [] as Product[],
    rivals: [
      { id: "helix", name: "Helix Nord", share: 34, note: "Conto terzi nel Nord Europa." },
      { id: "vanta", name: "Vanta Bio", share: 28, note: "Biologici, prezzi aggressivi." },
      { id: "kite", name: "Kite & Morrow", share: 22, note: "Big lenta, piena di brevetti." },
    ],
    log: [] as LogItem[],
    chapter: "Fondazione",
    goals: [] as string[],
    market: { apiPrice: 8000, demand: 42 },
    mod: null,
    playerShare: 0,
    refinanced: false,
    nextEvent: 7,
    stats: { batches: 0, revenue: 0, approvals: 0, launches: 0 },
    history: [2_400_000],
  };
  for (let r = 0; r < ROWS; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < COLS; c++) row.push({ blocked: garden(c, r), building: null });
    g.cells.push(row);
  }
  g.cells[1]![1]!.building = { id: "hq", kind: "hq", level: 1, c: 1, r: 1, halt: 0 };
  g.staff.push(person(g, "scientist", 3), person(g, "operator", 3));
  g.candidates.push(person(g, "qa", 3), person(g, "operator", 4), person(g, "commercial", 2));
  pushLog(g, `${g.name} apre il campus. Cassa, un laboratorio umano e una linea ancora da costruire.`, "info");
  refreshOffers(g, true);
  return g;
}

export function pushLog(g: Game, text: string, tone: Tone) {
  g.log.unshift({ week: g.week, text, tone });
  if (g.log.length > 36) g.log.length = 36;
}

export function apiPrice(g: Game) {
  return Math.round(g.market.apiPrice * (g.mod ? g.mod.apiMul : 1));
}

export function demandOf(g: Game) {
  return g.market.demand + (g.mod ? g.mod.demandAdd : 0);
}

function refreshOffers(g: Game, force: boolean) {
  g.offers = g.offers.filter((o) => o.expires >= g.week);
  if (!force && g.week % 4 !== 1 && g.offers.length >= 2) return;
  while (g.offers.length < 3) {
    const bio = roll(g.week * 17 + g.seq + g.offers.length) > (g.focus === "biologici" ? 0.35 : 0.72);
    const batches = 2 + Math.floor(roll(g.seq + 4 + g.offers.length) * 3);
    const apiEach = bio ? 4 : 2;
    const client = CLIENTS[Math.floor(roll(g.seq + 11 + g.week) * CLIENTS.length)]!;
    g.offers.push({
      id: nid(g, "o"),
      client,
      title: bio ? `Lotto sterile ${client}` : `Sintesi ${client}`,
      kind: bio ? "biologici" : "sintesi",
      batches,
      pay: batches * (bio ? 230_000 : 160_000),
      apiEach,
      quality: 52 + Math.floor(roll(g.seq) * 16),
      expires: g.week + 6,
    });
  }
}

export function buildCost(g: Game, kind: Kind) {
  const base = catalog(kind).cost;
  if (kind === "sterile" && g.focus === "biologici") return Math.round(base * 0.85);
  if (kind === "plant" && g.focus === "sintesi") return Math.round(base * 0.9);
  return base;
}

export function canBuild(g: Game, kind: Kind, c: number, r: number) {
  const cell = g.cells[r]?.[c];
  if (!cell || cell.blocked || cell.building) return "Lotto non libero.";
  if (kind === "hq") return "La direzione c'è già.";
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
  const item = catalog(kind);
  pushLog(next, `${item.name} è in piedi.`, "good");
  markGoals(next);
  return next;
}

export function upgrade(g: Game, id: string) {
  const next = structuredClone(g) as Game;
  const b = allBuildings(next).find((item) => item.id === id);
  if (!b) return g;
  if (b.level >= 3) return g;
  const cost = Math.round(catalog(b.kind).cost * 0.55 * b.level) || 80_000;
  if (next.cash < cost) return g;
  next.cash -= cost;
  b.level += 1;
  pushLog(next, `${catalog(b.kind).name} sale a livello ${b.level}.`, "good");
  return next;
}

export function upgradeCost(b: Building) {
  return Math.round(catalog(b.kind).cost * 0.55 * b.level) || 80_000;
}

export function hire(g: Game, id: string) {
  const next = structuredClone(g) as Game;
  const idx = next.candidates.findIndex((c) => c.id === id);
  if (idx < 0) return g;
  const fee = 15_000;
  if (next.cash < fee) return g;
  const person = next.candidates.splice(idx, 1)[0]!;
  next.cash -= fee;
  next.staff.push(person);
  pushLog(next, `${person.name} entra in ${next.name}.`, "good");
  return next;
}

export function dismiss(g: Game, id: string) {
  const next = structuredClone(g) as Game;
  const person = next.staff.find((s) => s.id === id);
  if (!person) return g;
  next.staff = next.staff.filter((s) => s.id !== id);
  pushLog(next, `${person.name} lascia l'azienda.`, "info");
  return next;
}

export function assign(g: Game, staffId: string, buildingId: string | null) {
  const next = structuredClone(g) as Game;
  const person = next.staff.find((s) => s.id === staffId);
  const building = buildingById(next, buildingId);
  if (!person) return g;
  if (building) {
    if (building.kind === "warehouse") return g;
    const item = catalog(building.kind);
    if (item.role && item.role !== person.role) return g;
    const used = staffIn(next, building.id).filter((s) => s.id !== person.id).length;
    const slots = building.level + (building.kind === "hq" ? 1 : 0);
    if (used >= Math.max(1, slots)) return g;
  }
  person.buildingId = buildingId;
  return next;
}

export function acceptOffer(g: Game, id: string) {
  const next = structuredClone(g) as Game;
  const idx = next.offers.findIndex((o) => o.id === id);
  if (idx < 0) return g;
  const offer = next.offers.splice(idx, 1)[0]!;
  const need = offer.kind === "biologici" ? "sterile" : "plant";
  const has = allBuildings(next).some((b) => b.kind === need);
  next.jobs.push({ ...offer, status: has ? "queued" : "queued", done: 0, lineId: null });
  pushLog(next, `Contratto ${offer.client}: ${offer.batches} lotti, ${euro(offer.pay)}.`, "info");
  if (!has) pushLog(next, offer.kind === "biologici" ? "Serve una suite sterile." : "Serve un impianto.", "bad");
  markGoals(next);
  return next;
}

export function orderApi(g: Game, units: number) {
  const next = structuredClone(g) as Game;
  const room = capacityApi(next) - next.api;
  const n = Math.max(0, Math.min(units, room));
  const cost = n * apiPrice(next);
  if (n <= 0 || next.cash < cost) return g;
  next.cash -= cost;
  next.api += n;
  pushLog(next, `Ordine di ${n} unità di principio attivo.`, "info");
  return next;
}

export function setAutoBuy(g: Game, on: boolean) {
  const next = structuredClone(g) as Game;
  next.autoBuy = on;
  return next;
}

export function startProgram(g: Game, indication: string) {
  const next = structuredClone(g) as Game;
  const active = next.pipeline.filter((p) => p.stage !== "failed" && p.stage !== "launched").length;
  const lab = allBuildings(next).some((b) => b.kind === "lab");
  const scientists = next.staff.some((s) => s.role === "scientist" && buildingById(next, s.buildingId)?.kind === "lab");
  if (!lab || !scientists || active >= 2 || next.cash < 80_000) return g;
  next.cash -= 80_000;
  const code = `AUR-${100 + next.pipeline.length + 4}`;
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
  if (program.stage === "dossier") {
    const authority = AUTHORITIES.find((a) => a.id === authorityId) ?? AUTHORITIES[0]!;
    if (next.cash < step.cost) return g;
    next.cash -= step.cost;
    program.stage = "review";
    program.waiting = false;
    program.progress = 0;
    program.authority = authority.name;
    const reg = next.staff.some((s) => s.role === "regulatory" && buildingById(next, s.buildingId)?.kind === "regulatory");
    program.reviewLeft = Math.max(4, authority.weeks - (reg ? 2 : 0));
    pushLog(next, `${program.code} è in revisione da ${authority.name}.`, "info");
    return next;
  }
  if (program.stage === "patent") {
    if (next.cash < step.cost) return g;
    next.cash -= step.cost;
    program.patented = true;
    program.stage = "phase1";
    program.waiting = false;
    program.progress = 0;
    pushLog(next, `Brevetto depositato su ${program.code}.`, "good");
    markGoals(next);
    return next;
  }
  if (next.cash < step.cost) return g;
  const risk = program.stage === "phase1" ? 0.12 : program.stage === "phase2" ? 0.22 : program.stage === "phase3" ? 0.3 : 0;
  const skill = avgSkill(next, program.stage === "discovery" || program.stage === "lead" || program.stage === "preclinical" ? "scientist" : "clinical");
  const chance = risk - skill * 0.03 - next.quality / 400;
  if (risk > 0 && roll(next.week * 3 + next.seq) < chance) {
    next.cash -= Math.round(step.cost * 0.4);
    program.stage = "failed";
    program.waiting = false;
    next.reputation = clamp(next.reputation - 4, 0, 100);
    pushLog(next, `${program.code} si ferma in ${STAGE_LABEL[step.stage]}. I dati non reggono.`, "bad");
    return next;
  }
  next.cash -= step.cost;
  program.stage = step.stage;
  program.waiting = step.stage === "patent";
  program.progress = 0;
  pushLog(next, `${program.code}: ${STAGE_LABEL[program.stage]}.`, "good");
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
    patentLeft: program.patented ? 36 : 0,
  });
  next.playerShare = clamp(next.playerShare + 8, 0, 36);
  takeShare(next, 8);
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
  if (next.cash < 60_000) return g;
  if (!allBuildings(next).some((b) => b.kind === "qc")) return g;
  next.cash -= 60_000;
  next.quality = clamp(next.quality + 8, 0, 100);
  pushLog(next, "Audit interno. La qualità sale.", "good");
  return next;
}

function avgSkill(g: Game, role: Role) {
  const list = g.staff.filter((s) => s.role === role && s.buildingId);
  if (!list.length) return 0;
  return list.reduce((sum, s) => sum + s.skill, 0) / list.length;
}

function takeShare(g: Game, amount: number) {
  const ranked = [...g.rivals].sort((a, b) => b.share - a.share);
  let left = amount;
  for (const rival of ranked) {
    const cut = Math.min(rival.share, left);
    rival.share -= cut;
    left -= cut;
    if (left <= 0) break;
  }
}

function markGoals(g: Game) {
  const has = (kind: Kind) => allBuildings(g).some((b) => b.kind === kind);
  const done = new Set(g.goals);
  const give = (id: string, text: string, cash: number) => {
    if (done.has(id)) return;
    g.goals.push(id);
    g.cash += cash;
    pushLog(g, `${text} Premio ${euro(cash)}.`, "good");
  };
  if (has("warehouse")) give("wh", "Magazzino pronto.", 40_000);
  if (has("plant") || has("sterile")) give("line", "La prima linea esiste.", 50_000);
  if (g.staff.some((s) => s.role === "operator" && s.buildingId)) give("op", "Operatore in linea.", 30_000);
  if (g.jobs.length) give("job", "Primo contratto firmato.", 40_000);
  if (g.stats.batches > 0) give("batch", "Primo lotto consegnato.", 70_000);
  if (has("lab")) give("lab", "Ricerca propria aperta.", 40_000);
  if (g.pipeline.length) give("pipe", "Pipeline accesa.", 60_000);
  if (g.pipeline.some((p) => p.patented)) give("pat", "Brevetto in cassaforte.", 80_000);
  if (g.stats.approvals > 0) give("ok", "Prima approvazione.", 200_000);
  if (g.stats.launches > 0) give("go", "Farmaco in commercio.", 150_000);
}

function refreshChapter(g: Game) {
  if (g.stats.launches > 0 && (g.playerShare >= 16 || g.cash > 18_000_000)) g.chapter = "Big Pharma";
  else if (g.stats.approvals > 0) g.chapter = "Prima approvazione";
  else if (g.pipeline.length > 0) g.chapter = "Ricerca propria";
  else if (g.stats.batches > 0) g.chapter = "CDMO";
  else g.chapter = "Fondazione";
}

function lineKind(job: Job): Kind {
  return job.kind === "biologici" ? "sterile" : "plant";
}

function assignLines(g: Game) {
  for (const job of g.jobs) {
    if (job.status !== "queued") continue;
    const kind = lineKind(job);
    const line = allBuildings(g).find((b) => {
      if (b.kind !== kind || b.halt > 0) return false;
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
  const score = g.quality * 0.45 + (analyst ? 28 : 0) + qc * 10;
  const gap = job.quality - score;
  return gap <= 0 ? 0.03 : Math.min(0.5, 0.06 + gap / 140);
}

function produce(g: Game) {
  assignLines(g);
  const commercial = g.staff.some((s) => s.role === "commercial" && buildingById(g, s.buildingId)?.kind === "hq");
  for (const job of g.jobs) {
    if (job.status !== "active" || !job.lineId) continue;
    const line = buildingById(g, job.lineId);
    if (!line || line.halt > 0) continue;
    if (g.api < job.apiEach) {
      if (g.autoBuy) {
        const cost = job.apiEach * apiPrice(g);
        const room = capacityApi(g) - g.api;
        if (room >= job.apiEach && g.cash >= cost) {
          g.cash -= cost;
          g.api += job.apiEach;
        }
      }
      if (g.api < job.apiEach) continue;
    }
    g.api -= job.apiEach;
    if (roll(g.week * 19 + job.done + g.seq) < failChance(g, job)) {
      g.quality = clamp(g.quality - 3, 0, 100);
      g.reputation = clamp(g.reputation - 3, 0, 100);
      pushLog(g, `Lotto ${job.client} fuori specifica.`, "bad");
      continue;
    }
    job.done += 1;
    g.stats.batches += 1;
    const slice = Math.round((job.pay / job.batches) * (commercial ? 1.08 : 1));
    g.cash += slice;
    g.stats.revenue += slice;
    g.reputation = clamp(g.reputation + 1, 0, 100);
    g.quality = clamp(g.quality + 0.4, 0, 100);
    pushLog(g, `Lotto ${job.done}/${job.batches} per ${job.client} consegnato.`, "good");
    if (job.done >= job.batches) {
      job.status = "done";
      job.lineId = null;
      pushLog(g, `Contratto ${job.client} chiuso.`, "good");
    }
  }
}

function research(g: Game) {
  const scientists = g.staff.filter((s) => s.role === "scientist" && buildingById(g, s.buildingId)?.kind === "lab");
  const clinicians = g.staff.filter((s) => s.role === "clinical" && buildingById(g, s.buildingId)?.kind === "clinical");
  const regulators = g.staff.filter((s) => s.role === "regulatory" && buildingById(g, s.buildingId)?.kind === "regulatory");
  for (const program of g.pipeline) {
    if (program.stage === "failed" || program.stage === "launched" || program.stage === "approved") continue;
    if (program.stage === "review") {
      program.reviewLeft -= 1;
      if (program.reviewLeft <= 0) {
        const authority = AUTHORITIES.find((a) => a.name === program.authority) ?? AUTHORITIES[0]!;
        const bonus = (regulators.length ? 0.12 : 0) + g.quality / 280 + (program.patented ? 0.06 : 0);
        const ok = roll(g.week * 5 + g.seq) > authority.strict - bonus;
        if (ok) {
          program.stage = "approved";
          g.stats.approvals += 1;
          g.reputation = clamp(g.reputation + 8, 0, 100);
          pushLog(g, `${authority.name} approva ${program.code}.`, "good");
          refreshChapter(g);
        } else {
          program.stage = "dossier";
          program.waiting = true;
          program.progress = STAGE_NEED.dossier ?? 4;
          g.reputation = clamp(g.reputation - 5, 0, 100);
          pushLog(g, `${authority.name} rimanda ${program.code}. Si riparte dal dossier.`, "bad");
        }
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
    const speed = 0.7 + team.reduce((sum, s) => sum + s.skill, 0) / team.length / 4;
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
  for (const product of g.products) {
    if (product.price > 118) g.playerShare = clamp(g.playerShare - 0.45, 0, 36);
    else if (product.price < 92) g.playerShare = clamp(g.playerShare + 0.25, 0, 36);
    g.playerShare = clamp(g.playerShare + sellers * 0.18 - 0.12, 0, 36);
    const revenue = Math.round(g.playerShare * demandOf(g) * (product.price / 100) * 1400);
    g.cash += revenue;
    g.stats.revenue += revenue;
    if (product.patentLeft > 0) {
      product.patentLeft -= 1;
      if (product.patentLeft === 0) {
        g.playerShare = clamp(g.playerShare - 4, 0, 36);
        pushLog(g, `Il brevetto di ${product.code} è scaduto. I rivali copiano.`, "bad");
      }
    }
  }
  const rivalDrift = g.products.length ? 0.15 : 0.35;
  for (const rival of g.rivals) rival.share = clamp(rival.share + (roll(g.week + rival.share) - 0.5) * rivalDrift, 4, 60);
}

function worldEvent(g: Game) {
  if (g.week < g.nextEvent) return;
  g.nextEvent = g.week + 6 + Math.floor(roll(g.week * 13) * 4);
  const n = Math.floor(roll(g.week * 29) * 8);
  if (n === 0) {
    g.mod = { label: "Pandemia respiratoria", apiMul: 1.75, demandAdd: 36, until: g.week + 8 };
    g.market.demand = 48;
    pushLog(g, "Pandemia respiratoria. Domanda di antivirali su, principi attivi rari.", "bad");
  } else if (n === 1) {
    if (g.quality < 62) {
      g.cash -= 180_000;
      for (const b of allBuildings(g)) if (b.kind === "plant" || b.kind === "sterile") b.halt = Math.max(b.halt, 2);
      g.reputation = clamp(g.reputation - 6, 0, 100);
      pushLog(g, "Ispezione a sorpresa. Linee ferme due settimane e multa.", "bad");
    } else {
      g.reputation = clamp(g.reputation + 4, 0, 100);
      pushLog(g, "Ispezione superata. La reputazione sale.", "good");
    }
  } else if (n === 2) {
    g.mod = { label: "Crisi dei solventi", apiMul: 1.45, demandAdd: 0, until: g.week + 6 };
    pushLog(g, "Crisi dei solventi. Il principio attivo costa di più.", "bad");
  } else if (n === 3) {
    const rival = g.rivals[Math.floor(roll(g.week) * g.rivals.length)]!;
    rival.share = clamp(rival.share - 6, 4, 60);
    if (g.quality > 50) g.reputation = clamp(g.reputation + 4, 0, 100);
    pushLog(g, `Scandalo in ${rival.name}. Una fetta di mercato si libera.`, "good");
  } else if (n === 4 && allBuildings(g).some((b) => b.kind === "lab")) {
    g.cash += 300_000;
    pushLog(g, "Bando pubblico per la ricerca. Entrano 300 mila €.", "good");
  } else if (n === 5) {
    g.candidates.push(person(g, "scientist", 5));
    pushLog(g, "Un talento da un congresso bussa alla porta.", "good");
  } else if (n === 6 && g.pipeline.some((p) => p.patented)) {
    g.cash -= 150_000;
    pushLog(g, "Un rivale contesta un brevetto. Costa difenderlo.", "bad");
  } else {
    g.reputation = clamp(g.reputation + 5, 0, 100);
    pushLog(g, "Congresso mondiale. Il nome di Aurelia circola.", "good");
  }
}

function upkeep(g: Game) {
  let burn = 0;
  for (const b of allBuildings(g)) burn += catalog(b.kind).upkeep * b.level;
  for (const s of g.staff) burn += s.salary;
  g.cash -= burn;
  for (const b of allBuildings(g)) if (b.halt > 0) b.halt -= 1;
  if (g.staff.some((s) => s.role === "qa" && buildingById(g, s.buildingId)?.kind === "qc")) {
    g.quality = clamp(g.quality + 1.2, 0, 100);
  }
}

function maybeRefinance(g: Game) {
  if (g.cash < -2_000_000 && !g.refinanced) {
    g.cash = 400_000;
    g.reputation = clamp(g.reputation - 12, 0, 100);
    g.refinanced = true;
    pushLog(g, "I soci rifinanziano l'azienda. La reputazione ne risente.", "bad");
  } else if (g.cash < 0) {
    pushLog(g, "Cassa sotto zero. Le linee rallentano se non entra un contratto.", "bad");
  }
}

function rivalPress(g: Game) {
  if (g.week % 8 !== 0) return;
  const rival = g.rivals[Math.floor(roll(g.week * 7) * g.rivals.length)]!;
  if (!g.products.length) {
    pushLog(g, `${rival.name} si prende un cliente che non hai firmato.`, "info");
    return;
  }
  if (roll(g.week) > 0.5) {
    g.playerShare = clamp(g.playerShare - 1.2, 0, 36);
    rival.share = clamp(rival.share + 1.2, 4, 60);
    pushLog(g, `${rival.name} taglia il prezzo sul tuo stesso bersaglio.`, "bad");
  }
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
  if (next.week % 4 === 0) {
    next.candidates = [person(next, "qa", 2 + Math.floor(roll(next.week) * 3)), person(next, "scientist", 3), person(next, "clinical", 3)];
  }
  refreshOffers(next, false);
  maybeRefinance(next);
  markGoals(next);
  refreshChapter(next);
  next.history.push(next.cash);
  if (next.history.length > 24) next.history.shift();
  return next;
}

export function waitingProgram(g: Game) {
  return g.pipeline.find((p) => p.waiting && p.stage !== "failed" && p.stage !== "launched") ?? null;
}

export const GOAL_TEXT: { id: string; label: string }[] = [
  { id: "wh", label: "Costruisci un magazzino" },
  { id: "line", label: "Costruisci un impianto o una suite" },
  { id: "op", label: "Metti un operatore in linea" },
  { id: "job", label: "Firma un contratto" },
  { id: "batch", label: "Consegna un lotto" },
  { id: "lab", label: "Apri il laboratorio" },
  { id: "pipe", label: "Avvia una molecola tua" },
  { id: "pat", label: "Deposita un brevetto" },
  { id: "ok", label: "Ottieni un'approvazione" },
  { id: "go", label: "Lancia il farmaco" },
];
