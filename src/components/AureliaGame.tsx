import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  FlaskConical,
  Globe2,
  Map as MapIcon,
  Minus,
  Pause,
  Play,
  Plus,
  ScrollText,
  Users,
  X,
} from "lucide-react";
import { blip, unlockAudio } from "@/tycoon/audio";
import { drawCampus, drawInterior, pickStation, pickTile, type Cam } from "@/tycoon/draw";
import {
  AUTHORITIES,
  CATALOG,
  GOAL_TEXT,
  INDICATIONS,
  NEXT_STAGE,
  ROLE_LABEL,
  STAGE_LABEL,
  acceptOffer,
  advanceProgram,
  allBuildings,
  apiPrice,
  assign,
  audit,
  buildCost,
  buildingById,
  canBuild,
  capacityApi,
  catalog,
  demandOf,
  dismiss,
  euro,
  hire,
  launchProduct,
  newGame,
  orderApi,
  place,
  setAutoBuy,
  setPrice,
  staffIn,
  startProgram,
  tick,
  upgrade,
  upgradeCost,
  waitingProgram,
  yearOf,
  type Focus,
  type Game,
} from "@/tycoon/model";
import { clearGame, loadGame, saveGame } from "@/tycoon/save";

type Tab = "map" | "deals" | "research" | "team" | "world";

function commit(game: Game, setGame: (g: Game) => void) {
  saveGame(game);
  setGame(game);
  blip();
}

export function AureliaGame() {
  const [game, setGame] = useState<Game | null>(null);
  const [booted, setBooted] = useState(false);
  const [tab, setTab] = useState<Tab>("map");
  const [company, setCompany] = useState("Aurelia");
  const [focus, setFocus] = useState<Focus>("sintesi");
  const [cell, setCell] = useState<{ c: number; r: number } | null>(null);
  const [inside, setInside] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [indication, setIndication] = useState(INDICATIONS[0]!);
  const [stationHint, setStationHint] = useState<string | null>(null);
  const [armReset, setArmReset] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cam = useRef<Cam>({ panX: 0, panY: 0, zoom: 1, user: false });
  const gameRef = useRef<Game | null>(null);
  const insideRef = useRef<string | null>(null);
  const cellRef = useRef<{ c: number; r: number } | null>(null);
  const playRef = useRef(false);
  const stationRef = useRef<string | null>(null);
  const drag = useRef({ x: 0, y: 0, panX: 0, panY: 0, moved: false, active: false });
  gameRef.current = game;
  insideRef.current = inside;
  cellRef.current = cell;
  playRef.current = playing;
  stationRef.current = stationHint;

  useEffect(() => {
    const saved = loadGame();
    if (saved) setGame(saved);
    setBooted(true);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    if (!booted || tab !== "map") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const bw = Math.max(1, Math.round(rect.width * dpr));
      const bh = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }
      const ctx = canvas.getContext("2d");
      const current = gameRef.current;
      if (ctx && current && rect.width > 0) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const building = buildingById(current, insideRef.current);
        if (building) drawInterior(ctx, current, building, rect.width, rect.height, now / 1000, stationRef.current);
        else drawCampus(ctx, current, rect.width, rect.height, cam.current, now / 1000, cellRef.current);
      }
      if (playRef.current && current && !waitingProgram(current)) {
        acc += dt;
        if (acc >= 0.95) {
          acc = 0;
          const stepped = tick(current);
          gameRef.current = stepped;
          saveGame(stepped);
          setGame(stepped);
          blip(460);
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [booted, tab]);

  function found() {
    unlockAudio();
    const next = newGame(company, focus);
    commit(next, setGame);
  }

  function apply(next: Game | string) {
    unlockAudio();
    if (typeof next === "string") {
      setToast(next);
      return;
    }
    commit(next, setGame);
  }

  function stepOnce() {
    if (!game) return;
    unlockAudio();
    apply(tick(game));
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    drag.current = { x: e.clientX, y: e.clientY, panX: cam.current.panX, panY: cam.current.panY, moved: false, active: true };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* il puntatore può già essere stato rilasciato */
    }
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    if (Math.hypot(dx, dy) > 8) drag.current.moved = true;
    if (!drag.current.moved || inside) return;
    cam.current.panX = drag.current.panX + dx;
    cam.current.panY = drag.current.panY + dy;
  }

  function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    drag.current.active = false;
    if (!game || drag.current.moved) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const building = buildingById(game, inside);
    if (building) {
      setStationHint(pickStation(x, y, rect.width, rect.height, building.kind, building.level));
      return;
    }
    const hit = pickTile(x, y, rect.width, rect.height, cam.current);
    if (!hit) return;
    const plot = game.cells[hit.r]![hit.c]!;
    if (plot.blocked) {
      setToast("Il cortile resta verde.");
      return;
    }
    if (plot.building) {
      setInside(plot.building.id);
      setCell(null);
      setStationHint(null);
      return;
    }
    setCell(hit);
    setInside(null);
  }

  const goal = game ? GOAL_TEXT.find((item) => !game.goals.includes(item.id)) : null;
  const waiting = game ? waitingProgram(game) : null;

  if (!booted) {
    return <div className="grid h-dvh place-items-center bg-paper font-display text-3xl text-ink">Aurelia</div>;
  }

  if (!game) {
    return (
      <div className="safe-top safe-bot h-dvh overflow-y-auto bg-paper text-ink">
        <div className="mx-auto flex min-h-full max-w-lg flex-col justify-center gap-6 px-5 py-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-teal">CDMO</p>
            <h1 className="font-display text-5xl leading-none">Aurelia</h1>
            <p className="mt-3 text-base leading-relaxed text-mist">
              Fondi un'azienda che produce farmaci per altri. Poi costruisci i laboratori, i brevetti e un farmaco tuo.
            </p>
          </div>
          <label className="block">
            <span className="text-sm text-mist">Nome</span>
            <input
              value={company}
              maxLength={22}
              onChange={(e) => setCompany(e.target.value)}
              className="mt-1 min-h-12 w-full rounded-xl border border-line bg-card px-3 font-display text-2xl outline-none"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <FocusCard title="Sintesi" text="Impianto più economico. Contratti più frequenti." on={focus === "sintesi"} click={() => setFocus("sintesi")} />
            <FocusCard title="Biologici" text="Suite sterile scontata. Lotti pagati meglio." on={focus === "biologici"} click={() => setFocus("biologici")} />
          </div>
          <button type="button" onClick={found} className="min-h-12 rounded-full bg-teal font-semibold text-card">
            Apri il campus
          </button>
        </div>
      </div>
    );
  }

  const interior = buildingById(game, inside);

  return (
    <div className="flex h-dvh flex-col bg-paper text-ink">
      <header className="safe-top z-20 flex items-center gap-2 border-b border-line bg-card px-3 pb-2">
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-xl leading-none">{game.name}</p>
          <p className="text-sm text-mist">
            {game.chapter} · anno {yearOf(game.week)}
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-lg leading-none">{euro(game.cash)}</p>
          <p className="text-sm text-mist">sett. {game.week}</p>
        </div>
        <button type="button" aria-label="Avanza di una settimana" onClick={stepOnce} className="grid h-11 w-11 place-items-center rounded-full bg-amber text-ink">
          <Plus />
        </button>
        <button
          type="button"
          aria-label={playing ? "Metti in pausa" : "Fai scorrere le settimane"}
          onClick={() => {
            unlockAudio();
            setPlaying((v) => !v);
          }}
          className="grid h-11 w-11 place-items-center rounded-full bg-ink text-card"
        >
          {playing ? <Pause /> : <Play />}
        </button>
      </header>
      <div className="flex items-center justify-between gap-3 border-b border-line bg-card px-3 py-1 text-sm text-mist">
        <span>Reputazione {Math.round(game.reputation)}</span>
        <span>Qualità {Math.round(game.quality)}</span>
        <span>Quota {Math.round(game.playerShare)}%</span>
      </div>

      <main className="relative min-h-0 flex-1">
        {tab === "map" ? (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full touch-none"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          />
        ) : (
          <div className="absolute inset-0 overflow-y-auto px-4 py-4 pb-28">
            {tab === "deals" ? <Deals game={game} apply={apply} /> : null}
            {tab === "research" ? (
              <Research game={game} apply={apply} indication={indication} setIndication={setIndication} />
            ) : null}
            {tab === "team" ? <Team game={game} apply={apply} /> : null}
            {tab === "world" ? (
              <World
                game={game}
                apply={apply}
                armReset={armReset}
                reset={() => {
                  if (!armReset) {
                    setArmReset(true);
                    return;
                  }
                  clearGame();
                  setGame(null);
                  setPlaying(false);
                  setInside(null);
                  setArmReset(false);
                }}
              />
            ) : null}
          </div>
        )}

        {tab === "map" && !interior && !cell && goal ? (
          <div className="pointer-events-none absolute left-3 right-3 top-3 rounded-xl bg-card/95 px-3 py-2 shadow-sm">
            <p className="text-sm text-mist">Prossimo passo</p>
            <p className="font-medium">{goal.label}</p>
          </div>
        ) : null}

        {tab === "map" && !interior ? (
          <div className="absolute bottom-3 right-3 flex flex-col gap-2">
            <button type="button" aria-label="Avvicina" className="grid h-11 w-11 place-items-center rounded-full bg-card shadow-sm" onClick={() => zoom(cam.current, 1.12)}>
              <Plus />
            </button>
            <button type="button" aria-label="Allontana" className="grid h-11 w-11 place-items-center rounded-full bg-card shadow-sm" onClick={() => zoom(cam.current, 0.88)}>
              <Minus />
            </button>
          </div>
        ) : null}

        {toast ? <p className="absolute left-3 right-3 top-3 rounded-xl bg-ink px-3 py-2 text-sm text-card">{toast}</p> : null}
        {waiting && playing ? (
          <p className="absolute left-3 right-16 top-16 rounded-xl bg-amber px-3 py-2 text-sm text-ink">
            {waiting.code} aspetta una decisione. Pausa.
          </p>
        ) : null}

        {tab === "map" && cell && !interior ? (
          <Sheet onClose={() => setCell(null)} title="Costruisci">
            <div className="grid gap-2">
              {CATALOG.filter((item) => item.kind !== "hq").map((item) => {
                const cost = buildCost(game, item.kind);
                const block = canBuild(game, item.kind, cell.c, cell.r);
                return (
                  <button
                    key={item.kind}
                    type="button"
                    disabled={!!block && block !== "Cassa insufficiente." ? false : false}
                    onClick={() => {
                      const result = place(game, item.kind, cell.c, cell.r);
                      if (typeof result === "string") setToast(result);
                      else {
                        apply(result);
                        setCell(null);
                      }
                    }}
                    className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-line bg-paper px-3 text-left"
                  >
                    <span>
                      <span className="block font-medium">{item.name}</span>
                      <span className="block text-sm text-mist">{item.blurb}</span>
                    </span>
                    <span className="shrink-0 font-display text-amber">{euro(cost)}</span>
                  </button>
                );
              })}
            </div>
          </Sheet>
        ) : null}

        {tab === "map" && interior ? (
          <Sheet
            onClose={() => {
              setInside(null);
              setStationHint(null);
            }}
            title={catalog(interior.kind).name}
            back
          >
            <Interior game={game} id={interior.id} station={stationHint} apply={apply} openResearch={() => { setTab("research"); setInside(null); }} />
          </Sheet>
        ) : null}
      </main>

      <nav className="safe-bot z-20 grid grid-cols-5 border-t border-line bg-card">
        <Nav icon={<MapIcon />} label="Mappa" on={tab === "map"} click={() => setTab("map")} />
        <Nav icon={<ScrollText />} label="Contratti" on={tab === "deals"} click={() => setTab("deals")} />
        <Nav icon={<FlaskConical />} label="Ricerca" on={tab === "research"} click={() => setTab("research")} />
        <Nav icon={<Users />} label="Persone" on={tab === "team"} click={() => setTab("team")} />
        <Nav icon={<Globe2 />} label="Mondo" on={tab === "world"} click={() => setTab("world")} />
      </nav>
    </div>
  );
}

function zoom(cam: Cam, factor: number) {
  const base = cam.user ? cam.zoom : 1;
  cam.user = true;
  cam.zoom = Math.max(0.7, Math.min(1.7, base * factor));
}

function Nav({ icon, label, on, click }: { icon: ReactNode; label: string; on: boolean; click: () => void }) {
  return (
    <button type="button" onClick={click} className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs ${on ? "text-teal" : "text-mist"}`}>
      {icon}
      {label}
    </button>
  );
}

function FocusCard({ title, text, on, click }: { title: string; text: string; on: boolean; click: () => void }) {
  return (
    <button type="button" onClick={click} className={`min-h-24 rounded-xl border px-3 py-3 text-left ${on ? "border-teal bg-card" : "border-line bg-paper"}`}>
      <span className="block font-display text-xl">{title}</span>
      <span className="mt-1 block text-sm leading-snug text-mist">{text}</span>
    </button>
  );
}

function Sheet({ title, onClose, children, back }: { title: string; onClose: () => void; children: ReactNode; back?: boolean }) {
  return (
    <section className="absolute inset-x-0 bottom-0 z-30 max-h-[68%] overflow-y-auto rounded-t-3xl border border-line bg-card px-4 pt-3 pb-4 shadow-md">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl">{title}</h2>
        <button type="button" aria-label={back ? "Torna al campus" : "Chiudi"} onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full bg-paper">
          {back ? <ArrowLeft /> : <X />}
        </button>
      </div>
      {children}
    </section>
  );
}

function Interior({
  game,
  id,
  station,
  apply,
  openResearch,
}: {
  game: Game;
  id: string;
  station: string | null;
  apply: (g: Game | string) => void;
  openResearch: () => void;
}) {
  const building = buildingById(game, id);
  if (!building) return null;
  const item = catalog(building.kind);
  const crew = staffIn(game, id);
  const free = game.staff.filter((s) => !s.buildingId && (!item.role || s.role === item.role));
  const jobs = game.jobs.filter((j) => j.lineId === id && j.status === "active");
  return (
    <div className="grid gap-3">
      <p className="text-sm leading-relaxed text-mist">
        Livello {building.level}
        {building.halt > 0 ? ` · ferma ${building.halt} sett.` : ""}
        {station ? ` · ${station}` : ""}
      </p>
      {item.role ? (
        <div className="grid gap-2">
          <p className="text-sm font-medium">{item.roleLabel}</p>
          {crew.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-2 rounded-xl bg-paper px-3 py-2">
              <span>
                {s.name}
                <span className="block text-sm text-mist">
                  {ROLE_LABEL[s.role]} · abilità {s.skill}
                </span>
              </span>
              <button type="button" className="min-h-11 rounded-full px-3 text-sm text-teal" onClick={() => apply(assign(game, s.id, null))}>
                Togli
              </button>
            </div>
          ))}
          {free.map((s) => (
            <button key={s.id} type="button" className="min-h-11 rounded-xl border border-line px-3 text-left" onClick={() => apply(assign(game, s.id, id))}>
              Assegna {s.name}
            </button>
          ))}
          {!free.length && !crew.length ? <p className="text-sm text-mist">Nessuna persona libera con questo mestiere.</p> : null}
        </div>
      ) : null}

      {building.kind === "warehouse" ? (
        <div className="grid gap-2">
          <p className="text-sm">
            Principio attivo {game.api}/{capacityApi(game)} · {euro(apiPrice(game))} l'unità
          </p>
          <div className="flex gap-2">
            <button type="button" className="min-h-11 flex-1 rounded-full bg-teal text-card" onClick={() => apply(orderApi(game, 10))}>
              Ordina 10
            </button>
            <button type="button" className="min-h-11 flex-1 rounded-full bg-paper" onClick={() => apply(setAutoBuy(game, !game.autoBuy))}>
              {game.autoBuy ? "Acquisto auto" : "Acquisto manuale"}
            </button>
          </div>
        </div>
      ) : null}

      {building.kind === "plant" || building.kind === "sterile" ? (
        <div className="grid gap-1 text-sm">
          {jobs.length ? jobs.map((j) => <p key={j.id}>{j.client}: lotto {j.done}/{j.batches}</p>) : <p className="text-mist">Nessun lotto su questa linea.</p>}
        </div>
      ) : null}

      {building.kind === "qc" ? (
        <button type="button" className="min-h-11 rounded-full bg-teal text-card" onClick={() => apply(audit(game))}>
          Audit interno · 60 mila €
        </button>
      ) : null}

      {building.kind === "lab" || building.kind === "clinical" || building.kind === "regulatory" ? (
        <button type="button" className="min-h-11 rounded-full bg-paper" onClick={openResearch}>
          Apri ricerca e dossier
        </button>
      ) : null}

      {building.level < 3 && building.kind !== "hq" ? (
        <button type="button" className="min-h-11 rounded-full bg-ink text-card" onClick={() => apply(upgrade(game, id))}>
          Potenzia · {euro(upgradeCost(building))}
        </button>
      ) : null}
    </div>
  );
}

function Deals({ game, apply }: { game: Game; apply: (g: Game | string) => void }) {
  const active = game.jobs.filter((j) => j.status === "queued" || j.status === "active");
  return (
    <div className="mx-auto grid max-w-lg gap-4">
      <h2 className="font-display text-3xl">Contratti</h2>
      {game.offers.map((offer) => (
        <article key={offer.id} className="rounded-xl border border-line bg-card p-3">
          <p className="font-medium">{offer.title}</p>
          <p className="text-sm text-mist">
            {offer.batches} lotti · {offer.kind === "biologici" ? "suite sterile" : "impianto"} · qualità {offer.quality}
          </p>
          <p className="mt-1 font-display text-xl text-teal">{euro(offer.pay)}</p>
          <button type="button" className="mt-2 min-h-11 w-full rounded-full bg-teal text-card" onClick={() => apply(acceptOffer(game, offer.id))}>
            Firma
          </button>
        </article>
      ))}
      <h3 className="font-display text-2xl">In corso</h3>
      {active.length ? (
        active.map((job) => (
          <p key={job.id} className="rounded-xl bg-card px-3 py-2 text-sm">
            {job.client} · {job.status === "queued" ? "in attesa di una linea e di un operatore" : `lotto ${job.done}/${job.batches}`}
          </p>
        ))
      ) : (
        <p className="text-sm text-mist">Nessun contratto aperto.</p>
      )}
    </div>
  );
}

function Research({
  game,
  apply,
  indication,
  setIndication,
}: {
  game: Game;
  apply: (g: Game | string) => void;
  indication: string;
  setIndication: (v: string) => void;
}) {
  const lab = allBuildings(game).some((b) => b.kind === "lab");
  const scientist = game.staff.some((s) => s.role === "scientist" && buildingById(game, s.buildingId)?.kind === "lab");
  return (
    <div className="mx-auto grid max-w-lg gap-4">
      <h2 className="font-display text-3xl">Ricerca</h2>
      <div className="rounded-xl border border-line bg-card p-3">
        <label className="text-sm text-mist">
          Indicazione
          <select value={indication} onChange={(e) => setIndication(e.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-line bg-paper px-2">
            {INDICATIONS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="mt-3 min-h-11 w-full rounded-full bg-teal text-card disabled:opacity-40"
          disabled={!lab || !scientist}
          onClick={() => apply(startProgram(game, indication))}
        >
          Nuova molecola · 80 mila €
        </button>
        {!lab || !scientist ? <p className="mt-2 text-sm text-mist">Serve un laboratorio con uno scienziato dentro.</p> : null}
      </div>
      {game.pipeline.map((program) => {
        const step = NEXT_STAGE[program.stage];
        const need = program.stage === "discovery" || program.stage === "lead" || program.stage === "preclinical" || program.stage === "phase1" || program.stage === "phase2" || program.stage === "phase3" || program.stage === "dossier";
        return (
          <article key={program.id} className="rounded-xl border border-line bg-card p-3">
            <p className="font-display text-xl">{program.code}</p>
            <p className="text-sm text-mist">
              {program.indication} · {STAGE_LABEL[program.stage]}
              {program.patented ? " · brevettata" : ""}
            </p>
            {need ? <p className="mt-2 text-sm">Avanzamento {Math.round(program.progress)}</p> : null}
            {program.stage === "review" ? <p className="mt-2 text-sm">Revisione {program.authority}: {program.reviewLeft} sett.</p> : null}
            {program.waiting && step && program.stage !== "dossier" ? (
              <button type="button" className="mt-3 min-h-11 w-full rounded-full bg-ink text-card" onClick={() => apply(advanceProgram(game, program.id))}>
                {step.label}
                {step.cost ? ` · ${euro(step.cost)}` : ""}
              </button>
            ) : null}
            {program.waiting && program.stage === "dossier" ? (
              <div className="mt-3 grid gap-2">
                {AUTHORITIES.map((authority) => (
                  <button key={authority.id} type="button" className="min-h-11 rounded-full bg-ink text-card" onClick={() => apply(advanceProgram(game, program.id, authority.id))}>
                    Invia a {authority.name} · {authority.weeks} sett.
                  </button>
                ))}
              </div>
            ) : null}
            {program.stage === "approved" ? (
              <button type="button" className="mt-3 min-h-11 w-full rounded-full bg-teal text-card" onClick={() => apply(launchProduct(game, program.id))}>
                Lancia in commercio
              </button>
            ) : null}
          </article>
        );
      })}
      {!game.pipeline.length ? <p className="text-sm text-mist">Ancora nessuna molecola tua. I contratti pagano le luci.</p> : null}
    </div>
  );
}

function Team({ game, apply }: { game: Game; apply: (g: Game | string) => void }) {
  return (
    <div className="mx-auto grid max-w-lg gap-4">
      <h2 className="font-display text-3xl">Persone</h2>
      {game.staff.map((person) => {
        const home = buildingById(game, person.buildingId);
        return (
          <article key={person.id} className="flex items-center justify-between gap-2 rounded-xl border border-line bg-card px-3 py-2">
            <span>
              <span className="block font-medium">{person.name}</span>
              <span className="text-sm text-mist">
                {ROLE_LABEL[person.role]} · abilità {person.skill} · {euro(person.salary)}/sett.
                {home ? ` · ${catalog(home.kind).name}` : " · in panchina"}
              </span>
            </span>
            <button type="button" className="min-h-11 rounded-full px-3 text-sm text-mist" onClick={() => apply(dismiss(game, person.id))}>
              Esci
            </button>
          </article>
        );
      })}
      <h3 className="font-display text-2xl">Candidati</h3>
      {game.candidates.map((person) => (
        <button key={person.id} type="button" className="min-h-14 rounded-xl border border-line bg-card px-3 text-left" onClick={() => apply(hire(game, person.id))}>
          <span className="block font-medium">Assumi {person.name}</span>
          <span className="text-sm text-mist">
            {ROLE_LABEL[person.role]} · abilità {person.skill} · {euro(person.salary)}/sett. · ingresso 15 mila €
          </span>
        </button>
      ))}
    </div>
  );
}

function World({ game, apply, armReset, reset }: { game: Game; apply: (g: Game | string) => void; armReset: boolean; reset: () => void }) {
  const max = Math.max(...game.history);
  const min = Math.min(...game.history);
  return (
    <div className="mx-auto grid max-w-lg gap-4">
      <h2 className="font-display text-3xl">Mondo</h2>
      <div className="flex h-16 items-end gap-1 rounded-xl bg-card px-3 py-2">
        {game.history.map((value, index) => {
          const height = max === min ? 50 : ((value - min) / (max - min)) * 100;
          return <div key={index} className="flex-1 rounded-sm bg-teal" style={{ height: `${Math.max(8, height)}%` }} />;
        })}
      </div>
      <p className="text-sm text-mist">
        Principio attivo {euro(apiPrice(game))} · domanda {Math.round(demandOf(game))}
        {game.mod ? ` · ${game.mod.label}` : ""}
      </p>
      {game.products.map((product) => (
        <article key={product.id} className="rounded-xl border border-line bg-card p-3">
          <p className="font-medium">
            {product.code} · {product.indication}
          </p>
          <p className="text-sm text-mist">Prezzo indice {product.price}{product.patentLeft ? ` · brevetto ${product.patentLeft} sett.` : " · senza esclusiva"}</p>
          <div className="mt-2 flex gap-2">
            <button type="button" className="min-h-11 flex-1 rounded-full bg-paper" onClick={() => apply(setPrice(game, product.id, product.price - 5))}>
              Abbassa
            </button>
            <button type="button" className="min-h-11 flex-1 rounded-full bg-paper" onClick={() => apply(setPrice(game, product.id, product.price + 5))}>
              Alza
            </button>
          </div>
        </article>
      ))}
      {game.rivals.map((rival) => (
        <article key={rival.id} className="rounded-xl bg-card px-3 py-2">
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-medium">{rival.name}</p>
            <p className="font-display">{Math.round(rival.share)}%</p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-paper">
            <div className="h-full bg-ink" style={{ width: `${Math.min(100, rival.share)}%` }} />
          </div>
          <p className="mt-1 text-sm text-mist">{rival.note}</p>
        </article>
      ))}
      <h3 className="font-display text-2xl">Registro</h3>
      <ul className="grid gap-2">
        {game.log.slice(0, 12).map((item, index) => (
          <li key={index} className="text-sm leading-snug">
            <span className="text-mist">s{item.week} · </span>
            {item.text}
          </li>
        ))}
      </ul>
      <button type="button" className="min-h-11 rounded-full border border-line text-mist" onClick={reset}>
        {armReset ? "Conferma: chiudi l'azienda" : "Nuova azienda"}
      </button>
    </div>
  );
}
