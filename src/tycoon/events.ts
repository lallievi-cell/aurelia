import { clamp, euro, type Game } from "@/tycoon/model";
import { addFloating } from "@/tycoon/floating";

export type EventChoice = {
  id: string;
  label: string;
  cost?: number;
  blurb: string;
  apply: (g: Game) => { log: string; tone: "good" | "bad" | "info" };
};

export type DecisionEvent = {
  id: string;
  title: string;
  category: "regulatory" | "science" | "market" | "staff" | "production" | "opportunity";
  description: string;
  choices: EventChoice[];
  canTrigger: (g: Game) => boolean;
};

export const DECISION_EVENTS: DecisionEvent[] = [
  {
    id: "aifa_audit",
    title: "Ispezione a Sorpresa dell'Autorità",
    category: "regulatory",
    description: "Gli ispettori regolatori arrivano al cancello senza preavviso per un audit di conformità GMP sulle linee e sulla tracciabilità dei lotti.",
    canTrigger: (g) => g.week > 14 && g.stats.batches >= 2,
    choices: [
      {
        id: "hire_consultants",
        label: "Consulenti d'urgenza (65.000 €)",
        cost: 65_000,
        blurb: "Assumi un team di ex-ispettori per allineare subito i registri.",
        apply: (g) => {
          g.cash -= 65_000;
          g.quality = clamp(g.quality + 5, 0, 100);
          g.reputation = clamp(g.reputation + 4, 0, 100);
          addFloating("-65k €", "bad", 1, 1);
          return { log: "L'audit è stato superato con encomio grazie al supporto dei consulenti.", tone: "good" };
        },
      },
      {
        id: "trust_team",
        label: "Fidati del personale interno",
        blurb: "Lascia che il tuo responsabile QA e gli operatori gestiscano l'ispezione.",
        apply: (g) => {
          const qaSkill = g.staff.filter((s) => s.role === "qa").reduce((max, s) => Math.max(max, s.skill), 0);
          if (qaSkill >= 4 || g.quality >= 55) {
            g.reputation = clamp(g.reputation + 6, 0, 100);
            return { log: "Il team QA ha brillato: ispezione chiusa con zero rilievi critici!", tone: "good" };
          } else {
            g.quality = clamp(g.quality - 4, 0, 100);
            g.reputation = clamp(g.reputation - 5, 0, 100);
            g.cash -= 40_000;
            return { log: "Rilievi dell'autorità: prescrizioni da sanare e sanzione di 40.000 €.", tone: "bad" };
          }
        },
      },
    ],
  },
  {
    id: "poach_attempt",
    title: "Offerta Aggressiva da una Multinazionale",
    category: "staff",
    description: "Un colosso farmaceutico rivale ha contattato uno dei tuoi scienziati chiave, offrendo un raddoppio dello stipendio.",
    canTrigger: (g) => g.staff.some((s) => s.role === "scientist" && s.skill >= 4) && g.week > 20,
    choices: [
      {
        id: "counter_offer",
        label: "Controfferta e bonus fedeltà (40.000 €)",
        cost: 40_000,
        blurb: "Aumenta lo stipendio del 15% e versa un bonus immediato.",
        apply: (g) => {
          g.cash -= 40_000;
          const sci = g.staff.find((s) => s.role === "scientist" && s.skill >= 4);
          if (sci) {
            sci.salary = Math.round(sci.salary * 1.15);
            g.science += 2;
          }
          return { log: "Lo scienziato resta in azienda, motivato e devoto al progetto.", tone: "good" };
        },
      },
      {
        id: "let_go",
        label: "Non cedere al ricatto",
        blurb: "Rifiuta di alzare lo stipendio e rischia che se ne vada.",
        apply: (g) => {
          if (Math.random() > 0.45) {
            const sciIdx = g.staff.findIndex((s) => s.role === "scientist" && s.skill >= 4);
            if (sciIdx >= 0) {
              const gone = g.staff.splice(sciIdx, 1)[0]!;
              return { log: `${gone.name} ha accettato l'offerta del rivale e ha lasciato l'azienda.`, tone: "bad" };
            }
          }
          return { log: "Lo scienziato ha declinato l'offerta esteriore per fedeltà alla visione di Aurelia.", tone: "good" };
        },
      },
    ],
  },
  {
    id: "batch_rush_emergency",
    title: "Richiesta Ospedaliera URGENTE",
    category: "opportunity",
    description: "Un consorzio ospedaliero pediatrico ha una carenza gravissima di un farmaco oncologico iniettabile. Chiede una fornitura immediata fuori programma.",
    canTrigger: (g) => g.stats.batches >= 5,
    choices: [
      {
        id: "accept_humanitarian",
        label: "Accetta la fornitura urgente",
        blurb: "Sforzo straordinario: incasso di 220.000 € e balzo di reputazione.",
        apply: (g) => {
          g.cash += 220_000;
          g.reputation = clamp(g.reputation + 8, 0, 100);
          g.stats.batches += 1;
          g.stats.revenue += 220_000;
          addFloating("+220k €", "gold", 1, 1);
          return { log: "Lotti consegnati in tempo record agli ospedali: reputazione alle stelle!", tone: "good" };
        },
      },
      {
        id: "decline_humanitarian",
        label: "Declina per non sovraccaricare gli impianti",
        blurb: "Mantieni le linee focalizzate sui contratti già firmati.",
        apply: (g) => {
          return { log: "Hai declinato la fornitura d'emergenza: le linee restano stabili sui contratti ordinari.", tone: "info" };
        },
      },
    ],
  },
  {
    id: "green_synthesis_patent",
    title: "Scoperta di Sintesi Ecologica ('Green Chemistry')",
    category: "science",
    description: "I ricercatori hanno identificato una via di sintesi che riduce del 60% il consumo di solventi tossici e i residui pericolosi.",
    canTrigger: (g) => g.science >= 8 && g.rooms.some((r) => r.type === "discovery"),
    choices: [
      {
        id: "publish_and_patent",
        label: "Brevetta la via di sintesi (50.000 €)",
        cost: 50_000,
        blurb: "Spendi per depositare il brevetto di processo e abbattere i costi futuri.",
        apply: (g) => {
          g.cash -= 50_000;
          g.science += 4;
          g.reputation = clamp(g.reputation + 5, 0, 100);
          return { log: "Brevetto 'Green Chemistry' concesso: prestigio e riconoscimento accademico.", tone: "good" };
        },
      },
      {
        id: "open_science",
        label: "Pubblica Open-Access per la comunità",
        blurb: "Crescita massima della reputazione scientifica di Aurelia.",
        apply: (g) => {
          g.reputation = clamp(g.reputation + 9, 0, 100);
          g.science += 6;
          return { log: "Articolo pubblicato su Nature Biotechnology: Aurelia citata in tutto il mondo!", tone: "good" };
        },
      },
    ],
  },
  {
    id: "raw_material_cartel",
    title: "Tensioni Geopolitiche e Rincaro Solventi",
    category: "market",
    description: "Una crisi internazionale nei trasporti marittimi fa impennare i costi delle materie prime chimiche e ritarda le consegne.",
    canTrigger: (g) => g.week > 16,
    choices: [
      {
        id: "stockpile_now",
        label: "Acquisto massivo anticipato (120.000 €)",
        cost: 120_000,
        blurb: "Fai scorta a prezzo concordato per proteggere le linee per 6 mesi.",
        apply: (g) => {
          g.cash -= 120_000;
          g.solvent += 15;
          g.api += 10;
          return { log: "Magazzini pieni: Aurelia è protetta dall'impennata dei costi di mercato.", tone: "good" };
        },
      },
      {
        id: "risk_fluctuation",
        label: "Acquista solo al bisogno",
        blurb: "Risparmia cassa adesso, sperando che i prezzi calino presto.",
        apply: (g) => {
          g.quality = clamp(g.quality - 2, 0, 100);
          return { log: "Fornitori instabili: i lotti hanno subito qualche ritardo di fornitura.", tone: "bad" };
        },
      },
    ],
  },
  {
    id: "eu_innovation_grant",
    title: "Bando Europeo Horizon Health",
    category: "opportunity",
    description: "La Commissione Europea apre un bando per centri di produzione biotecnologica avanzata. Aurelia ha tutti i requisiti per candidarsi.",
    canTrigger: (g) => g.reputation >= 45 && g.science >= 5,
    choices: [
      {
        id: "write_grant",
        label: "Incarica esperti di bandi (30.000 €)",
        cost: 30_000,
        blurb: "Massimizza la probabilità di vincere il finanziamento a fondo perduto.",
        apply: (g) => {
          g.cash -= 30_000;
          g.cash += 380_000;
          g.science += 8;
          addFloating("+350k €", "gold", 1, 1);
          return { log: "Vittoria al bando europeo! 380.000 € a fondo perduto e +8 scienza.", tone: "good" };
        },
      },
      {
        id: "skip_grant",
        label: "Ignora per evitare burocrazia",
        blurb: "Nessun costo, ma nessun finanziamento.",
        apply: () => {
          return { log: "Hai rinunciato al bando europeo per non distogliere risorse interne.", tone: "info" };
        },
      },
    ],
  },
  {
    id: "reactor_breakdown",
    title: "Guasto Critico al Reattore Principale",
    category: "production",
    description: "Una guarnizione di tenuta ha ceduto nel reattore durante la sintesi di un lotto. C'è rischio di fermo impianto prolungato.",
    canTrigger: (g) => g.week > 12 && g.rooms.some((r) => r.type === "plant" || r.type === "pilot"),
    choices: [
      {
        id: "express_repair",
        label: "Intervento express da tecnici tedeschi (75.000 €)",
        cost: 75_000,
        blurb: "Pezzi originali trasportati in aereo: ripartenza in 48 ore senza perdere il lotto.",
        apply: (g) => {
          g.cash -= 75_000;
          g.quality = clamp(g.quality + 2, 0, 100);
          addFloating("-75k €", "bad", 1, 1);
          return { log: "Riparazione perfetta: l'impianto è tornato subito a pieno regime.", tone: "good" };
        },
      },
      {
        id: "patch_internally",
        label: "Riparazione interna e manutenzione lenta",
        blurb: "Usa la squadra interna: risparmi soldi ma perdi 2 settimane di cadenza.",
        apply: (g) => {
          g.quality = clamp(g.quality - 4, 0, 100);
          return { log: "Riparazione interna completata: le linee hanno accumulato qualche ritardo.", tone: "bad" };
        },
      },
    ],
  },
  {
    id: "api_supplier_crisis",
    title: "Fornitore di Principi Attivi in Fallimento",
    category: "market",
    description: "Uno storico fornitore lombardo di intermedi chimici ha dichiarato concordato. I suoi lotti di API sono all'asta giudiziaria a prezzo stracciato.",
    canTrigger: (g) => g.week > 18,
    choices: [
      {
        id: "buy_auction",
        label: "Rileva lo stock all'asta (90.000 €)",
        cost: 90_000,
        blurb: "Acquisisci 30 unità di API purissimo a meno di un terzo del valore di mercato.",
        apply: (g) => {
          g.cash -= 90_000;
          g.api += 25;
          addFloating("+25 API", "gold", 1, 1);
          return { log: "Asta giudiziaria vinta: magazzino rifornito con 25 scorte di API!", tone: "good" };
        },
      },
      {
        id: "pass_auction",
        label: "Non partecipare all'asta",
        blurb: "Evita di immobilizzare capitale in materie prime.",
        apply: () => {
          return { log: "Hai rinunciato all'asta: nessun esborso di cassa.", tone: "info" };
        },
      },
    ],
  },
  {
    id: "press_investigation",
    title: "Inchiesta Giornalistica Ambientale",
    category: "regulatory",
    description: "Una testata d'inchiesta regionale pubblica un articolo sui reflui industriali del distretto chimico, citando anche Aurelia.",
    canTrigger: (g) => g.week > 22 && g.reputation > 30,
    choices: [
      {
        id: "open_doors",
        label: "Open day e perizia indipendente (45.000 €)",
        cost: 45_000,
        blurb: "Invita stampa e comitati locali mostrando le analisi WFI e i filtri a carboni.",
        apply: (g) => {
          g.cash -= 45_000;
          g.reputation = clamp(g.reputation + 7, 0, 100);
          g.quality = clamp(g.quality + 3, 0, 100);
          return { log: "Trasparenza premiata: l'inchiesta si trasforma in un encomio per Aurelia!", tone: "good" };
        },
      },
      {
        id: "no_comment",
        label: "Nessun commento ai media",
        blurb: "Ignora le provocazioni per non alimentare polemiche.",
        apply: (g) => {
          g.reputation = clamp(g.reputation - 4, 0, 100);
          return { log: "Il silenzio stampa ha lasciato qualche dubbio nell'opinione pubblica locale.", tone: "bad" };
        },
      },
    ],
  },
  {
    id: "union_strike",
    title: "Sciopero del Personale sui Turni Notturni",
    category: "staff",
    description: "I delegati sindacali dei tecnici di linea chiedono un accordo integrativo per la turnazione continua 24/7 sui reattori.",
    canTrigger: (g) => g.staff.length >= 4 && g.week > 15,
    choices: [
      {
        id: "sign_pact",
        label: "Firma l'accordo con welfare aziendale (35.000 €)",
        cost: 35_000,
        blurb: "Bonus welfare e mensa convenzionata: morale al massimo e produttività raddoppiata.",
        apply: (g) => {
          g.cash -= 35_000;
          for (const s of g.staff) {
            s.morale = Math.min(100, (s.morale ?? 75) + 25);
          }
          g.quality = clamp(g.quality + 4, 0, 100);
          return { log: "Accordo siglato: maestranze motivate e clima aziendale eccellente.", tone: "good" };
        },
      },
      {
        id: "hard_line",
        label: "Mantieni la linea contrattuale standard",
        blurb: "Rifiuta extra fuori dal contratto nazionale di settore.",
        apply: (g) => {
          for (const s of g.staff) {
            s.morale = Math.max(20, (s.morale ?? 75) - 20);
          }
          return { log: "Tensioni sindacali: qualche ora di sciopero e morale dei reparti in calo.", tone: "bad" };
        },
      },
    ],
  },
  {
    id: "cleanroom_contamination",
    title: "Allarme Particellare in Camera Bianca",
    category: "regulatory",
    description: "I sensori ottici hanno rilevato una deviazione nella classe ISO 5 della suite di riempimento sterile.",
    canTrigger: (g) => g.rooms.some((r) => r.type === "sterile"),
    choices: [
      {
        id: "h2o2_fumigation",
        label: "Fumigazione con perossido d'idrogeno (50.000 €)",
        cost: 50_000,
        blurb: "Decontaminazione totale certificata e ritaratura dei filtri HEPA.",
        apply: (g) => {
          g.cash -= 50_000;
          g.quality = clamp(g.quality + 6, 0, 100);
          return { log: "Sanitizzazione profonda eseguita: conformità sterile certificata al 100%.", tone: "good" };
        },
      },
      {
        id: "filter_swap",
        label: "Semplice cambio filtri rapido (15.000 €)",
        cost: 15_000,
        blurb: "Intervento economico minimo senza fermare le lavorazioni.",
        apply: (g) => {
          g.cash -= 15_000;
          if (Math.random() > 0.5) {
            g.quality = clamp(g.quality - 5, 0, 100);
            return { log: "L'intervento rapido non è bastato: scartate alcune fiale non conformi.", tone: "bad" };
          }
          return { log: "I nuovi filtri hanno risolto il problema di misura.", tone: "info" };
        },
      },
    ],
  },
  {
    id: "ai_drug_design",
    title: "Software di IA Molecolare Predittiva",
    category: "science",
    description: "Una startup di Zurigo propone ad Aurelia una licenza d'uso esclusiva per un motore di simulazione molecolare basato su reti neurali.",
    canTrigger: (g) => g.rooms.some((r) => r.type === "discovery") && g.week > 25,
    choices: [
      {
        id: "license_ai",
        label: "Licenza IA e server GPU (80.000 €)",
        cost: 80_000,
        blurb: "Accellera la scoperta di candidati farmaco e genera +10 scienza.",
        apply: (g) => {
          g.cash -= 80_000;
          g.science += 10;
          addFloating("+10 Sci", "gold", 1, 1);
          return { log: "Modello IA integrato: i ricercatori generano lead molecolari in poche ore!", tone: "good" };
        },
      },
      {
        id: "stick_to_bench",
        label: "Affidati solo al banco di laboratorio",
        blurb: "Risparmia i fondi per i reattori fisici.",
        apply: () => {
          return { log: "Hai declinato l'offerta IA: la ricerca prosegue con metodi tradizionali.", tone: "info" };
        },
      },
    ],
  },
  {
    id: "energy_crisis",
    title: "Rincaro dei Costi Energetici Industriali",
    category: "production",
    description: "I rincari delle tariffe elettriche impattano i gruppi frigo e i compressori WFI che devono girare ininterrottamente.",
    canTrigger: (g) => g.week > 20,
    choices: [
      {
        id: "solar_rooftop",
        label: "Installazione fotovoltaico sui tetti (95.000 €)",
        cost: 95_000,
        blurb: "Impianto fotovoltaico da 200 kW: abbatti i costi di mantenimento per sempre.",
        apply: (g) => {
          g.cash -= 95_000;
          g.reputation = clamp(g.reputation + 4, 0, 100);
          addFloating("-95k €", "bad", 1, 1);
          return { log: "Pannelli solari allacciati: sito Aurelia ad alta efficienza 'Green Plant'.", tone: "good" };
        },
      },
      {
        id: "absorb_bills",
        label: "Assorbi le bollette in bilancio",
        blurb: "Paga le maggiorazioni senza investire in impianti nuovi.",
        apply: (g) => {
          g.cash -= 25_000;
          return { log: "Bollette straordinarie pagate (-25.000 € di cassa).", tone: "bad" };
        },
      },
    ],
  },
  {
    id: "clinical_adverse_event",
    title: "Segnalazione di Farmacovigilanza nei Trial",
    category: "science",
    description: "Durante la sperimentazione clinica di una molecola, un ospedale partner segnala un effetto collaterale lieve in due pazienti.",
    canTrigger: (g) => g.pipeline.some((p) => p.stage.startsWith("phase")),
    choices: [
      {
        id: "deep_audit",
        label: "Sospendi 2 settimane e rifai i test di tossicità (60.000 €)",
        cost: 60_000,
        blurb: "Approccio scientifico inattaccabile che rassicura le autorità etiche.",
        apply: (g) => {
          g.cash -= 60_000;
          g.quality = clamp(g.quality + 5, 0, 100);
          g.reputation = clamp(g.reputation + 3, 0, 100);
          return { log: "Effetto collaterale circoscritto a un dosaggio errato: trial ripartito in totale sicurezza.", tone: "good" };
        },
      },
      {
        id: "protocol_update",
        label: "Aggiorna solo la scheda posologica",
        blurb: "Modifica il protocollo senza fermare i centri clinici.",
        apply: (g) => {
          if (Math.random() > 0.4) {
            g.reputation = clamp(g.reputation - 5, 0, 100);
            return { log: "Il comitato etico ha chiesto chiarimenti formali con un lieve richiamo.", tone: "bad" };
          }
          return { log: "Scheda posologica approvata senza intoppi.", tone: "info" };
        },
      },
    ],
  },
  {
    id: "university_spin_off",
    title: "Spin-Off Universitario Cede Brevetto Molecolare",
    category: "science",
    description: "Un gruppo di ricercatori dell'Università Statale cerca un partner industriale per brevettare un potente inibitore enzimatico.",
    canTrigger: (g) => g.science >= 10 && g.week > 30,
    choices: [
      {
        id: "buy_patent_rights",
        label: "Acquisisci i diritti esclusivi mondiali (130.000 €)",
        cost: 130_000,
        blurb: "Aggiunge immediatamente una molecola avanzata in pipeline e +12 scienza.",
        apply: (g) => {
          g.cash -= 130_000;
          g.science += 12;
          g.reputation = clamp(g.reputation + 6, 0, 100);
          addFloating("+12 Sci", "gold", 1, 1);
          return { log: "Accordo siglato: Aurelia titolare del brevetto molecolare universitario!", tone: "good" };
        },
      },
      {
        id: "pass_deal",
        label: "Declina per concentrarsi sulle molecole interne",
        blurb: "Nessun costo, focalizzazione sulle linee attuali.",
        apply: () => {
          return { log: "Hai declinato l'offerta universitaria.", tone: "info" };
        },
      },
    ],
  },
  {
    id: "fda_priority_voucher",
    title: "Voucher di Revisione Prioritaria FDA",
    category: "opportunity",
    description: "Un fondo biotech in liquidazione mette sul mercato un 'Priority Review Voucher' che dimezza i tempi di revisione regolatoria negli Stati Uniti.",
    canTrigger: (g) => g.week > 35 && g.stats.batches >= 8,
    choices: [
      {
        id: "buy_voucher",
        label: "Acquista il voucher prioritario (180.000 €)",
        cost: 180_000,
        blurb: "Investimento d'élite che spalanca l'approvazione rapida sui mercati USA.",
        apply: (g) => {
          g.cash -= 180_000;
          g.playerShare = clamp(g.playerShare + 4, 0, 50);
          g.reputation = clamp(g.reputation + 8, 0, 100);
          addFloating("+4% Quota", "gold", 1, 1);
          return { log: "Voucher prioritario registrato: la reputazione globale di Aurelia vola!", tone: "good" };
        },
      },
      {
        id: "pass_voucher",
        label: "Segui il normale iter ordinario",
        blurb: "Evita una spesa importante e affidati alla forza dei dati clinici.",
        apply: () => {
          return { log: "I programmi clinici proseguiranno secondo la corsia ordinaria.", tone: "info" };
        },
      },
    ],
  },
  {
    id: "rival_counterfeit",
    title: "Scandalo Qualità del Concorrente",
    category: "market",
    description: "Il tuo principale concorrente subisce un blocco delle importazioni a causa di difetti di purezza su lotti esteri.",
    canTrigger: (g) => g.rivals.length > 0 && g.week > 25,
    choices: [
      {
        id: "campaign_trust",
        label: "Campagna commerciale di affidabilità certificata (40.000 €)",
        cost: 40_000,
        blurb: "Presentati ai clienti scontenti come il partner CDMO affidabile.",
        apply: (g) => {
          g.cash -= 40_000;
          g.playerShare = clamp(g.playerShare + 3, 0, 50);
          const topRival = g.rivals.reduce((prev, curr) => (curr.share > prev.share ? curr : prev), g.rivals[0]!);
          topRival.share = clamp(topRival.share - 3, 5, 50);
          return { log: "Clientela conquistata: quota di mercato salita del +3% a danno del rivale!", tone: "good" };
        },
      },
      {
        id: "low_profile",
        label: "Mantieni un profilo sobrio e neutrale",
        blurb: "Lascia che il mercato reagisca spontaneamente senza speculare.",
        apply: (g) => {
          g.reputation = clamp(g.reputation + 2, 0, 100);
          return { log: "Il mercato ha apprezzato la compostezza etica di Aurelia.", tone: "good" };
        },
      },
    ],
  },
  {
    id: "hospital_network_pact",
    title: "Patto di Collaborazione con la Rete Ospedaliera",
    category: "opportunity",
    description: "Una rete di policlinici universitari propone una partnership per l'arruolamento rapido di pazienti per studi clinici su patologie rare.",
    canTrigger: (g) => g.reputation >= 40 && g.week > 20,
    choices: [
      {
        id: "fund_fellowship",
        label: "Finanzia 3 borse di ricerca clinica (55.000 €)",
        cost: 55_000,
        blurb: "Arruolamento velocizzato nei trial clinici e legame speciale con i medici.",
        apply: (g) => {
          g.cash -= 55_000;
          g.science += 6;
          g.reputation = clamp(g.reputation + 5, 0, 100);
          return { log: "Borse attivate: arruolamento dei pazienti più veloce del 30%!", tone: "good" };
        },
      },
      {
        id: "standard_agreement",
        label: "Accordo ordinario a tariffa base",
        blurb: "Nessun contributo anticipato.",
        apply: () => {
          return { log: "Accordo quadro firmato a condizioni standard.", tone: "info" };
        },
      },
    ],
  },
  {
    id: "tax_rd_credit",
    title: "Verifica Agenzia Entrate su Crediti R&S",
    category: "regulatory",
    description: "I funzionari dell'amministrazione tributaria chiedono la certificazione tecnica dettagliata delle spese di ricerca degli ultimi due anni.",
    canTrigger: (g) => g.week > 30 && g.science >= 8,
    choices: [
      {
        id: "hire_expert_certifier",
        label: "Incarica un perito accreditato dal Ministero (35.000 €)",
        cost: 35_000,
        blurb: "Perizia asseverata che blinda i crediti d'imposta ed evita sanzioni.",
        apply: (g) => {
          g.cash -= 35_000;
          g.cash += 90_000; // credito sbloccato!
          return { log: "Perizia inattaccabile: crediti R&S sbloccati (+90.000 € di rimborso fiscale).", tone: "good" };
        },
      },
      {
        id: "self_certification",
        label: "Fornisci documentazione interna standard",
        blurb: "Gestisci la pratica con l'ufficio contabile interno.",
        apply: (g) => {
          if (Math.random() > 0.4) {
            g.cash -= 40_000;
            return { log: "Rilievi formali: concordato con pagamento di 40.000 €.", tone: "bad" };
          }
          return { log: "Pratica fiscale chiusa con esito regolare.", tone: "good" };
        },
      },
    ],
  },
];
