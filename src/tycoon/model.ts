export const COLS = 20;
export const ROWS = 16;

export type Focus = "sintesi" | "biologici";
export type Modality = "chimica" | "biologico";
export type Role = "scientist" | "operator" | "qa" | "clinical" | "regulatory" | "commercial";
export type Tone = "good" | "bad" | "info";
export type Era = "early" | "mid" | "late" | "oltre";
export type MatKey = "api" | "solvent" | "eccipient";
export type ParcelId = "fondazione" | "logistica" | "produzione" | "scienza" | "clinica";
export type RoomType =
  | "hq"
  | "gown"
  | "warehouse"
  | "quarantine"
  | "cold"
  | "shipping"
  | "pilot"
  | "plant"
  | "pack"
  | "sterile"
  | "qc"
  | "stability"
  | "discovery"
  | "preclinical"
  | "phase1"
  | "phase23"
  | "regulatory"
  | "power"
  | "water";
export type TechId =
  | "gmp"
  | "acquisti"
  | "formazione"
  | "commerciale"
  | "reattore50"
  | "classeC"
  | "analitica"
  | "scaleup"
  | "freddo"
  | "packaging"
  | "utilities"
  | "scoperta"
  | "acque"
  | "asettico"
  | "preclinica"
  | "brevetti"
  | "clinica1"
  | "clinica2"
  | "clinica3"
  | "affari"
  | "stabilita"
  | "licenze"
  | "lancio"
  | "continuo"
  | "piattaforma";
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
export type Tier = "pilota" | "standard" | "premium" | "sterile";
export type Shape = "campione" | "fornitura" | "urgenza" | "trasferimento";
export type Clauses = { rush: boolean; tight: boolean; penalty: boolean };

export type Gear = { defId: string; level: number; mat?: MatKey };
export type Room = {
  id: string;
  type: RoomType;
  level: number;
  c: number;
  r: number;
  w: number;
  h: number;
  expanded: boolean;
  halt: number;
  slots: ({ item: Gear | null })[];
};
export type Tile = { corridor: boolean; roomId: string | null; ground: "lot" | "garden" };
export type Staff = { id: string; name: string; role: Role; skill: number; salary: number; roomId: string | null };
export type Client = { id: string; name: string; trust: number; taste: Tier; note: string; last: number };
export type Offer = {
  id: string;
  client: string;
  clientId: string;
  title: string;
  tier: Tier;
  shape: Shape;
  batches: number;
  pay: number;
  basePay: number;
  api: number;
  solvent: number;
  eccipient: number;
  vials: number;
  quality: number;
  baseQuality: number;
  expires: number;
  dueWeeks: number;
  clauses: Clauses;
  blurb: string;
  science: number;
};
export type Job = Offer & {
  status: "queued" | "active";
  done: number;
  roomId: string | null;
  progress: number;
  due: number;
  scrap: number;
  prefer: string | null;
  lateHit: boolean;
  penalScrap: boolean;
};
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
  modality: Modality;
  heat: number;
  rivalId: string | null;
};
export type Product = { id: string; code: string; indication: string; price: number; patented: boolean; patentLeft: number };
export type Rival = { id: string; name: string; share: number; note: string };
export type LogItem = { week: number; text: string; tone: Tone };
export type MarketMod = { label: string; apiMul: number; demandAdd: number; until: number } | null;

export type Game = {
  v: 3;
  name: string;
  focus: Focus;
  week: number;
  cash: number;
  reputation: number;
  quality: number;
  seq: number;
  owned: ParcelId[];
  tiles: Tile[][];
  rooms: Room[];
  staff: Staff[];
  candidates: Staff[];
  api: number;
  solvent: number;
  eccipient: number;
  vials: number;
  science: number;
  tech: TechId[];
  autoBuy: boolean;
  clients: Client[];
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

export type TechDef = { id: TechId; era: Era; name: string; blurb: string; cash: number; sci: number; need: TechId[] };
export type RoomDef = {
  type: RoomType;
  name: string;
  blurb: string;
  w: number;
  h: number;
  anchors: number;
  anchorsExpanded: number;
  shell: number;
  upkeep: number;
  parcels: ParcelId[];
  tech: TechId | null;
  max: number;
  role: Role | null;
  roleLabel: string;
  expand?: "e" | "s";
  need: Partial<Record<number, string>>;
};
export type GearDef = {
  id: string;
  name: string;
  kind: "machine" | "furn" | "util" | "supply";
  room: RoomType;
  tech: TechId | null;
  cost: number;
  upkeep: number;
  kw: number;
  supply: number;
  maxLevel: number;
  limit: number;
  needExpand?: boolean;
  levelTech?: Partial<Record<number, TechId>>;
  mats?: boolean;
};

export const ROLE_LABEL: Record<Role, string> = {
  scientist: "Scienza",
  operator: "Produzione",
  qa: "Qualità",
  clinical: "Clinica",
  regulatory: "Regolatorio",
  commercial: "Commerciale",
};

export const PARCELS: { id: ParcelId; name: string; c0: number; r0: number; c1: number; r1: number; cost: number; tech: TechId | null; needBatch: boolean; touch: ParcelId[] }[] = [
  { id: "fondazione", name: "Fondazione", c0: 0, r0: 0, c1: 8, r1: 8, cost: 0, tech: null, needBatch: false, touch: [] },
  { id: "logistica", name: "Logistica", c0: 8, r0: 0, c1: 14, r1: 8, cost: 120_000, tech: null, needBatch: true, touch: ["fondazione"] },
  { id: "produzione", name: "Produzione", c0: 0, r0: 8, c1: 14, r1: 16, cost: 280_000, tech: "classeC", needBatch: false, touch: ["fondazione", "logistica"] },
  { id: "scienza", name: "Scienza", c0: 14, r0: 0, c1: 20, r1: 8, cost: 200_000, tech: "scoperta", needBatch: false, touch: ["logistica"] },
  { id: "clinica", name: "Clinica", c0: 14, r0: 8, c1: 20, r1: 16, cost: 260_000, tech: "clinica1", needBatch: false, touch: ["produzione", "scienza"] },
];

export const TECH: TechDef[] = [
  { id: "gmp", era: "early", name: "GMP di base", blurb: "Spogliatoio e disciplina di produzione.", cash: 28_000, sci: 5, need: [] },
  { id: "acquisti", era: "early", name: "Ufficio acquisti", blurb: "Scaffali più utili e materie meno care.", cash: 24_000, sci: 4, need: [] },
  { id: "formazione", era: "early", name: "Formazione", blurb: "Puoi far crescere l'abilità.", cash: 20_000, sci: 4, need: [] },
  { id: "commerciale", era: "early", name: "Sala contratti", blurb: "Un commerciale alza la paga dei lotti.", cash: 30_000, sci: 5, need: ["gmp"] },
  { id: "reattore50", era: "early", name: "Reattore 50 L", blurb: "Il pilota prende anche contratti standard.", cash: 70_000, sci: 8, need: ["gmp"] },
  { id: "classeC", era: "mid", name: "Classe C", blurb: "Sblocca il lotto produzione e l'impianto GMP.", cash: 140_000, sci: 12, need: ["reattore50"] },
  { id: "analitica", era: "mid", name: "Analitica", blurb: "HPLC, quarantena, microbiologia.", cash: 90_000, sci: 12, need: ["gmp"] },
  { id: "scaleup", era: "mid", name: "Scale-up", blurb: "Reattore da 200 L e sintetizzatore.", cash: 160_000, sci: 14, need: ["reattore50", "analitica"] },
  { id: "freddo", era: "mid", name: "Catena del freddo", blurb: "Cella frigo e freezer campioni.", cash: 80_000, sci: 10, need: ["gmp"] },
  { id: "packaging", era: "mid", name: "Packaging", blurb: "Confezionamento e spedizioni.", cash: 60_000, sci: 8, need: ["gmp"] },
  { id: "utilities", era: "mid", name: "Utilities", blurb: "La centralina alza i kW del sito.", cash: 70_000, sci: 10, need: ["classeC"] },
  { id: "scoperta", era: "mid", name: "Scoperta", blurb: "Sblocca il lotto scienza e il laboratorio.", cash: 100_000, sci: 12, need: ["gmp"] },
  { id: "acque", era: "mid", name: "Acque", blurb: "Loop PW e WFI, necessari alla suite.", cash: 90_000, sci: 12, need: ["utilities"] },
  { id: "asettico", era: "late", name: "Processo asettico", blurb: "Sblocca la suite sterile.", cash: 220_000, sci: 18, need: ["classeC", "freddo", "acque"] },
  { id: "preclinica", era: "late", name: "Preclinica", blurb: "Saggi e tossicologia in vitro.", cash: 140_000, sci: 16, need: ["scoperta"] },
  { id: "brevetti", era: "late", name: "Brevetti", blurb: "Deposito meno caro.", cash: 80_000, sci: 14, need: ["scoperta"] },
  { id: "clinica1", era: "late", name: "Clinica I", blurb: "Sblocca il lotto clinica e la fase I.", cash: 180_000, sci: 18, need: ["brevetti", "preclinica"] },
  { id: "clinica2", era: "late", name: "Clinica II", blurb: "Unità di fase II e III.", cash: 200_000, sci: 20, need: ["clinica1"] },
  { id: "clinica3", era: "late", name: "Clinica III", blurb: "Biostatistica e archivio TMF.", cash: 220_000, sci: 22, need: ["clinica2"] },
  { id: "affari", era: "late", name: "Affari regolatori", blurb: "Dossier e autorità.", cash: 120_000, sci: 18, need: ["clinica1"] },
  { id: "stabilita", era: "late", name: "Stabilità", blurb: "Contratti premium più lunghi.", cash: 110_000, sci: 16, need: ["analitica"] },
  { id: "licenze", era: "late", name: "Licensing", blurb: "Puoi cedere una molecola brevettata.", cash: 100_000, sci: 14, need: ["brevetti"] },
  { id: "lancio", era: "oltre", name: "Lancio globale", blurb: "Serializzazione, GDP, tetto di quota più alto.", cash: 280_000, sci: 26, need: ["affari", "packaging"] },
  { id: "continuo", era: "oltre", name: "Processo continuo", blurb: "L'impianto GMP chiude lotti più spesso.", cash: 320_000, sci: 28, need: ["scaleup", "classeC"] },
  { id: "piattaforma", era: "oltre", name: "Piattaforma", blurb: "Secondo lab di scoperta e secondo farmaco.", cash: 360_000, sci: 30, need: ["lancio"] },
];

export const ROOMS: RoomDef[] = [
  { type: "hq", name: "Direzione", blurb: "Già in piedi.", w: 2, h: 2, anchors: 2, anchorsExpanded: 2, shell: 0, upkeep: 12_000, parcels: ["fondazione"], tech: null, max: 1, role: "commercial", roleLabel: "Commerciali", need: {} },
  { type: "gown", name: "Spogliatoio", blurb: "Serve prima dell'impianto e della suite.", w: 2, h: 2, anchors: 2, anchorsExpanded: 2, shell: 40_000, upkeep: 2_000, parcels: ["fondazione", "produzione"], tech: "gmp", max: 1, role: null, roleLabel: "", need: { 2: "badge" } },
  { type: "warehouse", name: "Magazzino", blurb: "Scaffali per API, solvente o eccipiente.", w: 3, h: 2, anchors: 3, anchorsExpanded: 5, shell: 70_000, upkeep: 5_000, parcels: ["fondazione", "logistica"], tech: null, max: 2, role: null, roleLabel: "", expand: "s", need: { 2: "accettazione" } },
  { type: "quarantine", name: "Quarantena", blurb: "Senza gabbia i materiali in ingresso sporcano i lotti.", w: 2, h: 2, anchors: 2, anchorsExpanded: 2, shell: 55_000, upkeep: 3_000, parcels: ["logistica"], tech: "analitica", max: 1, role: null, roleLabel: "", need: {} },
  { type: "cold", name: "Cella frigo", blurb: "Flaconi. Senza allarme qualcosa si scioglie.", w: 2, h: 2, anchors: 2, anchorsExpanded: 2, shell: 80_000, upkeep: 4_000, parcels: ["logistica"], tech: "freddo", max: 1, role: null, roleLabel: "", need: { 2: "allarme" } },
  { type: "shipping", name: "Spedizioni", blurb: "Il farmaco tuo vende a prezzo pieno.", w: 2, h: 2, anchors: 2, anchorsExpanded: 2, shell: 60_000, upkeep: 3_000, parcels: ["logistica"], tech: "packaging", max: 1, role: null, roleLabel: "", need: {} },
  { type: "pilot", name: "Locale pilota", blurb: "Prima linea. Reattore da banco, poi 50 L e 200 L.", w: 3, h: 2, anchors: 3, anchorsExpanded: 3, shell: 90_000, upkeep: 6_000, parcels: ["fondazione"], tech: null, max: 1, role: "operator", roleLabel: "Operatori", need: { 2: "cappa" } },
  { type: "plant", name: "Impianto GMP", blurb: "Sintesi a regime. Ci vogliono kW e lo spogliatoio.", w: 4, h: 3, anchors: 6, anchorsExpanded: 6, shell: 220_000, upkeep: 16_000, parcels: ["produzione"], tech: "classeC", max: 2, role: "operator", roleLabel: "Operatori", need: { 2: "cip", 3: "hvac" } },
  { type: "pack", name: "Confezionamento", blurb: "Alza la paga di ogni lotto.", w: 3, h: 2, anchors: 3, anchorsExpanded: 3, shell: 100_000, upkeep: 6_000, parcels: ["logistica", "produzione"], tech: "packaging", max: 1, role: "operator", roleLabel: "Operatori", need: {} },
  { type: "sterile", name: "Suite sterile", blurb: "Biologici. Serve il loop acque e tanto freddo.", w: 4, h: 3, anchors: 6, anchorsExpanded: 6, shell: 260_000, upkeep: 22_000, parcels: ["produzione"], tech: "asettico", max: 1, role: "operator", roleLabel: "Operatori", need: { 2: "hvacb", 3: "wfi-ready" } },
  { type: "qc", name: "Laboratorio QC", blurb: "Bilancia subito, HPLC quando hai l'analitica.", w: 2, h: 2, anchors: 2, anchorsExpanded: 3, shell: 45_000, upkeep: 3_000, parcels: ["fondazione", "scienza"], tech: null, max: 2, role: "qa", roleLabel: "Analisti", expand: "e", need: {} },
  { type: "stability", name: "Stabilità", blurb: "Apre i contratti premium lunghi.", w: 2, h: 2, anchors: 2, anchorsExpanded: 2, shell: 75_000, upkeep: 4_000, parcels: ["scienza"], tech: "stabilita", max: 1, role: "qa", roleLabel: "Analisti", need: {} },
  { type: "discovery", name: "Lab scoperta", blurb: "Dalla scoperta al lead. Non fa la preclinica.", w: 3, h: 2, anchors: 3, anchorsExpanded: 3, shell: 110_000, upkeep: 8_000, parcels: ["scienza"], tech: "scoperta", max: 1, role: "scientist", roleLabel: "Scienziati", need: {} },
  { type: "preclinical", name: "Lab preclinico", blurb: "Solo la preclinica, in vitro.", w: 3, h: 3, anchors: 4, anchorsExpanded: 4, shell: 160_000, upkeep: 10_000, parcels: ["scienza"], tech: "preclinica", max: 1, role: "scientist", roleLabel: "Scienziati", need: { 2: "freezer-campioni" } },
  { type: "phase1", name: "Unità fase I", blurb: "Uno studio alla volta.", w: 3, h: 2, anchors: 3, anchorsExpanded: 3, shell: 180_000, upkeep: 12_000, parcels: ["clinica"], tech: "clinica1", max: 1, role: "clinical", roleLabel: "Clinici", need: {} },
  { type: "phase23", name: "Unità fase II/III", blurb: "La fase III chiede l'archivio TMF.", w: 4, h: 3, anchors: 6, anchorsExpanded: 6, shell: 260_000, upkeep: 16_000, parcels: ["clinica"], tech: "clinica2", max: 1, role: "clinical", roleLabel: "Clinici", need: {} },
  { type: "regulatory", name: "Affari regolatori", blurb: "Brevetti e invio all'autorità.", w: 2, h: 2, anchors: 2, anchorsExpanded: 2, shell: 90_000, upkeep: 6_000, parcels: ["scienza", "clinica"], tech: "affari", max: 1, role: "regulatory", roleLabel: "Regolatori", need: {} },
  { type: "power", name: "Centralina", blurb: "Senza, resti a 6 kW.", w: 2, h: 2, anchors: 2, anchorsExpanded: 2, shell: 70_000, upkeep: 3_000, parcels: ["produzione"], tech: "utilities", max: 1, role: null, roleLabel: "", need: {} },
  { type: "water", name: "Acque", blurb: "Loop PW obbligatorio per la suite.", w: 2, h: 2, anchors: 2, anchorsExpanded: 2, shell: 85_000, upkeep: 4_000, parcels: ["produzione"], tech: "acque", max: 1, role: null, roleLabel: "", need: {} },
];

export const GEAR: GearDef[] = [
  { id: "scrivania", name: "Scrivania", kind: "furn", room: "hq", tech: null, cost: 0, upkeep: 0, kw: 0, supply: 0, maxLevel: 1, limit: 1 },
  { id: "sala", name: "Sala contratti", kind: "furn", room: "hq", tech: "commerciale", cost: 30_000, upkeep: 1_000, kw: 0, supply: 0, maxLevel: 1, limit: 1 },
  { id: "armadietti", name: "Armadietti", kind: "furn", room: "gown", tech: "gmp", cost: 12_000, upkeep: 0, kw: 0, supply: 0, maxLevel: 1, limit: 1 },
  { id: "badge", name: "Monitoraggio accessi", kind: "util", room: "gown", tech: "gmp", cost: 25_000, upkeep: 1_000, kw: 1, supply: 0, maxLevel: 1, limit: 1 },
  { id: "scaffale", name: "Scaffale", kind: "machine", room: "warehouse", tech: null, cost: 25_000, upkeep: 1_000, kw: 1, supply: 0, maxLevel: 3, limit: 4, mats: true },
  { id: "transpallet", name: "Transpallet", kind: "furn", room: "warehouse", tech: "acquisti", cost: 18_000, upkeep: 0, kw: 0, supply: 0, maxLevel: 1, limit: 1 },
  { id: "accettazione", name: "Banco accettazione", kind: "furn", room: "warehouse", tech: "acquisti", cost: 22_000, upkeep: 1_000, kw: 0, supply: 0, maxLevel: 1, limit: 1 },
  { id: "gabbia", name: "Gabbia di quarantena", kind: "machine", room: "quarantine", tech: "analitica", cost: 40_000, upkeep: 1_000, kw: 1, supply: 0, maxLevel: 1, limit: 1 },
  { id: "registro", name: "Registro lotti", kind: "furn", room: "quarantine", tech: "analitica", cost: 15_000, upkeep: 0, kw: 0, supply: 0, maxLevel: 1, limit: 1 },
  { id: "freezer", name: "Freezer", kind: "machine", room: "cold", tech: "freddo", cost: 55_000, upkeep: 2_000, kw: 3, supply: 0, maxLevel: 3, limit: 1 },
  { id: "allarme", name: "Allarme temperatura", kind: "util", room: "cold", tech: "freddo", cost: 20_000, upkeep: 1_000, kw: 1, supply: 0, maxLevel: 1, limit: 1 },
  { id: "baia", name: "Baia di carico", kind: "machine", room: "shipping", tech: "packaging", cost: 45_000, upkeep: 2_000, kw: 1, supply: 0, maxLevel: 1, limit: 1 },
  { id: "gdp", name: "Logger GDP", kind: "util", room: "shipping", tech: "lancio", cost: 35_000, upkeep: 1_000, kw: 1, supply: 0, maxLevel: 1, limit: 1 },
  { id: "reattore", name: "Reattore da banco", kind: "machine", room: "pilot", tech: null, cost: 85_000, upkeep: 3_000, kw: 3, supply: 0, maxLevel: 3, limit: 1, levelTech: { 2: "reattore50", 3: "scaleup" } },
  { id: "cappa", name: "Cappa", kind: "furn", room: "pilot", tech: "gmp", cost: 20_000, upkeep: 0, kw: 1, supply: 0, maxLevel: 1, limit: 1 },
  { id: "filtro-pilota", name: "Filtro in linea", kind: "machine", room: "pilot", tech: "analitica", cost: 60_000, upkeep: 2_000, kw: 2, supply: 0, maxLevel: 1, limit: 1 },
  { id: "reattore-gmp", name: "Reattore GMP", kind: "machine", room: "plant", tech: "classeC", cost: 420_000, upkeep: 12_000, kw: 6, supply: 0, maxLevel: 3, limit: 1 },
  { id: "filtro", name: "Filtro pressa", kind: "machine", room: "plant", tech: "classeC", cost: 140_000, upkeep: 4_000, kw: 2, supply: 0, maxLevel: 1, limit: 1 },
  { id: "riempimento", name: "Linea di riempimento", kind: "machine", room: "plant", tech: "packaging", cost: 180_000, upkeep: 5_000, kw: 3, supply: 0, maxLevel: 1, limit: 1 },
  { id: "cip", name: "CIP", kind: "util", room: "plant", tech: "classeC", cost: 90_000, upkeep: 3_000, kw: 2, supply: 0, maxLevel: 1, limit: 1 },
  { id: "hvac", name: "HVAC di sala", kind: "util", room: "plant", tech: "classeC", cost: 110_000, upkeep: 4_000, kw: 3, supply: 0, maxLevel: 1, limit: 1 },
  { id: "ipc", name: "Banco IPC", kind: "furn", room: "plant", tech: "analitica", cost: 25_000, upkeep: 1_000, kw: 1, supply: 0, maxLevel: 1, limit: 1 },
  { id: "bioreattore", name: "Bioreattore", kind: "machine", room: "sterile", tech: "asettico", cost: 780_000, upkeep: 18_000, kw: 8, supply: 0, maxLevel: 3, limit: 1 },
  { id: "isolatore", name: "Isolatore", kind: "machine", room: "sterile", tech: "asettico", cost: 260_000, upkeep: 6_000, kw: 4, supply: 0, maxLevel: 1, limit: 1 },
  { id: "fill-sterile", name: "Riempimento asettico", kind: "machine", room: "sterile", tech: "asettico", cost: 220_000, upkeep: 5_000, kw: 3, supply: 0, maxLevel: 1, limit: 1 },
  { id: "hvacb", name: "HVAC classe B", kind: "util", room: "sterile", tech: "asettico", cost: 160_000, upkeep: 5_000, kw: 4, supply: 0, maxLevel: 1, limit: 1 },
  { id: "vestizione", name: "Banco vestizione", kind: "furn", room: "sterile", tech: "asettico", cost: 20_000, upkeep: 0, kw: 0, supply: 0, maxLevel: 1, limit: 1 },
  { id: "blister", name: "Blisteratrice", kind: "machine", room: "pack", tech: "packaging", cost: 120_000, upkeep: 4_000, kw: 3, supply: 0, maxLevel: 3, limit: 1 },
  { id: "astuccio", name: "Astucciatrice", kind: "machine", room: "pack", tech: "packaging", cost: 80_000, upkeep: 2_000, kw: 2, supply: 0, maxLevel: 1, limit: 1 },
  { id: "serial", name: "Serializzazione", kind: "util", room: "pack", tech: "lancio", cost: 100_000, upkeep: 2_000, kw: 1, supply: 0, maxLevel: 1, limit: 1 },
  { id: "bilancia", name: "Bilancia e pH", kind: "furn", room: "qc", tech: null, cost: 12_000, upkeep: 0, kw: 0, supply: 0, maxLevel: 1, limit: 1 },
  { id: "hplc", name: "HPLC", kind: "machine", room: "qc", tech: "analitica", cost: 160_000, upkeep: 4_000, kw: 2, supply: 0, maxLevel: 3, limit: 1 },
  { id: "micro", name: "Microbiologia", kind: "machine", room: "qc", tech: "analitica", cost: 140_000, upkeep: 4_000, kw: 2, supply: 0, maxLevel: 3, limit: 1, needExpand: true },
  { id: "climatica", name: "Camera climatica", kind: "machine", room: "stability", tech: "stabilita", cost: 150_000, upkeep: 4_000, kw: 3, supply: 0, maxLevel: 1, limit: 1 },
  { id: "archivio-stab", name: "Archivio stabilità", kind: "furn", room: "stability", tech: "stabilita", cost: 30_000, upkeep: 1_000, kw: 0, supply: 0, maxLevel: 1, limit: 1 },
  { id: "banco", name: "Banco chimico", kind: "furn", room: "discovery", tech: "scoperta", cost: 20_000, upkeep: 0, kw: 1, supply: 0, maxLevel: 1, limit: 1 },
  { id: "lcms", name: "LC-MS", kind: "machine", room: "discovery", tech: "scoperta", cost: 210_000, upkeep: 6_000, kw: 3, supply: 0, maxLevel: 3, limit: 1 },
  { id: "sintetizzatore", name: "Sintetizzatore", kind: "machine", room: "discovery", tech: "scaleup", cost: 160_000, upkeep: 4_000, kw: 2, supply: 0, maxLevel: 1, limit: 1 },
  { id: "saggi", name: "Piattaforma saggi", kind: "machine", room: "preclinical", tech: "preclinica", cost: 180_000, upkeep: 5_000, kw: 2, supply: 0, maxLevel: 3, limit: 1 },
  { id: "toss", name: "Tossicologia in vitro", kind: "machine", room: "preclinical", tech: "preclinica", cost: 150_000, upkeep: 4_000, kw: 2, supply: 0, maxLevel: 1, limit: 1 },
  { id: "freezer-campioni", name: "Freezer campioni", kind: "furn", room: "preclinical", tech: "freddo", cost: 40_000, upkeep: 1_000, kw: 2, supply: 0, maxLevel: 1, limit: 1 },
  { id: "pharmacy", name: "Pharmacy clinica", kind: "furn", room: "phase1", tech: "clinica1", cost: 40_000, upkeep: 1_000, kw: 1, supply: 0, maxLevel: 1, limit: 1 },
  { id: "monitor-1", name: "Monitoraggio", kind: "machine", room: "phase1", tech: "clinica1", cost: 120_000, upkeep: 3_000, kw: 1, supply: 0, maxLevel: 3, limit: 1 },
  { id: "letti", name: "Unità letti", kind: "machine", room: "phase1", tech: "clinica1", cost: 90_000, upkeep: 3_000, kw: 1, supply: 0, maxLevel: 1, limit: 1 },
  { id: "unitdose", name: "Unit dose", kind: "machine", room: "phase23", tech: "clinica2", cost: 160_000, upkeep: 4_000, kw: 2, supply: 0, maxLevel: 1, limit: 1 },
  { id: "monitor-2", name: "Monitoraggio centrale", kind: "machine", room: "phase23", tech: "clinica2", cost: 140_000, upkeep: 3_000, kw: 2, supply: 0, maxLevel: 3, limit: 1 },
  { id: "biostat", name: "Biostatistica", kind: "furn", room: "phase23", tech: "clinica3", cost: 80_000, upkeep: 2_000, kw: 1, supply: 0, maxLevel: 1, limit: 1 },
  { id: "pv", name: "Farmacovigilanza", kind: "furn", room: "phase23", tech: "clinica3", cost: 50_000, upkeep: 2_000, kw: 0, supply: 0, maxLevel: 1, limit: 1 },
  { id: "imp", name: "Magazzino IMP", kind: "machine", room: "phase23", tech: "clinica2", cost: 70_000, upkeep: 2_000, kw: 1, supply: 0, maxLevel: 1, limit: 1 },
  { id: "tmf", name: "Archivio TMF", kind: "util", room: "phase23", tech: "clinica3", cost: 60_000, upkeep: 1_000, kw: 0, supply: 0, maxLevel: 1, limit: 1 },
  { id: "dossier", name: "Archivio dossier", kind: "machine", room: "regulatory", tech: "affari", cost: 70_000, upkeep: 2_000, kw: 1, supply: 0, maxLevel: 3, limit: 1 },
  { id: "brevetti-desk", name: "Banco brevetti", kind: "furn", room: "regulatory", tech: "brevetti", cost: 40_000, upkeep: 1_000, kw: 0, supply: 0, maxLevel: 1, limit: 1 },
  { id: "trasformatore", name: "Trasformatore", kind: "supply", room: "power", tech: "utilities", cost: 80_000, upkeep: 2_000, kw: 0, supply: 10, maxLevel: 3, limit: 1 },
  { id: "generatore", name: "Gruppo elettrogeno", kind: "supply", room: "power", tech: "utilities", cost: 70_000, upkeep: 2_000, kw: 0, supply: 8, maxLevel: 3, limit: 1 },
  { id: "pw", name: "Loop PW", kind: "machine", room: "water", tech: "acque", cost: 100_000, upkeep: 3_000, kw: 2, supply: 0, maxLevel: 1, limit: 1 },
  { id: "wfi", name: "Loop WFI", kind: "machine", room: "water", tech: "acque", cost: 170_000, upkeep: 4_000, kw: 3, supply: 0, maxLevel: 1, limit: 1 },
];

export const ERA_LABEL: Record<Era, string> = { early: "Inizio", mid: "Crescita", late: "Espansione", oltre: "Oltre" };
export const INDICATION_BOOK: { name: string; risk: number; pull: number; note: string }[] = [
  { name: "Infezioni", risk: 0.08, pull: 1.05, note: "Tanti pazienti. I trial si leggono bene." },
  { name: "Oncologia", risk: 0.16, pull: 1.28, note: "Mercato grosso. Cade più spesso." },
  { name: "Metabolico", risk: 0.1, pull: 1.08, note: "Domanda larga, concorrenza vicina." },
  { name: "Malattie rare", risk: 0.06, pull: 0.86, note: "Pochi pazienti. In licenza rende di più." },
  { name: "Immunologia", risk: 0.12, pull: 1.16, note: "Vuole una preclinica pulita." },
  { name: "Cardiologia", risk: 0.14, pull: 1.12, note: "La fase III è lunga e cara." },
  { name: "Neurologia", risk: 0.2, pull: 1.34, note: "Il premio alto. Anche il fallimento." },
  { name: "Respiratorio", risk: 0.09, pull: 1, note: "Se arriva una pandemia, vende di più." },
];
export const INDICATIONS = INDICATION_BOOK.map((item) => item.name);
export const AUTHORITIES = [
  { id: "aifa", name: "AIFA", weeks: 6, strict: 0.18, blurb: "Veloce. Il mercato resta europeo." },
  { id: "ema", name: "EMA", weeks: 10, strict: 0.26, blurb: "La via di mezzo, tempi medi." },
  { id: "fda", name: "FDA", weeks: 12, strict: 0.32, blurb: "Lunga e stretta. Se passa, la quota sale." },
];
export const STAGE_NEED: Partial<Record<Stage, number>> = { discovery: 4, lead: 5, preclinical: 6, phase1: 6, phase2: 8, phase3: 10, dossier: 4 };
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
  Fondazione: "Corridoio, magazzino, reattore da banco. I lotti piccoli pagano gli stipendi.",
  Officina: "Tieni la linea collegata e compra solo ciò che una tecnica ha sbloccato.",
  CDMO: "Impianto, qualità, kW. I contratti grossi finanziano il laboratorio.",
  Ricerca: "La scoperta non fa la preclinica. Sono due stanze.",
  Clinica: "Fasi lunghe. Una licenza è un'uscita, non una sconfitta.",
  "Big Pharma": "Spedisci, difendi il prezzo, non far scadere il brevetto.",
  Piattaforma: "Il secondo farmaco sta nel layout, non in un cubo in più.",
};

const FIRST = ["Giulia", "Marco", "Lea", "Davide", "Noor", "Chiara", "Andrea", "Sara", "Luca", "Marta", "Elena", "Pietro"];
const LAST = ["Riva", "Conti", "Greco", "Ferrari", "Sala", "Costa", "Marini", "Gallo", "Leone", "Vitale"];
const BOOK: { id: string; name: string; taste: Tier; note: string; trust: number }[] = [
  { id: "lumen", name: "Lumen", taste: "pilota", note: "Prima fornitura. Specifica morbida.", trust: 36 },
  { id: "oster", name: "Oster & Vale", taste: "standard", note: "Vuole la data, non le scuse.", trust: 34 },
  { id: "marrow", name: "Marrow", taste: "premium", note: "Scala clinica. Uno scarto basta.", trust: 28 },
  { id: "siena", name: "Siena Labs", taste: "standard", note: "Se chiudi pulito, torna.", trust: 40 },
  { id: "quill", name: "Quill", taste: "pilota", note: "Cede processi. Paga poco.", trust: 30 },
  { id: "nord", name: "Nordlicht", taste: "sterile", note: "Solo flaconi, solo suite.", trust: 26 },
  { id: "petra", name: "Petra Bio", taste: "sterile", note: "Biologici. Isolatore o niente.", trust: 24 },
  { id: "ilex", name: "Ilex", taste: "premium", note: "Urgenze di fine trimestre.", trust: 32 },
  { id: "monte", name: "Monteluce", taste: "standard", note: "Ospedale. Conta la reputazione.", trust: 38 },
  { id: "nara", name: "Nara", taste: "pilota", note: "Startup. Cresce se cresci tu.", trust: 22 },
];
const BLURB: Record<Shape, string> = {
  campione: "Due lotti piccoli, per vedere se il processo regge.",
  fornitura: "Se chiudi senza scarti, la casa rimette un ordine sul tavolo.",
  urgenza: "Finestra corta. Si paga meglio, ma la data non si sposta.",
  trasferimento: "Poca cassa. A fine lavoro resta il processo, in scienza.",
};
export const TIER_LABEL: Record<Tier, string> = { pilota: "Pilota", standard: "Standard", premium: "Scala", sterile: "Sterile" };
export const SHAPE_LABEL: Record<Shape, string> = { campione: "Prova", fornitura: "Campagna", urgenza: "Urgenza", trasferimento: "Processo" };
const MAT_PRICE: Record<MatKey | "vials", number> = { api: 7800, solvent: 2200, eccipient: 1600, vials: 3800 };

export function roomDef(type: RoomType) {
  return ROOMS.find((r) => r.type === type)!;
}
export function gearDef(id: string) {
  return GEAR.find((g) => g.id === id)!;
}
export function techDef(id: TechId) {
  return TECH.find((t) => t.id === id)!;
}
export function parcelAt(c: number, r: number) {
  return PARCELS.find((p) => c >= p.c0 && c < p.c1 && r >= p.r0 && r < p.r1) ?? null;
}
export function hasTech(g: Game, id: TechId) {
  return g.tech.includes(id);
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
function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}
function nid(g: Game, prefix: string) {
  g.seq += 1;
  return `${prefix}${g.seq}`;
}

export function roomTiles(room: Room) {
  const tiles: { c: number; r: number }[] = [];
  for (let r = room.r; r < room.r + room.h; r++) for (let c = room.c; c < room.c + room.w; c++) tiles.push({ c, r });
  return tiles;
}
export function anchorsOf(room: Room) {
  const def = roomDef(room.type);
  return room.expanded ? def.anchorsExpanded : def.anchors;
}
export function anchorTiles(room: Room) {
  return roomTiles(room).slice(0, anchorsOf(room));
}

function person(g: Game, role: Role, skill: number): Staff {
  const base: Record<Role, number> = { scientist: 9000, operator: 6200, qa: 7000, clinical: 8500, regulatory: 8000, commercial: 7500 };
  return {
    id: nid(g, "p"),
    name: `${FIRST[Math.floor(roll(g.seq + 3) * FIRST.length)]} ${LAST[Math.floor(roll(g.seq + 9) * LAST.length)]}`,
    role,
    skill,
    salary: Math.round(base[role] * (0.84 + skill * 0.07)),
    roomId: null,
  };
}

function blankTiles(): Tile[][] {
  const tiles: Tile[][] = [];
  for (let r = 0; r < ROWS; r++) {
    const row: Tile[] = [];
    for (let c = 0; c < COLS; c++) row.push({ corridor: false, roomId: null, ground: c >= 6 && c <= 7 && r >= 6 && r <= 7 ? "garden" : "lot" });
    tiles.push(row);
  }
  return tiles;
}

export function newGame(name: string, focus: Focus): Game {
  const g: Game = {
    v: 3,
    name: name.trim().slice(0, 22) || "Aurelia",
    focus,
    week: 1,
    cash: 2_400_000,
    reputation: 46,
    quality: 42,
    seq: 1,
    owned: ["fondazione"],
    tiles: blankTiles(),
    rooms: [],
    staff: [],
    candidates: [],
    api: 10,
    solvent: 8,
    eccipient: 8,
    vials: 0,
    science: 1,
    tech: focus === "biologici" ? ["gmp"] : [],
    autoBuy: true,
    clients: clientBook(),
    offers: [],
    jobs: [],
    pipeline: [],
    products: [],
    rivals: [
      { id: "helix", name: "Helix Nord", share: 31, note: "Conto terzi, prezzi stabili." },
      { id: "vanta", name: "Vanta Bio", share: 27, note: "Ti contende i biologici." },
      { id: "kite", name: "Kite & Morrow", share: 24, note: "Brevetti grossi, reazioni lente." },
    ],
    log: [],
    chapter: "Fondazione",
    goals: [],
    market: { apiPrice: 7800, demand: 40 },
    mod: null,
    playerShare: 0,
    refinanced: false,
    nextEvent: 10,
    stats: { batches: 0, revenue: 0, approvals: 0, launches: 0, licenses: 0 },
    history: [2_400_000],
  };
  const hq: Room = { id: "hq", type: "hq", level: 1, c: 1, r: 1, w: 2, h: 2, expanded: false, halt: 0, slots: [{ item: { defId: "scrivania", level: 1 } }, { item: null }] };
  g.rooms.push(hq);
  for (const t of roomTiles(hq)) g.tiles[t.r]![t.c]!.roomId = hq.id;
  for (const [c, r] of [[3, 1], [3, 2], [4, 2]] as const) g.tiles[r]![c]!.corridor = true;
  g.staff.push(person(g, "scientist", 3), person(g, "operator", 3));
  g.candidates.push(person(g, "qa", 3), person(g, "operator", 4), person(g, "commercial", 2));
  pushLog(g, `${g.name} ha solo il lotto fondazione. Allunga il corridoio, poi magazzino e pilota.`, "info");
  refreshOffers(g, true);
  return g;
}

export function normalize(input: unknown): Game | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as { v?: number };
  if (raw.v !== 3) return null;
  const g = input as Game;
  if (!g.tiles || !g.rooms || !g.name) return null;
  g.owned ??= ["fondazione"];
  g.tech ??= [];
  g.pipeline ??= [];
  g.products ??= [];
  g.jobs ??= [];
  g.offers ??= [];
  heal(g);
  return g;
}

export function pushLog(g: Game, text: string, tone: Tone) {
  g.log.unshift({ week: g.week, text, tone });
  if (g.log.length > 40) g.log.length = 40;
}

export function ownedBounds(g: Game) {
  let c0 = COLS;
  let r0 = ROWS;
  let c1 = 0;
  let r1 = 0;
  for (const id of g.owned) {
    const p = PARCELS.find((x) => x.id === id)!;
    c0 = Math.min(c0, p.c0);
    r0 = Math.min(r0, p.r0);
    c1 = Math.max(c1, p.c1);
    r1 = Math.max(r1, p.r1);
  }
  return { c0, r0, c1, r1 };
}

export function gearList(g: Game, defId?: string) {
  const found: { room: Room; index: number; item: Gear }[] = [];
  for (const room of g.rooms) {
    room.slots.forEach((slot, index) => {
      if (!slot.item) return;
      if (!defId || slot.item.defId === defId) found.push({ room, index, item: slot.item });
    });
  }
  return found;
}
export function hasGear(g: Game, defId: string) {
  return gearList(g, defId).length > 0;
}
export function staffIn(g: Game, roomId: string, role?: Role) {
  return g.staff.filter((s) => s.roomId === roomId && (!role || s.role === role));
}
export function slotsFor(room: Room) {
  const tiles = roomTiles(room).length;
  let n = tiles >= 8 ? 2 : 1;
  if (room.type === "hq") n = Math.max(n, 2);
  if (room.level >= 3) n += 1;
  return n;
}

export function onlineSet(g: Game) {
  const seen = new Set<string>();
  const hq = g.rooms.find((r) => r.type === "hq");
  if (!hq) return seen;
  const q: { c: number; r: number }[] = [];
  const step = (c: number, r: number) => {
    const key = `${c},${r}`;
    if (seen.has(key)) return;
    const tile = g.tiles[r]?.[c];
    if (!tile || (!tile.corridor && !tile.roomId)) return;
    seen.add(key);
    q.push({ c, r });
  };
  for (const t of roomTiles(hq)) step(t.c, t.r);
  while (q.length) {
    const p = q.pop()!;
    step(p.c + 1, p.r);
    step(p.c - 1, p.r);
    step(p.c, p.r + 1);
    step(p.c, p.r - 1);
  }
  return seen;
}
export function roomOnline(g: Game, room: Room) {
  const seen = onlineSet(g);
  return roomTiles(room).some((t) => seen.has(`${t.c},${t.r}`));
}

export type PowerReport = { supply: number; demand: number; off: { roomId: string; index: number }[] };

export function powerReport(g: Game): PowerReport {
  let supply = 6;
  const loads: { roomId: string; index: number; kw: number; supply: number }[] = [];
  for (const room of g.rooms) {
    if (!roomOnline(g, room) || room.halt > 0) continue;
    room.slots.forEach((slot, index) => {
      if (!slot.item) return;
      const def = gearDef(slot.item.defId);
      if (def.supply > 0) supply += def.supply * slot.item.level * (def.id === "trasformatore" ? room.level : 1);
      else if (def.kw > 0) {
        const kw = def.id === "reattore" ? 2 + slot.item.level : def.kw;
        loads.push({ roomId: room.id, index, kw, supply: 0 });
      }
    });
  }
  loads.sort((a, b) => b.kw - a.kw);
  const off: { roomId: string; index: number }[] = [];
  let left = supply;
  let demand = 0;
  for (const load of loads) {
    demand += load.kw;
    if (load.kw <= left) left -= load.kw;
    else off.push({ roomId: load.roomId, index: load.index });
  }
  return { supply, demand, off };
}
export function gearOn(g: Game, roomId: string, index: number) {
  const room = g.rooms.find((item) => item.id === roomId);
  if (!room || room.halt > 0 || !room.slots[index]?.item || !roomOnline(g, room)) return false;
  return !powerReport(g).off.some((hit) => hit.roomId === roomId && hit.index === index);
}
function itemOn(g: Game, defId: string) {
  return gearList(g, defId).some((hit) => gearOn(g, hit.room.id, hit.index) && roomOnline(g, hit.room) && hit.room.halt === 0);
}
function itemLevel(g: Game, defId: string) {
  const hits = gearList(g, defId).filter((hit) => gearOn(g, hit.room.id, hit.index));
  if (!hits.length) return 0;
  return Math.max(...hits.map((hit) => hit.item.level));
}

export function apiPrice(g: Game) {
  const mul = (g.mod ? g.mod.apiMul : 1) * (hasGear(g, "accettazione") ? 0.92 : 1);
  return Math.round(g.market.apiPrice * mul);
}
export function matPrice(g: Game, key: MatKey | "vials") {
  const mul = key === "vials" || !g.mod ? 1 : g.mod.apiMul;
  return Math.round(MAT_PRICE[key] * mul * (key !== "vials" && hasGear(g, "accettazione") ? 0.92 : 1));
}
export function demandOf(g: Game) {
  return g.market.demand + (g.mod ? g.mod.demandAdd : 0);
}

export function capOf(g: Game, key: MatKey | "vials") {
  if (key === "vials") {
    let n = 0;
    for (const hit of gearList(g, "freezer")) n += 18 * hit.item.level * hit.room.level;
    return n;
  }
  let n = 12;
  for (const room of g.rooms.filter((r) => r.type === "warehouse")) {
    const bonus = room.slots.some((s) => s.item?.defId === "transpallet") ? 1.1 : 1;
    for (const slot of room.slots) {
      if (slot.item?.defId === "scaffale" && slot.item.mat === key) n += Math.round(25 * slot.item.level * room.level * bonus);
    }
  }
  return n;
}

function countType(g: Game, type: RoomType) {
  return g.rooms.filter((r) => r.type === type).length;
}
function maxRooms(g: Game, type: RoomType) {
  if (type === "discovery" && hasTech(g, "piattaforma")) return 2;
  return roomDef(type).max;
}

export function canCorridor(g: Game, c: number, r: number) {
  const tile = g.tiles[r]?.[c];
  const parcel = parcelAt(c, r);
  if (!tile || !parcel) return "Fuori mappa.";
  if (!g.owned.includes(parcel.id)) return "Lotto non tuo.";
  if (tile.ground === "garden") return "Il cortile resta verde.";
  if (tile.roomId) return "C'è già una stanza.";
  if (tile.corridor) return "Corridoio già posato.";
  if (g.cash < 8_000) return "Cassa insufficiente.";
  return null;
}
export function placeCorridor(g: Game, c: number, r: number) {
  const err = canCorridor(g, c, r);
  if (err) return err;
  const next = structuredClone(g) as Game;
  next.cash -= 8_000;
  next.tiles[r]![c]!.corridor = true;
  markGoals(next);
  return next;
}
export function removeCorridor(g: Game, c: number, r: number) {
  const tile = g.tiles[r]?.[c];
  if (!tile?.corridor) return g;
  const next = structuredClone(g) as Game;
  next.tiles[r]![c]!.corridor = false;
  next.cash += 4_000;
  return next;
}

export function canPlace(g: Game, type: RoomType, c: number, r: number) {
  const def = roomDef(type);
  if (type === "hq") return "La direzione c'è già.";
  if (def.tech && !hasTech(g, def.tech)) return `Prima la tecnica «${techDef(def.tech).name}».`;
  if (countType(g, type) >= maxRooms(g, type)) return "Non puoi averne un'altra.";
  if (g.cash < def.shell) return "Cassa insufficiente.";
  for (let rr = r; rr < r + def.h; rr++) {
    for (let cc = c; cc < c + def.w; cc++) {
      const tile = g.tiles[rr]?.[cc];
      const parcel = parcelAt(cc, rr);
      if (!tile || !parcel) return "Esce dalla mappa. Tocca l'angolo nord-ovest.";
      if (!g.owned.includes(parcel.id)) return "Il lotto non è tuo.";
      if (!def.parcels.includes(parcel.id)) return `Questa stanza sta sul lotto ${def.parcels.map((id) => PARCELS.find((p) => p.id === id)!.name).join(" o ")}.`;
      if (tile.ground === "garden" || tile.corridor || tile.roomId) return "Spazio occupato.";
    }
  }
  return null;
}
export function placeRoom(g: Game, type: RoomType, c: number, r: number) {
  const err = canPlace(g, type, c, r);
  if (err) return err;
  const def = roomDef(type);
  const next = structuredClone(g) as Game;
  next.cash -= def.shell;
  const room: Room = {
    id: nid(next, "s"),
    type,
    level: 1,
    c,
    r,
    w: def.w,
    h: def.h,
    expanded: false,
    halt: 0,
    slots: Array.from({ length: def.anchors }, () => ({ item: null })),
  };
  next.rooms.push(room);
  for (const t of roomTiles(room)) next.tiles[t.r]![t.c]!.roomId = room.id;
  pushLog(next, `${def.name} posata. Senza macchine non lavora.`, "good");
  if (!roomOnline(next, room)) pushLog(next, `${def.name} non è collegata alla direzione.`, "bad");
  markGoals(next);
  return next;
}

export function removeRoom(g: Game, id: string) {
  const next = structuredClone(g) as Game;
  const room = next.rooms.find((r) => r.id === id);
  if (!room || room.type === "hq") return g;
  if (room.slots.some((s) => s.item)) return "Prima togli macchine e arredi.";
  if (next.jobs.some((j) => j.roomId === id)) return "C'è un lotto in corso.";
  for (const s of next.staff) if (s.roomId === id) s.roomId = null;
  for (const job of next.jobs) if (job.prefer === id) job.prefer = null;
  for (const t of roomTiles(room)) next.tiles[t.r]![t.c]!.roomId = null;
  next.rooms = next.rooms.filter((r) => r.id !== id);
  next.cash += Math.round(roomDef(room.type).shell * 0.5);
  return next;
}

export function canExpand(g: Game, id: string) {
  const room = g.rooms.find((r) => r.id === id);
  if (!room) return "Stanza assente.";
  const def = roomDef(room.type);
  if (!def.expand || room.expanded) return "Non si allarga.";
  if (room.type === "warehouse" && !hasTech(g, "acquisti")) return "Prima la tecnica Ufficio acquisti.";
  if (room.type === "qc" && !hasTech(g, "analitica")) return "Prima la tecnica Analitica.";
  const cost = Math.round(def.shell * 0.7);
  if (g.cash < cost) return "Cassa insufficiente.";
  const boxes = def.expand === "s"
    ? Array.from({ length: room.w }, (_, i) => ({ c: room.c + i, r: room.r + room.h }))
    : Array.from({ length: room.h }, (_, i) => ({ c: room.c + room.w, r: room.r + i }));
  for (const box of boxes) {
    const tile = g.tiles[box.r]?.[box.c];
    const parcel = parcelAt(box.c, box.r);
    if (!tile || !parcel || !g.owned.includes(parcel.id) || !def.parcels.includes(parcel.id)) return "Oltre non c'è il tuo lotto.";
    if (tile.ground === "garden" || tile.corridor || tile.roomId) return "A fianco non c'è spazio.";
  }
  return null;
}
export function expandRoom(g: Game, id: string) {
  const err = canExpand(g, id);
  if (err) return err;
  const next = structuredClone(g) as Game;
  const room = next.rooms.find((r) => r.id === id)!;
  const def = roomDef(room.type);
  next.cash -= Math.round(def.shell * 0.7);
  if (def.expand === "s") room.h += 2;
  else room.w += 1;
  room.expanded = true;
  while (room.slots.length < def.anchorsExpanded) room.slots.push({ item: null });
  for (const t of roomTiles(room)) next.tiles[t.r]![t.c]!.roomId = room.id;
  pushLog(next, `${def.name} si allarga.`, "good");
  return next;
}

export function upgradeRoomCost(room: Room) {
  return roomDef(room.type).shell * room.level || 40_000;
}
export function upgradeRoom(g: Game, id: string) {
  const next = structuredClone(g) as Game;
  const room = next.rooms.find((r) => r.id === id);
  if (!room || room.level >= 3) return g;
  const need = roomDef(room.type).need[room.level + 1];
  if (need === "wfi-ready") {
    if (!itemOn(next, "wfi")) return "Prima il loop WFI nelle acque.";
  } else if (need && !room.slots.some((s) => s.item?.defId === need)) {
    return `Prima installa ${gearDef(need).name}.`;
  }
  const cost = upgradeRoomCost(room);
  if (next.cash < cost) return "Cassa insufficiente.";
  next.cash -= cost;
  room.level += 1;
  pushLog(next, `${roomDef(room.type).name} sale a livello ${room.level}.`, "good");
  return next;
}

export function canInstall(g: Game, roomId: string, index: number, defId: string, mat?: MatKey) {
  const room = g.rooms.find((r) => r.id === roomId);
  const def = GEAR.find((item) => item.id === defId);
  if (!room || !def) return "Non si può.";
  if (def.room !== room.type) return "Stanza sbagliata.";
  if (def.tech && !hasTech(g, def.tech)) return `Prima la tecnica «${techDef(def.tech).name}».`;
  if (def.needExpand && !room.expanded) return "Prima allarga la stanza.";
  if (index < 0 || index >= room.slots.length || room.slots[index]!.item) return "Posto occupato.";
  if (room.slots.filter((s) => s.item?.defId === defId).length >= def.limit) return "Ne hai già una.";
  if (def.mats && !mat) return "Scegli l'ingrediente.";
  if (g.cash < def.cost) return "Cassa insufficiente.";
  return null;
}
export function installGear(g: Game, roomId: string, index: number, defId: string, mat?: MatKey) {
  const err = canInstall(g, roomId, index, defId, mat);
  if (err) return err;
  const next = structuredClone(g) as Game;
  const room = next.rooms.find((r) => r.id === roomId)!;
  const def = gearDef(defId);
  next.cash -= def.cost;
  room.slots[index]!.item = { defId, level: 1, mat: def.mats ? mat : undefined };
  pushLog(next, `${def.name} installata in ${roomDef(room.type).name}.`, "good");
  markGoals(next);
  return next;
}
export function removeGear(g: Game, roomId: string, index: number) {
  const next = structuredClone(g) as Game;
  const room = next.rooms.find((r) => r.id === roomId);
  const item = room?.slots[index]?.item;
  if (!room || !item || item.defId === "scrivania") return g;
  next.cash += Math.round(gearDef(item.defId).cost * item.level * 0.4);
  room.slots[index]!.item = null;
  return next;
}
export function upgradeGear(g: Game, roomId: string, index: number) {
  const next = structuredClone(g) as Game;
  const room = next.rooms.find((r) => r.id === roomId);
  const item = room?.slots[index]?.item;
  if (!room || !item) return g;
  const def = gearDef(item.defId);
  if (item.level >= def.maxLevel) return "È già al massimo.";
  const tech = def.levelTech?.[item.level + 1];
  if (tech && !hasTech(next, tech)) return `Prima la tecnica «${techDef(tech).name}».`;
  const cost = def.cost * item.level;
  if (next.cash < cost) return "Cassa insufficiente.";
  next.cash -= cost;
  item.level += 1;
  const label = item.defId === "reattore" ? (item.level === 2 ? "Reattore 50 L" : "Reattore 200 L") : def.name;
  pushLog(next, `${label} sale a livello ${item.level}.`, "good");
  return next;
}

export function buyParcel(g: Game, id: ParcelId) {
  const parcel = PARCELS.find((p) => p.id === id);
  if (!parcel || g.owned.includes(id)) return g;
  if (!parcel.touch.some((t) => g.owned.includes(t))) return "Deve confinare con un lotto che hai già.";
  if (parcel.needBatch && g.stats.batches < 1) return "Consegna prima un lotto.";
  if (parcel.tech && !hasTech(g, parcel.tech)) return `Prima la tecnica «${techDef(parcel.tech).name}».`;
  if (g.cash < parcel.cost) return "Cassa insufficiente.";
  const next = structuredClone(g) as Game;
  next.cash -= parcel.cost;
  next.owned.push(id);
  pushLog(next, `Lotto ${parcel.name} acquistato.`, "good");
  markGoals(next);
  return next;
}

export function buyTech(g: Game, id: TechId) {
  const tech = techDef(id);
  if (hasTech(g, id)) return g;
  if (tech.need.some((n) => !hasTech(g, n))) return "Manca una tecnica precedente.";
  if (g.science < tech.sci) return "Scienza insufficiente.";
  if (g.cash < tech.cash) return "Cassa insufficiente.";
  const next = structuredClone(g) as Game;
  next.science -= tech.sci;
  next.cash -= tech.cash;
  next.tech.push(id);
  if (id === "gmp") next.quality = clamp(next.quality + 4, 0, 100);
  pushLog(next, `Tecnica sbloccata: ${tech.name}.`, "good");
  markGoals(next);
  return next;
}

export function hire(g: Game, id: string) {
  const next = structuredClone(g) as Game;
  const idx = next.candidates.findIndex((c) => c.id === id);
  if (idx < 0 || next.cash < 12_000) return g;
  const hired = next.candidates.splice(idx, 1)[0]!;
  next.cash -= 12_000;
  next.staff.push(hired);
  pushLog(next, `${hired.name} entra.`, "good");
  return next;
}
export function dismiss(g: Game, id: string) {
  const next = structuredClone(g) as Game;
  const gone = next.staff.find((s) => s.id === id);
  if (!gone) return g;
  next.staff = next.staff.filter((s) => s.id !== id);
  next.cash -= gone.salary * 2;
  pushLog(next, `${gone.name} esce. Liquidazione ${euro(gone.salary * 2)}.`, "info");
  return next;
}
export function assign(g: Game, staffId: string, roomId: string | null) {
  const next = structuredClone(g) as Game;
  const member = next.staff.find((s) => s.id === staffId);
  if (!member) return g;
  if (roomId) {
    const room = next.rooms.find((r) => r.id === roomId);
    if (!room) return g;
    const def = roomDef(room.type);
    if (!def.role || def.role !== member.role) return g;
    const used = staffIn(next, room.id).filter((s) => s.id !== member.id).length;
    if (used >= slotsFor(room)) return "Non ci sono posti.";
  }
  member.roomId = roomId;
  markGoals(next);
  return next;
}
export function train(g: Game, id: string) {
  if (!hasTech(g, "formazione")) return "Prima la tecnica Formazione.";
  const next = structuredClone(g) as Game;
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

export function orderMat(g: Game, key: MatKey | "vials", units: number) {
  const next = structuredClone(g) as Game;
  const have = key === "api" ? next.api : key === "solvent" ? next.solvent : key === "eccipient" ? next.eccipient : next.vials;
  const room = capOf(next, key) - have;
  const n = Math.max(0, Math.min(units, room));
  const cost = n * matPrice(next, key);
  if (n <= 0 || next.cash < cost) return g;
  next.cash -= cost;
  if (key === "api") next.api += n;
  else if (key === "solvent") next.solvent += n;
  else if (key === "eccipient") next.eccipient += n;
  else next.vials += n;
  return next;
}
export function setAutoBuy(g: Game, on: boolean) {
  const next = structuredClone(g) as Game;
  next.autoBuy = on;
  return next;
}
export function audit(g: Game) {
  if (!hasGear(g, "bilancia")) return "Serve la bilancia nel QC.";
  if (g.cash < 40_000) return "Cassa insufficiente.";
  const next = structuredClone(g) as Game;
  next.cash -= 40_000;
  next.quality = clamp(next.quality + 6, 0, 100);
  pushLog(next, "Audit interno. La qualità sale.", "good");
  return next;
}

function gownOk(g: Game) {
  return g.rooms.some((r) => r.type === "gown" && roomOnline(g, r) && r.slots.some((s) => s.item?.defId === "armadietti"));
}

function lineOf(g: Game, room: Room) {
  if (!roomOnline(g, room) || room.halt > 0) return null;
  if (staffIn(g, room.id, "operator").length === 0) return null;
  const on = (id: string) => room.slots.some((slot, index) => slot.item?.defId === id && gearOn(g, room.id, index));
  const lv = (id: string) => room.slots.find((s) => s.item?.defId === id)?.item?.level ?? 0;
  if (room.type === "pilot" && on("reattore")) {
    const m = lv("reattore");
    let vel = 0.7 * (0.6 + 0.2 * m) * (0.85 + 0.05 * room.level);
    if (on("filtro-pilota")) vel *= 1.08;
    return { room, kind: "pilot" as const, vel, m };
  }
  if (room.type === "plant" && on("reattore-gmp")) {
    if (!gownOk(g)) return null;
    const m = lv("reattore-gmp");
    let vel = 1 * (0.55 + 0.15 * m) * (0.85 + 0.05 * room.level);
    if (on("filtro")) vel *= 1.12;
    if (on("riempimento")) vel *= 1.15;
    if (hasTech(g, "continuo")) vel += 0.25;
    return { room, kind: "plant" as const, vel, m, fill: on("riempimento") };
  }
  if (room.type === "sterile" && on("bioreattore")) {
    if (!gownOk(g) || !itemOn(g, "pw")) return null;
    const m = lv("bioreattore");
    let vel = 0.62 * (0.6 + 0.13 * m) * (0.85 + 0.05 * room.level);
    vel *= on("isolatore") ? 1 : 0.5;
    if (itemOn(g, "wfi")) vel *= 1.1;
    return { room, kind: "sterile" as const, vel, m };
  }
  return null;
}

function clientBook(): Client[] {
  return BOOK.map((b) => ({ id: b.id, name: b.name, trust: b.trust, taste: b.taste, note: b.note, last: 0 }));
}
function spanWeeks(shape: Shape, batches: number, rush: boolean) {
  const base = shape === "urgenza" ? batches * 2 + 2 : shape === "trasferimento" ? batches * 4 + 3 : shape === "fornitura" ? batches * 3 + 4 : batches * 3 + 3;
  return Math.max(batches + 1, base - (rush ? 2 : 0));
}
function priced(base: number, clauses: Clauses) {
  let m = 1;
  if (clauses.rush) m *= 1.14;
  if (clauses.tight) m *= 1.1;
  if (clauses.penalty) m *= 1.08;
  return Math.round(base * m);
}
function patchOffer(o: Offer) {
  o.shape ??= o.tier === "pilota" ? "campione" : "fornitura";
  o.clauses ??= { rush: false, tight: false, penalty: false };
  o.basePay ??= o.pay;
  o.baseQuality ??= o.quality;
  o.dueWeeks ??= spanWeeks(o.shape, o.batches, o.clauses.rush);
  o.science ??= 0;
  o.blurb ??= BLURB[o.shape];
  o.clientId ??= BOOK.find((b) => b.name === o.client)?.id ?? "lumen";
  o.quality = o.baseQuality + (o.clauses.tight ? 8 : 0);
  o.pay = priced(o.basePay, o.clauses);
}
function patchJob(g: Game, j: Job) {
  patchOffer(j);
  j.due ??= g.week + j.dueWeeks;
  j.scrap ??= 0;
  j.prefer ??= null;
  j.lateHit ??= false;
  j.penalScrap ??= false;
  j.progress ??= 0;
  j.done ??= 0;
}
function heal(g: Game) {
  if (!Array.isArray(g.clients) || g.clients.length === 0) g.clients = clientBook();
  else for (const seed of clientBook()) if (!g.clients.some((c) => c.id === seed.id)) g.clients.push(seed);
  for (const offer of g.offers) patchOffer(offer);
  for (const job of g.jobs) patchJob(g, job);
  g.pipeline ??= [];
  for (const program of g.pipeline) {
    program.modality ??= "chimica";
    program.heat ??= 0;
    program.rivalId ??= null;
  }
}
export function sellerOn(g: Game) {
  return g.staff.some((s) => s.role === "commercial" && s.roomId && g.rooms.find((r) => r.id === s.roomId)?.type === "hq") && hasGear(g, "sala");
}
function deskCap(g: Game) {
  return sellerOn(g) ? 4 : 3;
}
function fitsTier(tier: Tier, kind: "pilot" | "plant" | "sterile", m: number) {
  if (tier === "sterile") return kind === "sterile";
  if (tier === "premium") return kind === "plant" && m >= 2;
  if (tier === "standard") return (kind === "pilot" && m >= 2) || kind === "plant";
  return kind === "pilot" || kind === "plant";
}
function trustMul(trust: number) {
  return 0.94 + trust / 500;
}
function pickClient(g: Game, tier: Tier) {
  const busy = new Set([...g.offers.map((o) => o.clientId), ...g.jobs.map((j) => j.clientId)]);
  let pool = g.clients.filter((c) => !busy.has(c.id));
  if (!pool.length) pool = [...g.clients];
  const taste = pool.filter((c) => c.taste === tier);
  if (taste.length && roll(g.seq + g.week) > 0.35) pool = taste;
  return pool[Math.floor(roll(g.seq * 3 + g.week + pool.length) * pool.length)] ?? g.clients[0]!;
}
function pickShape(g: Game, tier: Tier, dice: number): Shape {
  if (tier === "sterile" || tier === "premium") return dice > 0.62 ? "urgenza" : "fornitura";
  if (dice > 0.8 && g.staff.some((s) => s.role === "scientist")) return "trasferimento";
  if (tier !== "pilota" && dice > 0.55 && g.reputation >= 44) return "urgenza";
  if (tier !== "pilota" && dice > 0.22) return "fornitura";
  return "campione";
}
function pushOffer(g: Game, fixed?: { client: Client; tier: Tier; shape: Shape; payMul?: number }) {
  const canStd = gearList(g, "reattore").some((h) => h.item.level >= 2) || hasGear(g, "reattore-gmp");
  const canPrem = hasGear(g, "climatica") || (itemLevel(g, "reattore-gmp") >= 2 && hasGear(g, "hplc"));
  const canBio = hasGear(g, "bioreattore");
  const dice = roll(g.week * 13 + g.seq);
  let tier: Tier = fixed?.tier ?? "pilota";
  if (!fixed) {
    if (canBio && dice > 0.74) tier = "sterile";
    else if (canPrem && dice > 0.56) tier = "premium";
    else if (canStd && dice > 0.34) tier = "standard";
  }
  const shape = fixed?.shape ?? pickShape(g, tier, dice);
  const client = fixed?.client ?? pickClient(g, tier);
  let batches = shape === "fornitura" || tier === "premium" ? 3 : 2;
  if (tier === "sterile") batches = 2;
  const payEach = tier === "pilota" ? 130_000 : tier === "standard" ? 155_000 : tier === "premium" ? 200_000 : 240_000;
  const shapeMul = shape === "trasferimento" ? 0.7 : shape === "fornitura" ? 1.06 : 1;
  const clauses: Clauses = shape === "urgenza" ? { rush: true, tight: false, penalty: true } : { rush: false, tight: false, penalty: false };
  const basePay = Math.round(batches * payEach * shapeMul * trustMul(client.trust) * (fixed?.payMul ?? 1));
  const baseQuality = tier === "pilota" ? 46 : tier === "standard" ? 58 : tier === "premium" ? 70 : 74;
  g.offers.push({
    id: nid(g, "o"),
    client: client.name,
    clientId: client.id,
    title: `${SHAPE_LABEL[shape]} ${client.name}`,
    tier,
    shape,
    batches,
    basePay,
    pay: priced(basePay, clauses),
    api: tier === "pilota" ? 1 : 2,
    solvent: tier === "sterile" ? 0 : 1,
    eccipient: tier === "sterile" ? 0 : 1,
    vials: tier === "sterile" ? 2 : 0,
    baseQuality,
    quality: baseQuality,
    expires: g.week + (shape === "urgenza" ? 4 : 6),
    dueWeeks: spanWeeks(shape, batches, clauses.rush),
    clauses,
    blurb: BLURB[shape],
    science: shape === "trasferimento" ? 3 : 0,
  });
  return true;
}
function followOn(g: Game, job: Job) {
  if (job.shape !== "fornitura" || job.scrap > 0) return;
  if (g.offers.length >= deskCap(g)) return;
  const client = g.clients.find((c) => c.id === job.clientId);
  if (!client || client.trust < 36) return;
  if (g.offers.some((o) => o.clientId === client.id)) return;
  pushOffer(g, { client, tier: job.tier, shape: "fornitura", payMul: 1.05 });
  pushLog(g, `${client.name} rimette una campagna sul tavolo.`, "info");
}

function refreshOffers(g: Game, force: boolean) {
  heal(g);
  g.offers = g.offers.filter((o) => o.expires >= g.week);
  const cap = deskCap(g);
  if (!force && g.offers.length >= cap) return;
  let target = cap;
  if (!force && g.week % 3 !== 1) target = g.offers.length === 0 ? Math.min(2, cap) : Math.min(cap, g.offers.length + (g.week % 2 === 0 ? 1 : 0));
  let guard = 0;
  while (g.offers.length < target && guard < 8) {
    guard += 1;
    pushOffer(g);
  }
}

export function acceptOffer(g: Game, id: string) {
  const next = structuredClone(g) as Game;
  heal(next);
  const idx = next.offers.findIndex((o) => o.id === id);
  if (idx < 0) return g;
  const offer = next.offers.splice(idx, 1)[0]!;
  next.jobs.push({ ...offer, status: "queued", done: 0, roomId: null, progress: 0, due: next.week + offer.dueWeeks, scrap: 0, prefer: null, lateHit: false, penalScrap: false });
  pushLog(next, `Firmato ${offer.client}: ${offer.batches} lotti entro la settimana ${next.week + offer.dueWeeks}.`, "info");
  markGoals(next);
  return next;
}

export function tuneOffer(g: Game, id: string, key: keyof Clauses) {
  const next = structuredClone(g) as Game;
  heal(next);
  const offer = next.offers.find((o) => o.id === id);
  if (!offer) return g;
  offer.clauses[key] = !offer.clauses[key];
  offer.pay = priced(offer.basePay, offer.clauses);
  offer.quality = offer.baseQuality + (offer.clauses.tight ? 8 : 0);
  offer.dueWeeks = spanWeeks(offer.shape, offer.batches, offer.clauses.rush);
  return next;
}

export function declineOffer(g: Game, id: string) {
  const next = structuredClone(g) as Game;
  heal(next);
  const idx = next.offers.findIndex((o) => o.id === id);
  if (idx < 0) return g;
  const offer = next.offers.splice(idx, 1)[0]!;
  const client = next.clients.find((c) => c.id === offer.clientId);
  if (client) client.trust = clamp(client.trust - 1, 0, 100);
  pushLog(next, `Rimandata la busta di ${offer.client}.`, "info");
  return next;
}

export type DeskLine = { id: string; name: string; ready: boolean; fit: boolean; why: string };
export function deskLines(g: Game, tier: Tier): DeskLine[] {
  const rooms = g.rooms.filter((r) => r.type === "pilot" || r.type === "plant" || r.type === "sterile");
  return rooms.map((room) => {
    const siblings = rooms.filter((r) => r.type === room.type);
    const index = siblings.findIndex((r) => r.id === room.id);
    const base = roomDef(room.type).name;
    const name = siblings.length > 1 ? `${base} ${index + 1}` : base;
    const machine = room.type === "sterile" ? "bioreattore" : room.type === "plant" ? "reattore-gmp" : "reattore";
    const m = room.slots.find((s) => s.item?.defId === machine)?.item?.level ?? 0;
    const kind = room.type === "sterile" ? "sterile" : room.type === "plant" ? "plant" : "pilot";
    const fit = m > 0 && fitsTier(tier, kind, m);
    const live = lineOf(g, room);
    const busy = g.jobs.some((j) => j.roomId === room.id && j.status === "active");
    let why = "Pronta";
    if (!m) why = room.type === "sterile" ? "Manca il bioreattore" : "Manca il reattore";
    else if (!fit) why = tier === "premium" ? "Serve il reattore GMP almeno a 2" : "Linea non adatta";
    else if (!roomOnline(g, room)) why = "Senza corrente";
    else if (room.halt > 0) why = "In pausa";
    else if (!staffIn(g, room.id, "operator").length) why = "Senza operatore";
    else if ((kind === "plant" || kind === "sterile") && !gownOk(g)) why = "Manca lo spogliatoio";
    else if (kind === "sterile" && !itemOn(g, "pw")) why = "Manca l'acqua purificata";
    else if (!live) why = "Spenta";
    else if (busy) why = "Occupata";
    const ready = Boolean(live && fit && !busy && fitsTier(tier, live.kind, live.m));
    return { id: room.id, name, ready, fit, why: ready ? "Pronta" : why };
  });
}

export function pinJob(g: Game, id: string, roomId: string | null) {
  const next = structuredClone(g) as Game;
  heal(next);
  const job = next.jobs.find((j) => j.id === id);
  if (!job || job.status !== "queued") return g;
  if (roomId && !deskLines(next, job.tier).some((line) => line.id === roomId && line.fit)) return "Quella linea non regge questo contratto.";
  job.prefer = roomId;
  return next;
}

export function coverage(g: Game) {
  let score = 20 + g.quality * 0.45;
  if (hasGear(g, "bilancia")) score += 4;
  score += 7 * itemLevel(g, "hplc");
  score += 5 * itemLevel(g, "micro");
  if (hasGear(g, "climatica")) score += 6;
  if (hasTech(g, "analitica")) score += 8;
  if (hasGear(g, "ipc")) score += 3;
  if (hasGear(g, "registro")) score += 2;
  if (!hasGear(g, "gabbia")) score -= 4;
  return score;
}

function have(g: Game, key: MatKey | "vials") {
  return key === "api" ? g.api : key === "solvent" ? g.solvent : key === "eccipient" ? g.eccipient : g.vials;
}
function add(g: Game, key: MatKey | "vials", n: number) {
  if (key === "api") g.api += n;
  else if (key === "solvent") g.solvent += n;
  else if (key === "eccipient") g.eccipient += n;
  else g.vials += n;
}
function tryFill(g: Game, key: MatKey | "vials", need: number) {
  if (need <= 0 || have(g, key) >= need) return true;
  if (!g.autoBuy) return false;
  const n = need - have(g, key);
  if (capOf(g, key) - have(g, key) < n) return false;
  const cost = n * (key === "api" ? apiPrice(g) : matPrice(g, key));
  if (g.cash < cost) return false;
  g.cash -= cost;
  add(g, key, n);
  return true;
}

function produce(g: Game) {
  heal(g);
  for (const job of g.jobs) {
    if (job.done >= job.batches || g.week <= job.due) continue;
    if (g.week <= job.due + 4) g.reputation = clamp(g.reputation - 1, 0, 100);
    if (job.clauses.penalty && !job.lateHit) {
      const hit = Math.round(job.pay * 0.08);
      g.cash -= hit;
      job.lateHit = true;
      pushLog(g, `${job.client}: penale di ritardo ${euro(hit)}.`, "bad");
    } else if (g.week === job.due + 1) pushLog(g, `${job.client} è oltre la data.`, "bad");
  }
  const lines = g.rooms.map((room) => lineOf(g, room)).filter((x) => x !== null);
  const open = () => lines.filter((candidate) => !g.jobs.some((other) => other.roomId === candidate!.room.id && other.status === "active"));
  for (const job of g.jobs) {
    if (job.status !== "queued" || !job.prefer) continue;
    const line = open().find((candidate) => candidate!.room.id === job.prefer && fitsTier(job.tier, candidate!.kind, candidate!.m));
    if (!line) continue;
    job.roomId = line.room.id;
    job.status = "active";
  }
  for (const job of g.jobs) {
    if (job.status !== "queued" || job.prefer) continue;
    const line = open().find((candidate) => fitsTier(job.tier, candidate!.kind, candidate!.m));
    if (!line) continue;
    job.roomId = line.room.id;
    job.status = "active";
  }
  const blister = itemLevel(g, "blister");
  const commercial = sellerOn(g);
  for (const job of g.jobs) {
    if (job.status !== "active" || !job.roomId) continue;
    const room = g.rooms.find((r) => r.id === job.roomId);
    const line = room ? lineOf(g, room) : null;
    if (!room || !line) continue;
    const okMats = () => tryFill(g, "api", job.api) && tryFill(g, "solvent", job.solvent) && tryFill(g, "eccipient", job.eccipient) && tryFill(g, "vials", job.vials);
    job.progress = Math.min(job.batches - job.done, job.progress + line.vel);
    let warned = false;
    while (job.progress >= 1 && job.done < job.batches) {
      if (!okMats() || have(g, "api") < job.api || have(g, "solvent") < job.solvent || have(g, "eccipient") < job.eccipient || have(g, "vials") < job.vials) {
        if (!warned && g.week % 3 === 0) pushLog(g, `${job.client} fermo: manca materiale o spazio scaffale.`, "bad");
        warned = true;
        break;
      }
      job.progress -= 1;
      g.api -= job.api;
      g.solvent -= job.solvent;
      g.eccipient -= job.eccipient;
      g.vials -= job.vials;
      let fail = 0.04 + Math.max(0, job.quality - coverage(g)) / 140;
      if (job.tier === "sterile" && !itemOn(g, "isolatore")) fail += 0.1;
      if (job.tier === "sterile" && !hasGear(g, "micro")) fail += 0.06;
      if (room.slots.some((s) => s.item?.defId === "cip" && gearOn(g, room.id, room.slots.indexOf(s)))) fail -= 0.04;
      fail = clamp(fail, 0.02, 0.45);
      if (roll(g.week * 17 + job.done + g.seq) < fail) {
        job.scrap += 1;
        g.quality = clamp(g.quality - 2, 0, 100);
        g.reputation = clamp(g.reputation - 2, 0, 100);
        const client = g.clients.find((c) => c.id === job.clientId);
        if (client) client.trust = clamp(client.trust - 2, 0, 100);
        if (job.clauses.penalty && !job.penalScrap) {
          const hit = Math.round((job.pay / job.batches) * 0.4);
          g.cash -= hit;
          job.penalScrap = true;
          pushLog(g, `${job.client}: scarto con penale ${euro(hit)}.`, "bad");
        } else pushLog(g, `Lotto ${job.client} fuori specifica.`, "bad");
      } else {
        job.done += 1;
        g.stats.batches += 1;
        let slice = Math.round(job.pay / job.batches);
        if (blister) slice = Math.round(slice * (1 + 0.05 * blister));
        if (hasGear(g, "astuccio")) slice = Math.round(slice * 1.06);
        if (commercial) slice = Math.round(slice * 1.08);
        if (line.kind === "plant" && !("fill" in line && line.fill)) slice = Math.round(slice * 0.9);
        g.cash += slice;
        g.stats.revenue += slice;
        g.reputation = clamp(g.reputation + 0.5, 0, 100);
        g.quality = clamp(g.quality + 0.3, 0, 100);
        if (job.done >= job.batches) {
          const client = g.clients.find((c) => c.id === job.clientId);
          if (client) {
            client.trust = clamp(client.trust + (job.scrap > 0 ? 2 : 8), 0, 100);
            client.last = g.week;
          }
          if (job.science > 0) {
            g.science += job.science;
            pushLog(g, `${job.client}: il processo resta, +${job.science} scienza.`, "good");
          }
          pushLog(g, `Contratto ${job.client} chiuso.`, "good");
          followOn(g, job);
        }
      }
    }
  }
  g.jobs = g.jobs.filter((j) => j.done < j.batches);
}

function staffSkill(g: Game, role: Role, type: RoomType) {
  const list = g.staff.filter((s) => s.role === role && g.rooms.find((r) => r.id === s.roomId)?.type === type);
  if (!list.length) return 0;
  return list.reduce((sum, s) => sum + s.skill, 0) / list.length;
}
export function scienceRate(g: Game) {
  let n = 0;
  for (const s of g.staff) {
    if (s.role !== "scientist") continue;
    const room = g.rooms.find((r) => r.id === s.roomId);
    if (!room) n += 0.4;
    else if (room.type === "discovery" && roomOnline(g, room) && room.halt === 0) n += 0.35 * s.skill * itemLevel(g, "lcms");
  }
  return n;
}
function indicationOf(name: string) {
  return INDICATION_BOOK.find((item) => item.name === name) ?? INDICATION_BOOK[0]!;
}
function marketMul(program: Program) {
  return 0.92 + (indicationOf(program.indication).pull - 1) * 0.35;
}
export function trialRisk(g: Game, program: Program) {
  const base = program.stage === "phase1" ? 0.1 : program.stage === "phase2" ? 0.18 : program.stage === "phase3" ? 0.26 : 0;
  if (!base) return 0;
  let chance = base + indicationOf(program.indication).risk * 0.45 - g.quality / 500;
  if (hasGear(g, "biostat")) chance -= 0.06;
  if ((program.heat ?? 0) >= 3) chance += 0.04;
  return clamp(chance, 0.03, 0.5);
}
export function licenseValue(program: Program) {
  const bonus = program.stage === "phase3" ? 700_000 : program.stage === "phase2" ? 380_000 : program.stage === "phase1" ? 180_000 : 0;
  const rare = program.indication === "Malattie rare" ? 1.2 : 1;
  const bio = (program.modality ?? "chimica") === "biologico" ? 1.12 : 1;
  const heat = 1 - 0.08 * (program.heat ?? 0);
  return Math.round((420_000 + bonus) * marketMul(program) * rare * bio * heat);
}
export function researchCost(g: Game, program: Program) {
  const step = NEXT_STAGE[program.stage];
  if (!step) return 0;
  if (program.stage === "patent" && hasGear(g, "brevetti-desk")) return Math.round(step.cost * 0.75);
  return step.cost;
}
export function researchGate(g: Game, program: Program): string | null {
  if (!program.waiting) return null;
  if (program.stage === "dossier") {
    if (!hasGear(g, "dossier")) return "Serve l'archivio dossier, negli affari regolatori.";
    if (g.cash < researchCost(g, program)) return "Cassa insufficiente.";
    return null;
  }
  if (program.stage === "patent" && !g.rooms.some((r) => r.type === "phase1" && hasGear(g, "pharmacy"))) return "Prima l'unità di fase I, con la pharmacy.";
  if (program.stage === "phase1" && !g.rooms.some((r) => r.type === "phase23" && hasGear(g, "unitdose"))) return "Prima l'unità di fase II, con l'unit dose.";
  if (program.stage === "phase2" && !hasGear(g, "tmf")) return "La fase III chiede l'archivio TMF.";
  if (g.cash < researchCost(g, program)) return "Cassa insufficiente.";
  if ((program.modality ?? "chimica") === "biologico" && (program.stage === "phase1" || program.stage === "phase2")) {
    const missing = Math.max(0, 4 - g.vials);
    if (missing && capOf(g, "vials") < 4) return "Il biologico vuole 4 flaconi, e lo scaffale non li tiene.";
    if (missing && !g.autoBuy && g.cash < researchCost(g, program) + missing * matPrice(g, "vials")) return "Servono 4 flaconi per il lotto clinico.";
  }
  return null;
}
function takeVials(g: Game, n: number): string | null {
  if (g.vials >= n) {
    g.vials -= n;
    return null;
  }
  const missing = n - g.vials;
  if (!g.autoBuy) return "Servono 4 flaconi. Comprali o accendi il riordino.";
  if (capOf(g, "vials") < n) return "Lo scaffale flaconi non regge 4 pezzi.";
  const cost = missing * matPrice(g, "vials");
  if (g.cash < cost) return "Cassa corta per i flaconi del lotto clinico.";
  g.cash -= cost;
  g.vials -= n - missing;
  return null;
}
export function labPace(g: Game, program: Program): { speed: number; need: number; text: string } {
  const need = STAGE_NEED[program.stage] ?? 4;
  const modality = program.modality ?? "chimica";
  if (program.stage === "review") return { speed: 0, need: Math.max(program.reviewLeft, 0), text: program.authority ? `${program.authority} sta leggendo.` : "In lettura." };
  if (program.stage === "patent") return { speed: 0, need: 1, text: "Il brevetto si deposita, non si aspetta." };
  if (["failed", "launched", "licensed", "approved"].includes(program.stage)) return { speed: 0, need: 1, text: STAGE_LABEL[program.stage] };
  if (program.waiting) return { speed: 0, need, text: "Pagina piena. Tocca a te." };
  let speed = 0;
  let block = "Fermo.";
  if (program.stage === "discovery" || program.stage === "lead") {
    const s = staffSkill(g, "scientist", "discovery");
    if (!g.rooms.some((r) => r.type === "discovery")) block = "Manca il lab di scoperta.";
    else if (!s) block = "Metti uno scienziato nel lab di scoperta.";
    else if (!hasGear(g, "banco")) block = "Manca il banco chimico.";
    else {
      speed = 0.45 * (0.7 + 0.2 * itemLevel(g, "lcms")) * (s / 3);
      if (program.stage === "lead" && hasGear(g, "sintetizzatore")) speed *= 1.2;
      speed *= modality === "biologico" ? (g.focus === "biologici" ? 1.12 : 0.9) : g.focus === "biologici" ? 0.92 : 1;
    }
  } else if (program.stage === "preclinical") {
    const s = staffSkill(g, "scientist", "preclinical");
    if (!g.rooms.some((r) => r.type === "preclinical")) block = "Manca la preclinica.";
    else if (!s) block = "Metti uno scienziato in preclinica.";
    else if (!hasGear(g, "saggi")) block = "Manca la piattaforma saggi.";
    else speed = 0.4 * (0.6 + 0.2 * itemLevel(g, "saggi")) * (hasGear(g, "toss") ? 1.25 : 0.8) * (s / 3);
  } else if (program.stage === "phase1") {
    const home = g.rooms.find((r) => r.type === "phase1");
    const s = staffSkill(g, "clinical", "phase1");
    if (!home) block = "Manca l'unità di fase I.";
    else if (!s) block = "Metti un clinico in fase I.";
    else if (!hasGear(g, "pharmacy") || !hasGear(g, "letti")) block = "Servono pharmacy e unità letti.";
    else speed = (0.5 + 0.15 * itemLevel(g, "monitor-1") + 0.1 * home.level) * (s / 4);
  } else if (program.stage === "phase2" || program.stage === "phase3") {
    const home = g.rooms.find((r) => r.type === "phase23");
    const s = staffSkill(g, "clinical", "phase23");
    if (!home) block = "Manca l'unità di fase II e III.";
    else if (!s) block = "Metti un clinico nell'unità clinica.";
    else if (!hasGear(g, "unitdose")) block = "Manca l'unit dose.";
    else if (program.stage === "phase3" && !hasGear(g, "tmf")) block = "La fase III vuole l'archivio TMF.";
    else speed = (0.5 + 0.15 * itemLevel(g, "monitor-2") + 0.1 * home.level) * (s / 4);
  } else if (program.stage === "dossier") {
    const s = staffSkill(g, "regulatory", "regulatory");
    if (!g.rooms.some((r) => r.type === "regulatory")) block = "Mancano gli affari regolatori.";
    else if (!s) block = "Metti un regolatorio sull'archivio.";
    else if (!hasGear(g, "dossier")) block = "Manca l'archivio dossier.";
    else speed = 0.7 * (s / 3) * (hasGear(g, "archivio-stab") ? 1.1 : 1);
  }
  if (speed <= 0) return { speed: 0, need, text: block };
  const weeks = Math.max(1, Math.ceil(Math.max(0, need - program.progress) / speed));
  return { speed, need, text: `Ancora circa ${weeks} ${weeks === 1 ? "settimana" : "settimane"}.` };
}
function scienceOf(g: Game) {
  g.science += scienceRate(g);
}

function research(g: Game) {
  scienceOf(g);
  for (const program of g.pipeline) {
    if (["failed", "launched", "licensed", "approved"].includes(program.stage)) continue;
    if (program.stage === "review") {
      program.reviewLeft -= 1;
      if (program.reviewLeft <= 0) {
        const authority = AUTHORITIES.find((a) => a.name === program.authority) ?? AUTHORITIES[0]!;
        const bonus = (staffSkill(g, "regulatory", "regulatory") ? 0.1 : 0) + g.quality / 320 + (hasGear(g, "dossier") ? 0.06 : 0);
        if (roll(g.week * 5 + g.seq) > authority.strict - bonus) {
          program.stage = "approved";
          g.stats.approvals += 1;
          g.reputation = clamp(g.reputation + 8, 0, 100);
          if (program.authority === "FDA") g.playerShare = clamp(g.playerShare + 2, 0, shareCap(g));
          pushLog(g, `${authority.name} approva ${program.code}.`, "good");
        } else {
          program.stage = "dossier";
          program.waiting = true;
          g.reputation = clamp(g.reputation - 4, 0, 100);
          pushLog(g, `${authority.name} rimanda ${program.code}.`, "bad");
        }
      }
      continue;
    }
    if (program.waiting || program.stage === "patent") {
      if (program.stage === "patent") program.waiting = true;
      continue;
    }
    if (program.rivalId && (program.heat ?? 0) < 3 && ["discovery", "lead", "preclinical"].includes(program.stage)) {
      if (roll(g.week * 19 + (program.heat ?? 0) * 3 + g.seq) < 0.04) {
        program.heat = (program.heat ?? 0) + 1;
        const rival = g.rivals.find((item) => item.id === program.rivalId);
        const name = rival?.name ?? "Un rivale";
        pushLog(g, program.heat >= 3 ? `${name} pubblica un analogo di ${program.code}.` : `${name} stringe su ${program.code}.`, program.heat >= 3 ? "bad" : "info");
      }
    }
    const pace = labPace(g, program);
    if (pace.speed <= 0) continue;
    if ((program.stage === "phase2" || program.stage === "phase3") && hasGear(g, "imp")) {
      if (g.api > 0) g.api -= 1;
    }
    program.progress += pace.speed;
    if (program.progress >= pace.need) {
      program.progress = pace.need;
      program.waiting = true;
      pushLog(g, `${program.code} attende una decisione: ${STAGE_LABEL[program.stage]}.`, "info");
    }
  }
}

export function pushScience(g: Game, id: string) {
  const next = structuredClone(g) as Game;
  heal(next);
  const program = next.pipeline.find((p) => p.id === id);
  if (!program || program.waiting || !["discovery", "lead", "preclinical", "dossier"].includes(program.stage)) return "Ora non si spinge col quaderno.";
  if (labPace(next, program).speed <= 0) return labPace(next, program).text;
  if (next.science < 4) return "Servono 4 punti scienza.";
  next.science -= 4;
  const need = STAGE_NEED[program.stage] ?? 4;
  program.progress += 1.2;
  if (program.progress >= need) {
    program.progress = need;
    program.waiting = true;
    pushLog(next, `${program.code} è pronto per una decisione.`, "good");
  } else pushLog(next, `Quaderno spinto su ${program.code}.`, "info");
  return next;
}

export function startProgram(g: Game, indication: string, modality: Modality = "chimica") {
  if (!g.rooms.some((r) => r.type === "discovery" && staffIn(g, r.id, "scientist").length && hasGear(g, "banco"))) return "Metti uno scienziato nel lab con il banco chimico.";
  const active = g.pipeline.filter((p) => !["failed", "launched", "licensed"].includes(p.stage)).length;
  const slots = 1 + (hasTech(g, "piattaforma") ? 1 : 0);
  if (active >= slots) return "La pipeline è piena.";
  if (g.cash < 70_000) return "Cassa insufficiente.";
  const next = structuredClone(g) as Game;
  heal(next);
  next.cash -= 70_000;
  const code = `AUR-${140 + next.pipeline.length}`;
  const rival = roll(next.seq + next.week) > 0.62 ? next.rivals[Math.floor(roll(next.seq * 5 + next.week) * next.rivals.length)] : null;
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
    modality,
    heat: 0,
    rivalId: rival?.id ?? null,
  });
  pushLog(next, `${code} parte in ${indication}.`, "good");
  if (rival) pushLog(next, `${rival.name} guarda anche ${indication}.`, "info");
  markGoals(next);
  refreshChapter(next);
  return next;
}

export function advanceProgram(g: Game, id: string, authorityId?: string) {
  const next = structuredClone(g) as Game;
  heal(next);
  const program = next.pipeline.find((p) => p.id === id);
  if (!program?.waiting) return g;
  const step = NEXT_STAGE[program.stage];
  if (!step) return g;
  const cost = researchCost(next, program);
  const blocked = researchGate(next, program);
  if (blocked) return blocked;
  if (program.stage === "dossier") {
    const authority = AUTHORITIES.find((a) => a.id === authorityId) ?? AUTHORITIES[0]!;
    if (authority.id === "fda" && !hasGear(next, "serial")) return "La FDA chiede la serializzazione.";
    if (next.cash < cost) return "Cassa insufficiente.";
    next.cash -= cost;
    program.stage = "review";
    program.waiting = false;
    program.progress = 0;
    program.authority = authority.name;
    const staffed = next.staff.some((s) => s.role === "regulatory" && s.roomId);
    const cut = (staffed ? 2 : 0) + (itemLevel(next, "dossier") >= 2 ? 2 : 0);
    program.reviewLeft = Math.max(3, authority.weeks - cut);
    pushLog(next, `${program.code} è da ${authority.name}.`, "info");
    return next;
  }
  if ((program.modality ?? "chimica") === "biologico" && (program.stage === "phase1" || program.stage === "phase2")) {
    const vialErr = takeVials(next, 4);
    if (vialErr) return vialErr;
  }
  if (next.cash < cost) return "Cassa insufficiente.";
  const chance = trialRisk(next, program);
  if (chance && roll(next.week * 3 + next.seq) < chance) {
    next.cash -= Math.round(cost * 0.35);
    program.stage = "failed";
    program.waiting = false;
    const hit = hasGear(next, "pv") ? 2 : 4;
    next.reputation = clamp(next.reputation - hit, 0, 100);
    pushLog(next, `${program.code} si ferma in ${STAGE_LABEL[step.stage]}.`, "bad");
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
  if (!hasTech(g, "licenze")) return "Prima la tecnica Licensing.";
  const next = structuredClone(g) as Game;
  const program = next.pipeline.find((p) => p.id === id);
  if (!program?.patented || ["failed", "launched", "licensed", "approved"].includes(program.stage)) return "Si cede solo una molecola brevettata ancora in sviluppo.";
  const pay = licenseValue(program);
  program.stage = "licensed";
  program.waiting = false;
  next.cash += pay;
  next.stats.licenses += 1;
  next.stats.revenue += pay;
  next.reputation = clamp(next.reputation + 3, 0, 100);
  pushLog(next, `${program.code} ceduta per ${euro(pay)}.`, "good");
  markGoals(next);
  return next;
}

export function launchProduct(g: Game, id: string) {
  const next = structuredClone(g) as Game;
  const program = next.pipeline.find((p) => p.id === id);
  if (!program || program.stage !== "approved") return g;
  program.stage = "launched";
  next.products.push({ id: nid(next, "d"), code: program.code, indication: program.indication, price: 100, patented: program.patented, patentLeft: program.patented ? 48 : 0 });
  const bump = Math.max(4, Math.round((hasTech(next, "lancio") ? 10 : 7) * marketMul(program)));
  next.playerShare = clamp(next.playerShare + bump, 0, shareCap(next));
  next.stats.launches += 1;
  pushLog(next, `${program.code} entra in commercio.`, "good");
  markGoals(next);
  refreshChapter(next);
  return next;
}
function shareCap(g: Game) {
  return hasTech(g, "lancio") ? 48 : 34;
}
export function setPrice(g: Game, id: string, price: number) {
  const next = structuredClone(g) as Game;
  const product = next.products.find((p) => p.id === id);
  if (!product) return g;
  product.price = clamp(Math.round(price), 70, 160);
  return next;
}

function commerce(g: Game) {
  if (!g.products.length) return;
  const cap = shareCap(g);
  const ship = hasGear(g, "baia") ? 1 : 0.75;
  const serialOk = hasGear(g, "serial") ? 1 : 0.9;
  let drift = 0;
  for (const product of g.products) {
    if (product.price > (hasGear(g, "gdp") ? 130 : 120)) drift -= 0.3;
    else if (product.price < 90) drift += 0.15;
    const pandemic = g.mod?.label.includes("Pandemia") && product.indication === "Respiratorio" ? 1.35 : 1;
    const revenue = Math.round(g.playerShare * demandOf(g) * (product.price / 100) * 1100 * ship * serialOk * pandemic);
    g.cash += revenue;
    g.stats.revenue += revenue;
    if (product.patentLeft > 0) {
      product.patentLeft -= 1;
      if (product.patentLeft === 0) {
        g.playerShare = clamp(g.playerShare - 3, 0, cap);
        pushLog(g, `Il brevetto di ${product.code} scade.`, "bad");
      }
    }
  }
  g.playerShare = clamp(g.playerShare + drift, 0, cap);
}

function upkeep(g: Game) {
  let burn = 0;
  for (const room of g.rooms) {
    burn += roomDef(room.type).upkeep * (1 + 0.2 * (room.level - 1));
    for (const slot of room.slots) if (slot.item) burn += gearDef(slot.item.defId).upkeep * slot.item.level;
  }
  for (const tile of g.tiles.flat()) if (tile.corridor) burn += 400;
  for (const s of g.staff) burn += s.salary;
  g.cash -= Math.round(burn);
  for (const room of g.rooms) if (room.halt > 0) room.halt -= 1;
  if (g.staff.some((s) => s.role === "qa" && g.rooms.find((r) => r.id === s.roomId)?.type === "qc")) g.quality = clamp(g.quality + 0.7, 0, 100);
  if (hasGear(g, "freezer") && !hasGear(g, "allarme") && g.vials > 0 && roll(g.week * 9) < 0.02) {
    g.vials = Math.round(g.vials * 0.8);
    pushLog(g, "Un freezer va fuori range. Perdi flaconi.", "bad");
  }
}

function worldEvent(g: Game) {
  if (g.week < g.nextEvent) return;
  g.nextEvent = g.week + 8 + Math.floor(roll(g.week * 11) * 5);
  const n = Math.floor(roll(g.week * 29) * 8);
  if (n === 0 && g.week > 36) {
    g.mod = { label: "Pandemia respiratoria", apiMul: 1.55, demandAdd: 24, until: g.week + 8 };
    pushLog(g, "Pandemia. Domanda su, materie care.", "bad");
  } else if (n === 1 && g.week > 16) {
    if (g.quality < 60) {
      const weeks = hasGear(g, "generatore") ? 1 : 2;
      for (const room of g.rooms) if (room.type === "pilot" || room.type === "plant" || room.type === "sterile") room.halt = Math.max(room.halt, weeks);
      g.cash -= 80_000;
      pushLog(g, "Ispezione. Linee ferme e una multa.", "bad");
    } else pushLog(g, "Ispezione superata.", "good");
  } else if (n === 2) {
    g.mod = { label: "Crisi dei solventi", apiMul: 1.35, demandAdd: 0, until: g.week + 5 };
    pushLog(g, "Crisi dei solventi.", "bad");
  } else if (n === 3 && hasGear(g, "banco")) {
    g.cash += 160_000;
    g.science += 3;
    pushLog(g, "Bando di ricerca. Cassa e scienza.", "good");
  } else if (n === 4) {
    g.candidates.push(person(g, "operator", 4));
    pushLog(g, "Un operatore bussa.", "good");
  } else if (n === 5) {
    const rival = g.rivals[Math.floor(roll(g.week) * g.rivals.length)]!;
    rival.share = clamp(rival.share - 4, 4, 48);
    pushLog(g, `Scandalo in ${rival.name}.`, "good");
  } else {
    g.reputation = clamp(g.reputation + 3, 0, 100);
    pushLog(g, "Il nome circola a un congresso.", "info");
  }
}

function candidates(g: Game) {
  if (g.week % 5 !== 0) return;
  const pool: Role[] = ["operator", "qa", "scientist"];
  if (hasTech(g, "clinica1")) pool.push("clinical", "regulatory");
  if (g.stats.batches > 2) pool.push("commercial");
  const role = pool[Math.floor(roll(g.week * 11) * pool.length)]!;
  g.candidates.push(person(g, role, 2 + Math.floor(roll(g.week + g.seq) * 4)));
  if (g.candidates.length > 5) g.candidates.shift();
}

function maybeRefinance(g: Game) {
  if (g.cash < -1_200_000 && !g.refinanced) {
    g.cash = 280_000;
    g.reputation = clamp(g.reputation - 10, 0, 100);
    g.refinanced = true;
    pushLog(g, "I soci rifinanziano una volta sola.", "bad");
  }
}

function markGoals(g: Game) {
  const done = new Set(g.goals);
  const give = (id: string, text: string, cash: number) => {
    if (done.has(id)) return;
    g.goals.push(id);
    g.cash += cash;
    pushLog(g, `${text} Premio ${euro(cash)}.`, "good");
  };
  if (g.tiles.flat().filter((t) => t.corridor).length >= 6) give("corr", "Il corridoio cammina.", 15_000);
  if (hasGear(g, "scaffale")) give("wh", "Il magazzino tiene qualcosa.", 25_000);
  if (hasGear(g, "reattore")) give("line", "Il reattore è acceso.", 30_000);
  if (g.staff.some((s) => s.role === "operator" && s.roomId)) give("op", "Operatore in stanza.", 20_000);
  if (g.jobs.length || g.stats.batches) give("job", "Contratto firmato.", 20_000);
  if (g.stats.batches > 0) give("batch", "Primo lotto uscito.", 40_000);
  if (hasGear(g, "bilancia")) give("qc", "QC minimo in casa.", 15_000);
  if (g.tech.length) give("tech", "Prima tecnica.", 15_000);
  if (g.owned.includes("logistica")) give("lotto", "Lotto logistica aperto.", 25_000);
  if (hasGear(g, "reattore-gmp")) give("gmp", "Impianto GMP vivo.", 50_000);
  if (g.pipeline.length) give("pipe", "Pipeline accesa.", 40_000);
  if (g.pipeline.some((p) => p.patented)) give("pat", "Brevetto depositato.", 60_000);
  if (g.stats.approvals) give("ok", "Prima approvazione.", 150_000);
  if (g.stats.launches) give("go", "Farmaco in commercio.", 120_000);
}
function refreshChapter(g: Game) {
  const phase = g.pipeline.some((p) => ["phase1", "phase2", "phase3", "dossier", "review", "approved"].includes(p.stage));
  if (g.stats.launches >= 2 || g.playerShare >= 18) g.chapter = "Piattaforma";
  else if (g.stats.launches > 0) g.chapter = "Big Pharma";
  else if (phase) g.chapter = "Clinica";
  else if (g.pipeline.length) g.chapter = "Ricerca";
  else if (g.stats.batches >= 6) g.chapter = "CDMO";
  else if (g.stats.batches > 0) g.chapter = "Officina";
  else g.chapter = "Fondazione";
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
  { id: "corr", label: "Allunga il corridoio" },
  { id: "wh", label: "Metti uno scaffale nel magazzino" },
  { id: "line", label: "Installa il reattore nel pilota" },
  { id: "op", label: "Assegna un operatore" },
  { id: "job", label: "Firma un contratto pilota" },
  { id: "batch", label: "Consegna un lotto" },
  { id: "qc", label: "Compra la bilancia del QC" },
  { id: "tech", label: "Sblocca una tecnica" },
  { id: "lotto", label: "Compra il lotto logistica" },
  { id: "gmp", label: "Accendi un impianto GMP" },
  { id: "pipe", label: "Avvia una molecola" },
  { id: "pat", label: "Deposita un brevetto" },
  { id: "ok", label: "Ottieni un'approvazione" },
  { id: "go", label: "Lancia il farmaco" },
];

export const MAT_LABEL: Record<MatKey | "vials", string> = { api: "API", solvent: "Solvente", eccipient: "Eccipiente", vials: "Flaconi" };
