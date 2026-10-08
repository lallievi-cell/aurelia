import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, FlaskConical, GitBranch, Globe2, Map as MapIcon, Minus, Pause, Play, Plus, ScrollText, Users, X } from "lucide-react";
import { blip, unlockAudio } from "@/tycoon/audio";
import { drawCampus, fitZoom, pickSign, pickTile, cameraBounds, type Cam } from "@/tycoon/draw";
import {
  AUTHORITIES,
  ERA_LABEL,
  GEAR,
  GOAL_TEXT,
  INDICATION_BOOK,
  INDICATIONS,
  MAT_LABEL,
  NEXT_STAGE,
  PARCELS,
  ROLE_LABEL,
  ROOMS,
  STAGE_LABEL,
  TECH,
  acceptOffer,
  advanceProgram,
  anchorsOf,
  assign,
  audit,
  buyParcel,
  buyTech,
  canCorridor,
  canExpand,
  canInstall,
  canPlace,
  capOf,
  coverage,
  declineOffer,
  demandOf,
  deskLines,
  dismiss,
  euro,
  expandRoom,
  gearDef,
  gearOn,
  hasGear,
  hasTech,
  hire,
  installGear,
  labPace,
  launchProduct,
  licenseOut,
  licenseValue,
  matPrice,
  newGame,
  orderMat,
  pinJob,
  parcelAt,
  placeCorridor,
  placeRoom,
  powerReport,
  pushScience,
  removeCorridor,
  removeGear,
  removeRoom,
  researchCost,
  researchGate,
  roomDef,
  roomOnline,
  scienceRate,
  sellerOn,
  setAutoBuy,
  setPrice,
  SHAPE_LABEL,
  slotsFor,
  staffIn,
  startProgram,
  techDef,
  TIER_LABEL,
  tick,
  train,
  trialRisk,
  tuneOffer,
  upgradeGear,
  upgradeRoom,
  upgradeRoomCost,
  waitingProgram,
  yearOf,
  type Focus,
  type Game,
  type Job,
  type MatKey,
  type Modality,
  type Offer,
  type ParcelId,
  type Program,
  type RoomType,
  type Stage,
  type TechId,
} from "@/tycoon/model";
import { clearGame, loadGame, saveGame } from "@/tycoon/save";

type Tab = "map" | "deals" | "research" | "tech" | "team" | "world";

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
  const [roomId, setRoomId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [indication, setIndication] = useState(INDICATIONS[0]!);
  const [armReset, setArmReset] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cam = useRef<Cam>({ panX: 0, panY: 0, zoom: 1, user: false });
  const gameRef = useRef<Game | null>(null);
  const cellRef = useRef<{ c: number; r: number } | null>(null);
  const playRef = useRef(false);
  const drag = useRef({ x: 0, y: 0, panX: 0, panY: 0, moved: false, active: false });
  gameRef.current = game;
  cellRef.current = cell;
  playRef.current = playing;

  useEffect(() => {
    const saved = loadGame();
    if (saved) setGame(saved);
    setBooted(true);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2600);
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
        drawCampus(ctx, current, rect.width, rect.height, cam.current, now / 1000, cellRef.current);
      }
      if (playRef.current && current && !waitingProgram(current)) {
        acc += dt;
        if (acc >= 1.05) {
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
    cam.current = { panX: 0, panY: 0, zoom: 1, user: false };
    commit(newGame(company, focus), setGame);
  }

  function apply(next: Game | string) {
    unlockAudio();
    if (typeof next === "string") {
      setToast(next);
      return;
    }
    commit(next, setGame);
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    drag.current = { x: e.clientX, y: e.clientY, panX: cam.current.panX, panY: cam.current.panY, moved: false, active: true };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* già rilasciato */
    }
  }
  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    if (Math.hypot(dx, dy) > 8) drag.current.moved = true;
    if (!drag.current.moved) return;
    cam.current.panX = drag.current.panX + dx;
    cam.current.panY = drag.current.panY + dy;
  }
  function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    drag.current.active = false;
    if (!game || drag.current.moved) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;
    const sign = pickSign(localX, localY);
    if (sign) {
      const parcel = PARCELS.find((item) => item.id === sign);
      if (!parcel) return;
      setRoomId(null);
      setCell({ c: parcel.c0, r: parcel.r0 });
      return;
    }
    const hit = pickTile(localX, localY, rect.width, rect.height, cam.current, game);
    if (!hit) return;
    const tile = game.tiles[hit.r]![hit.c]!;
    if (tile.ground === "garden") {
      setToast("Il cortile resta verde.");
      return;
    }
    if (tile.roomId) {
      setRoomId(tile.roomId);
      setCell(null);
      return;
    }
    setRoomId(null);
    setCell(hit);
  }

  const goal = game ? GOAL_TEXT.find((item) => !game.goals.includes(item.id)) : null;
  const waiting = game ? waitingProgram(game) : null;
  const power = game ? powerReport(game) : null;

  if (!booted) return <div className="grid h-dvh place-items-center bg-paper font-display text-3xl text-ink">Aurelia</div>;

  if (!game) {
    return (
      <div className="safe-top safe-bot h-dvh overflow-y-auto bg-paper text-ink">
        <div className="mx-auto flex min-h-full max-w-lg flex-col justify-center gap-6 px-5 py-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-teal">CDMO</p>
            <h1 className="font-display text-5xl leading-none">Aurelia</h1>
            <p className="mt-3 text-base leading-relaxed text-mist">
              Parti da un lotto piccolo. Allunga i corridoi, posa le stanze e compra le macchine. Senza tecnica e senza corrente, la stanza resta vuota.
            </p>
          </div>
          <label className="block">
            <span className="text-sm text-mist">Nome</span>
            <input value={company} maxLength={22} onChange={(e) => setCompany(e.target.value)} className="mt-1 min-h-12 w-full rounded-xl border border-line bg-card px-3 font-display text-2xl outline-none" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <FocusCard title="Sintesi" text="Il pilota è la prima linea. L'impianto arriva dopo." on={focus === "sintesi"} click={() => setFocus("sintesi")} />
            <FocusCard title="Biologici" text="Parti con il GMP già in tasca. La suite è comunque tardi." on={focus === "biologici"} click={() => setFocus("biologici")} />
          </div>
          <button type="button" onClick={found} className="min-h-12 rounded-full bg-teal font-semibold text-card">
            Apri il lotto
          </button>
        </div>
      </div>
    );
  }

  const room = game.rooms.find((item) => item.id === roomId) ?? null;

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
        <button type="button" aria-label="Avanza di una settimana" onClick={() => apply(tick(game))} className="grid h-11 w-11 place-items-center rounded-full bg-amber text-ink">
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
      <div className="grid grid-cols-4 gap-1 border-b border-line bg-card px-2 py-1 text-center text-[11px] text-mist">
        <span>API {game.api}/{capOf(game, "api")}</span>
        <span>Sol {game.solvent}</span>
        <span>Sci {Math.floor(game.science)}</span>
        <span>
          kW {power?.demand}/{power?.supply}
        </span>
      </div>

      <main className="relative min-h-0 flex-1">
        {tab === "map" ? (
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} />
        ) : (
          <div className="absolute inset-0 overflow-y-auto px-4 py-4 pb-28">
            {tab === "deals" ? <Deals game={game} apply={apply} /> : null}
            {tab === "research" ? <Research game={game} apply={apply} indication={indication} setIndication={setIndication} /> : null}
            {tab === "tech" ? <TechTree game={game} apply={apply} /> : null}
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
                  setRoomId(null);
                  setCell(null);
                  setArmReset(false);
                }}
              />
            ) : null}
          </div>
        )}

        {tab === "map" && !room && !cell && goal ? (
          <div className="pointer-events-none absolute bottom-3 left-3 right-16 truncate rounded-full bg-card/95 px-3 py-2 text-sm shadow-sm">
            <span className="text-mist">Ora · </span>
            {goal.label}
          </div>
        ) : null}

        {tab === "map" ? (
          <div className="absolute right-3 bottom-3 flex flex-col gap-2">
            <button type="button" aria-label="Avvicina" className="grid h-11 w-11 place-items-center rounded-full bg-card shadow-sm" onClick={() => zoomBy(cam.current, canvasRef.current, game, 1.12)}>
              <Plus />
            </button>
            <button type="button" aria-label="Allontana" className="grid h-11 w-11 place-items-center rounded-full bg-card shadow-sm" onClick={() => zoomBy(cam.current, canvasRef.current, game, 0.88)}>
              <Minus />
            </button>
          </div>
        ) : null}

        {toast ? <p className="absolute top-3 right-3 left-3 z-40 rounded-xl bg-ink px-3 py-2 text-sm text-card">{toast}</p> : null}
        {waiting && playing ? <p className="absolute top-16 right-16 left-3 rounded-xl bg-amber px-3 py-2 text-sm text-ink">{waiting.code} aspetta una decisione. Pausa.</p> : null}

        {tab === "map" && cell ? (
          <BuildSheet
            game={game}
            c={cell.c}
            r={cell.r}
            apply={apply}
            close={() => setCell(null)}
            bought={() => {
              cam.current.user = false;
              cam.current.panX = 0;
              cam.current.panY = 0;
            }}
          />
        ) : null}
        {tab === "map" && room ? (
          <Sheet title={roomDef(room.type).name} onClose={() => setRoomId(null)} back>
            <RoomPanel game={game} id={room.id} apply={apply} close={() => setRoomId(null)} />
          </Sheet>
        ) : null}
      </main>

      <nav className="safe-bot z-20 grid grid-cols-6 border-t border-line bg-card">
        <Nav icon={<MapIcon />} label="Mappa" on={tab === "map"} click={() => setTab("map")} />
        <Nav icon={<ScrollText />} label="Contratti" on={tab === "deals"} click={() => setTab("deals")} dot={game.offers.length > 0} />
        <Nav icon={<FlaskConical />} label="Ricerca" on={tab === "research"} click={() => setTab("research")} dot={game.pipeline.some((item) => item.waiting)} />
        <Nav icon={<GitBranch />} label="Tecniche" on={tab === "tech"} click={() => setTab("tech")} />
        <Nav icon={<Users />} label="Persone" on={tab === "team"} click={() => setTab("team")} />
        <Nav icon={<Globe2 />} label="Mondo" on={tab === "world"} click={() => setTab("world")} />
      </nav>
    </div>
  );
}

function zoomBy(cam: Cam, canvas: HTMLCanvasElement | null, game: Game, factor: number) {
  const rect = canvas?.getBoundingClientRect();
  const base = cam.user ? cam.zoom : fitZoom(rect?.width ?? 390, rect?.height ?? 520, cameraBounds(game));
  cam.user = true;
  cam.zoom = Math.max(0.32, Math.min(1.7, base * factor));
}

function Nav({ icon, label, on, click, dot }: { icon: ReactNode; label: string; on: boolean; click: () => void; dot?: boolean }) {
  return (
    <button type="button" onClick={click} className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[10px] leading-none ${on ? "text-teal" : "text-mist"}`}>
      <span className="relative [&_svg]:h-5 [&_svg]:w-5">
        {icon}
        {dot ? <span className="absolute -top-0.5 -right-1.5 h-2 w-2 rounded-full bg-amber" /> : null}
      </span>
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
    <section className="absolute inset-x-0 bottom-0 z-30 max-h-[72%] overflow-y-auto rounded-t-3xl border border-line bg-card px-4 pt-3 pb-4 shadow-md">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl">{title}</h2>
        <button type="button" aria-label={back ? "Chiudi scheda" : "Chiudi"} onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full bg-paper">
          {back ? <ArrowLeft /> : <X />}
        </button>
      </div>
      {children}
    </section>
  );
}

function BuildSheet({ game, c, r, apply, close, bought }: { game: Game; c: number; r: number; apply: (g: Game | string) => void; close: () => void; bought: () => void }) {
  const parcel = parcelAt(c, r);
  const tile = game.tiles[r]![c]!;
  if (!parcel) return null;
  if (!game.owned.includes(parcel.id)) {
    return (
      <Sheet title={parcel.name} onClose={close}>
        <p className="text-sm text-mist">{parcel.tech ? `Tecnica: ${techDef(parcel.tech).name}. ` : ""}{parcel.needBatch ? "Serve un lotto già consegnato. " : ""}Costa {euro(parcel.cost)}.</p>
        <button
          type="button"
          className="mt-3 min-h-11 w-full rounded-full bg-teal text-card"
          onClick={() => {
            const result = buyParcel(game, parcel.id as ParcelId);
            if (typeof result !== "string") bought();
            apply(result);
            if (typeof result !== "string") close();
          }}
        >
          Compra il lotto
        </button>
      </Sheet>
    );
  }
  const options = ROOMS.filter((def) => def.type !== "hq" && def.parcels.includes(parcel.id));
  return (
    <Sheet title={tile.corridor ? "Corridoio" : "Costruisci"} onClose={close}>
      <p className="mb-2 text-sm text-mist">
        Lotto {parcel.name}. Per una stanza tocca l'angolo nord-ovest: la stanza cresce verso est e verso sud.
      </p>
      {tile.corridor ? (
        <button type="button" className="mb-2 min-h-11 w-full rounded-full bg-paper" onClick={() => { apply(removeCorridor(game, c, r)); close(); }}>
          Togli corridoio · rimborso 4 mila €
        </button>
      ) : (
        <button
          type="button"
          className="mb-2 min-h-11 w-full rounded-full bg-ink text-card"
          onClick={() => {
            const result = placeCorridor(game, c, r);
            apply(result);
            if (typeof result !== "string") close();
          }}
        >
          Corridoio · 8 mila €{canCorridor(game, c, r) ? ` · ${canCorridor(game, c, r)}` : ""}
        </button>
      )}
      <div className="grid gap-2">
        {options.map((def) => {
          const block = canPlace(game, def.type as RoomType, c, r);
          return (
            <button
              key={def.type}
              type="button"
              className="min-h-14 rounded-xl border border-line bg-paper px-3 text-left"
              onClick={() => {
                const result = placeRoom(game, def.type, c, r);
                apply(result);
                if (typeof result !== "string") close();
              }}
            >
              <span className="block font-medium">
                {def.name} · {def.w}×{def.h}
              </span>
              <span className="block text-sm text-mist">{block ?? def.blurb}</span>
              <span className="font-display text-amber">{euro(def.shell)}</span>
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}

function RoomPanel({ game, id, apply, close }: { game: Game; id: string; apply: (g: Game | string) => void; close: () => void }) {
  const room = game.rooms.find((item) => item.id === id);
  const [pick, setPick] = useState<number | null>(null);
  useEffect(() => setPick(null), [id]);
  if (!room) return null;
  const def = roomDef(room.type);
  const crew = staffIn(game, id);
  const free = game.staff.filter((s) => !s.roomId && def.role && s.role === def.role);
  const online = roomOnline(game, room);
  return (
    <div className="grid gap-3">
      <p className="text-sm text-mist">
        {def.w}×{def.h} · livello {room.level} · {online ? "collegata" : "non collegata alla direzione"}
        {room.halt > 0 ? ` · ferma ${room.halt} sett.` : ""} · posti {slotsFor(room)}
      </p>
      {def.role ? (
        <div className="grid gap-2">
          {crew.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-xl bg-paper px-3 py-2">
              <span>
                {s.name}
                <span className="block text-sm text-mist">abilità {s.skill}</span>
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
        </div>
      ) : null}
      {room.slots.map((slot, index) => {
        const item = slot.item;
        if (!item) {
          const open = pick === index;
          return (
            <div key={index} className="rounded-xl border border-dashed border-line p-2">
              <button type="button" className="min-h-11 w-full text-left text-sm" onClick={() => setPick(open ? null : index)}>
                Posto {index + 1} · {open ? "scegli qui sotto" : "tocca per arredare"}
              </button>
              {open ? <GearChoices game={game} roomType={room.type} roomId={id} index={index} apply={apply} /> : null}
            </div>
          );
        }
        const spec = gearDef(item.defId);
        const on = gearOn(game, id, index);
        return (
          <div key={index} className="rounded-xl bg-paper px-3 py-2">
            <p className="font-medium">
              {item.defId === "reattore" && item.level === 2 ? "Reattore 50 L" : item.defId === "reattore" && item.level === 3 ? "Reattore 200 L" : spec.name}
              {item.mat ? ` · ${MAT_LABEL[item.mat]}` : ""}
            </p>
            <p className="text-sm text-mist">
              Livello {item.level}/{spec.maxLevel} · {on ? "alimentata" : "senza corrente"}
            </p>
            <div className="mt-2 flex gap-2">
              {item.level < spec.maxLevel ? (
                <button type="button" className="min-h-11 flex-1 rounded-full bg-ink text-sm text-card" onClick={() => apply(upgradeGear(game, id, index))}>
                  Potenzia · {euro(spec.cost * item.level)}
                </button>
              ) : null}
              {item.defId !== "scrivania" ? (
                <button type="button" className="min-h-11 rounded-full px-3 text-sm text-mist" onClick={() => apply(removeGear(game, id, index))}>
                  Vendi
                </button>
              ) : null}
            </div>
          </div>
        );
      })}
      {room.level < 3 ? (
        <button type="button" className="min-h-11 rounded-full bg-ink text-card" onClick={() => apply(upgradeRoom(game, id))}>
          Livello stanza {room.level + 1} · {euro(upgradeRoomCost(room))}
        </button>
      ) : null}
      {def.expand && !room.expanded ? (
        <button type="button" className="min-h-11 rounded-full bg-paper" onClick={() => apply(expandRoom(game, id))}>
          Allarga · {euro(Math.round(def.shell * 0.7))}
          {canExpand(game, id) ? ` · ${canExpand(game, id)}` : ""}
        </button>
      ) : null}
      {room.type === "qc" && hasGear(game, "bilancia") ? (
        <button type="button" className="min-h-11 rounded-full bg-teal text-card" onClick={() => apply(audit(game))}>
          Audit · 40 mila €
        </button>
      ) : null}
      {room.type !== "hq" ? (
        <button type="button" className="min-h-11 rounded-full border border-line text-mist" onClick={() => { const result = removeRoom(game, id); apply(result); if (typeof result !== "string") close(); }}>
          Smonta il guscio vuoto
        </button>
      ) : null}
      <p className="text-sm text-mist">Ancoraggi usati {room.slots.filter((s) => s.item).length}/{anchorsOf(room)}. Copertura qualità {Math.round(coverage(game))}.</p>
    </div>
  );
}

function GearChoices({ game, roomType, roomId, index, apply }: { game: Game; roomType: RoomType; roomId: string; index: number; apply: (g: Game | string) => void }) {
  const gear = GEAR.filter((item) => item.room === roomType && item.id !== "scrivania");
  return (
    <div className="mt-2 grid gap-2">
      {gear.map((item) =>
        item.mats ? (
          <div key={item.id} className="grid grid-cols-3 gap-1">
            {(["api", "solvent", "eccipient"] as MatKey[]).map((mat) => (
              <button key={mat} type="button" className="min-h-11 rounded-lg bg-paper text-xs" onClick={() => apply(installGear(game, roomId, index, item.id, mat))}>
                Scaffale {MAT_LABEL[mat]}
              </button>
            ))}
          </div>
        ) : (
          <button key={item.id} type="button" className="min-h-11 rounded-lg bg-paper px-2 text-left text-sm" onClick={() => apply(installGear(game, roomId, index, item.id))}>
            {item.name} · {euro(item.cost)}
            {canInstall(game, roomId, index, item.id) ? <span className="block text-mist">{canInstall(game, roomId, index, item.id)}</span> : null}
            <span className="block text-mist">{item.kw ? `${item.id === "reattore" ? "3–5" : item.kw} kW` : item.supply ? `+${item.supply} kW a livello` : "non consuma"}</span>
          </button>
        ),
      )}
    </div>
  );
}

const TIER_INK: Record<Offer["tier"], string> = { pilota: "#c88812", standard: "#1b7a64", premium: "#8a4e12", sterile: "#2c5d78" };
const TIER_SEAL: Record<Offer["tier"], string> = { pilota: "PIL", standard: "STD", premium: "SCA", sterile: "STE" };
const CLAUSES: { key: "rush" | "tight" | "penalty"; name: string; text: string }[] = [
  { key: "rush", name: "Termine stretto", text: "Due settimane in meno. Paga +14%." },
  { key: "tight", name: "Specifica stretta", text: "Qualità chiesta +8. Paga +10%." },
  { key: "penalty", name: "Penale", text: "Il primo scarto o il ritardo costa. Paga +8%." },
];

function Deals({ game, apply }: { game: Game; apply: (g: Game | string) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const clients = game.clients ?? [];
  const jobs = [...game.jobs].sort((a, b) => (a.status === b.status ? (a.due ?? 0) - (b.due ?? 0) : a.status === "active" ? -1 : 1));
  const offers = [...game.offers].sort((a, b) => a.expires - b.expires);
  return (
    <div className="mx-auto grid max-w-lg gap-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Sala</p>
        <h2 className="font-display text-4xl leading-none">Contratti</h2>
        <p className="mt-2 text-sm leading-snug text-mist">
          {sellerOn(game) ? "La sala tiene quattro buste e alza l'incasso di ogni lotto." : "Tre buste alla volta. Con la sala e un commerciale diventano quattro, e pagano meglio."}
        </p>
      </div>

      <section className="grid gap-2">
        <h3 className="font-display text-2xl">In macchina</h3>
        {jobs.length ? jobs.map((job) => <JobCard key={job.id} game={game} job={job} apply={apply} />) : <p className="rounded-2xl border border-dashed border-line px-3 py-4 text-sm text-mist">Nessun lotto in macchina. Firma una busta.</p>}
      </section>

      <section className="grid gap-3">
        <h3 className="font-display text-2xl">Sul tavolo</h3>
        {offers.length ? offers.map((offer) => (
          <Letter key={offer.id} game={game} offer={offer} open={open === offer.id} apply={apply} toggle={() => setOpen(open === offer.id ? null : offer.id)} signed={() => setOpen(null)} />
        )) : <p className="text-sm text-mist">Il tavolo è vuoto. Le case riscrivono entro un paio di settimane.</p>}
      </section>

      <section className="grid gap-2">
        <h3 className="font-display text-2xl">Le case</h3>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {clients.map((client) => (
            <div key={client.id} className="flex w-28 shrink-0 flex-col gap-1 rounded-2xl border border-line bg-card px-2 py-2">
              <span className="seal sm" style={{ background: TIER_INK[client.taste] }}>{TIER_SEAL[client.taste]}</span>
              <span className="truncate text-sm font-medium">{client.name}</span>
              <TrustPips trust={client.trust} />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-card p-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-xl">Scaffali</h3>
          <button type="button" className="min-h-11 rounded-full bg-paper px-3 text-sm" onClick={() => apply(setAutoBuy(game, !game.autoBuy))}>
            {game.autoBuy ? "Riordino acceso" : "Riordino spento"}
          </button>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <OrderButton label="API" have={game.api} cap={capOf(game, "api")} onClick={() => apply(orderMat(game, "api", 8))} />
          <OrderButton label="Solvente" have={game.solvent} cap={capOf(game, "solvent")} onClick={() => apply(orderMat(game, "solvent", 8))} />
          <OrderButton label="Eccipiente" have={game.eccipient} cap={capOf(game, "eccipient")} onClick={() => apply(orderMat(game, "eccipient", 8))} />
          <OrderButton label="Flaconi" have={game.vials} cap={capOf(game, "vials")} onClick={() => apply(orderMat(game, "vials", 6))} />
        </div>
      </section>
    </div>
  );
}

function TrustPips({ trust }: { trust: number }) {
  const n = Math.max(0, Math.min(5, Math.round(trust / 20)));
  return (
    <span className="mt-1 flex gap-0.5" aria-label={`fiducia ${n} su 5`}>
      {Array.from({ length: 5 }, (_, i) => <span key={i} className={`h-1.5 w-2 rounded-full ${i < n ? "bg-teal" : "bg-line"}`} />)}
    </span>
  );
}

function OrderButton({ label, have, cap, onClick }: { label: string; have: number; cap: number; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="min-h-11 rounded-xl bg-paper px-2 text-left text-sm">
      <span className="block font-medium">{label} +</span>
      <span className="text-mist">{have}/{cap}</span>
    </button>
  );
}

function BatchRail({ job, light }: { job: Job; light?: boolean }) {
  const done = job.done ?? 0;
  const progress = job.progress ?? 0;
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: job.batches }, (_, i) => {
        const pct = i < done ? 100 : i === done ? Math.round(Math.min(1, progress) * 100) : 0;
        const ink = light ? "#e7c27a" : "#1b7a64";
        const rest = light ? "rgba(255,255,255,0.16)" : "rgba(18,38,44,0.1)";
        return <span key={i} className="h-2.5 flex-1 rounded-full" style={{ background: `linear-gradient(90deg, ${ink} ${pct}%, ${rest} ${pct}%)` }} />;
      })}
    </div>
  );
}

function dueLabel(game: Game, job: Job) {
  const due = job.due ?? game.week + (job.dueWeeks ?? 8);
  const left = due - game.week;
  if (left > 1) return `entro ${left} sett.`;
  if (left === 1) return "entro una settimana";
  if (left === 0) return "scade questa settimana";
  return left === -1 ? "in ritardo di una settimana" : `in ritardo di ${-left} sett.`;
}

function JobCard({ game, job, apply }: { game: Game; job: Job; apply: (g: Game | string) => void }) {
  const late = game.week > (job.due ?? game.week);
  const room = game.rooms.find((r) => r.id === job.roomId);
  const lines = deskLines(game, job.tier).filter((line) => line.fit);
  if (job.status === "active") {
    return (
      <article className="dossier px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber">In linea · {TIER_LABEL[job.tier]}</p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <h4 className="font-display text-2xl leading-none">{job.client}</h4>
          <p className="text-sm">{job.done}/{job.batches}</p>
        </div>
        <div className="mt-3"><BatchRail job={job} light /></div>
        <p className={`mt-2 text-sm ${late ? "text-amber" : "text-white/70"}`}>
          {room ? roomDef(room.type).name : "Linea"} · {dueLabel(game, job)}
          {job.scrap ? ` · ${job.scrap} scarti` : ""}
        </p>
      </article>
    );
  }
  return (
    <article className="letter queue px-4 py-3 pl-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber">In coda · {SHAPE_LABEL[job.shape] ?? TIER_LABEL[job.tier]}</p>
      <h4 className="mt-1 font-display text-2xl leading-none">{job.client}</h4>
      <p className={`mt-1 text-sm ${late ? "text-amber" : "text-mist"}`}>{dueLabel(game, job)}{job.prefer ? "" : " · prima linea libera"}</p>
      {lines.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button type="button" className={`min-h-11 rounded-full px-3 text-sm ${job.prefer ? "bg-card" : "bg-ink text-card"}`} onClick={() => apply(pinJob(game, job.id, null))}>Prima libera</button>
          {lines.map((line) => (
            <button key={line.id} type="button" className={`min-h-11 rounded-full px-3 text-left text-sm ${job.prefer === line.id ? "bg-ink text-card" : "bg-card"}`} onClick={() => apply(pinJob(game, job.id, line.id))}>
              {line.name}
              <span className="block text-[10px] opacity-70">{line.why}</span>
            </button>
          ))}
        </div>
      ) : <p className="mt-2 text-sm text-mist">Resta fermo finché non costruisci la linea giusta.</p>}
    </article>
  );
}

function Letter({ game, offer, open, apply, toggle, signed }: { game: Game; offer: Offer; open: boolean; apply: (g: Game | string) => void; toggle: () => void; signed: () => void }) {
  const client = game.clients?.find((c) => c.id === offer.clientId);
  const clauses = offer.clauses ?? { rush: false, tight: false, penalty: false };
  const left = Math.max(0, offer.expires - game.week);
  const mats = (["api", "solvent", "eccipient", "vials"] as const).filter((key) => offer[key] > 0);
  const gap = offer.quality - coverage(game);
  const lines = deskLines(game, offer.tier);
  const ready = lines.filter((line) => line.ready);
  const fit = ready.length ? `${ready[0]!.name} può prenderlo.` : lines.some((line) => line.fit) ? "La linea c'è, ma non è pronta: il contratto aspetta in coda." : "Non hai ancora la linea. Firmare lo mette in coda.";
  const spec = gap > 12 ? "Specifica sopra il QC: più scarti." : gap > 2 ? "Specifica appena sopra la copertura." : "Il QC copre la specifica.";
  return (
    <article className="letter px-4 py-3 pl-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal">{SHAPE_LABEL[offer.shape] ?? "Busta"} · {TIER_LABEL[offer.tier]}</p>
          <h4 className="mt-1 font-display text-3xl leading-none">{offer.client}</h4>
          {client ? <p className="mt-1 text-sm text-mist">{client.note}</p> : null}
        </div>
        <span className="seal shrink-0" style={{ background: TIER_INK[offer.tier] }}>{TIER_SEAL[offer.tier]}</span>
      </div>
      <p className="mt-3 text-sm leading-snug">{offer.blurb}</p>
      <p className="mt-2 font-display text-3xl leading-none text-teal">{euro(offer.pay)}</p>
      <p className="mt-1 text-sm text-mist">
        {offer.batches} lotti · {offer.dueWeeks ?? 8} sett. · qualità {offer.quality}
        {offer.science ? ` · +${offer.science} scienza` : ""}
      </p>
      <p className={`mt-1 text-sm ${left <= 2 ? "text-amber" : "text-mist"}`}>{left <= 1 ? "Ultima settimana sul tavolo" : `Sparisce tra ${left} sett.`}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {mats.map((key) => <span key={key} className="rounded-full bg-card px-2 py-1 text-xs text-mist">{MAT_LABEL[key]} {offer[key]}</span>)}
        {clauses.rush ? <span className="rounded-full bg-ink px-2 py-1 text-xs text-card">Stretto</span> : null}
        {clauses.tight ? <span className="rounded-full bg-ink px-2 py-1 text-xs text-card">Specifica</span> : null}
        {clauses.penalty ? <span className="rounded-full bg-ink px-2 py-1 text-xs text-card">Penale</span> : null}
      </div>
      {open ? (
        <div className="mt-3 grid gap-2">
          {CLAUSES.map((clause) => (
            <button key={clause.key} type="button" aria-pressed={clauses[clause.key]} className={`min-h-14 rounded-xl px-3 text-left ${clauses[clause.key] ? "bg-ink text-card" : "bg-card"}`} onClick={() => apply(tuneOffer(game, offer.id, clause.key))}>
              <span className="block text-sm font-medium">{clause.name}</span>
              <span className={`block text-xs ${clauses[clause.key] ? "text-white/70" : "text-mist"}`}>{clause.text}</span>
            </button>
          ))}
          <p className="text-sm text-mist">{fit} {spec}</p>
          <button type="button" className="min-h-12 rounded-full bg-teal font-semibold text-card" onClick={() => { signed(); apply(acceptOffer(game, offer.id)); }}>Firma così</button>
          <button type="button" className="min-h-11 rounded-full text-sm text-mist" onClick={() => { signed(); apply(declineOffer(game, offer.id)); }}>Rimanda la busta</button>
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" className="min-h-11 rounded-full bg-paper text-sm" onClick={toggle}>Tratta</button>
          <button type="button" className="min-h-11 rounded-full bg-teal font-semibold text-card" onClick={() => apply(acceptOffer(game, offer.id))}>Firma</button>
        </div>
      )}
    </article>
  );
}

const TRACK: Stage[] = ["discovery", "lead", "preclinical", "patent", "phase1", "phase2", "phase3", "dossier", "review"];

function trackAt(stage: Stage) {
  if (stage === "approved" || stage === "launched") return TRACK.length;
  return TRACK.indexOf(stage);
}

function Research({ game, apply, indication, setIndication }: { game: Game; apply: (g: Game | string) => void; indication: string; setIndication: (v: string) => void }) {
  const [modality, setModality] = useState<Modality>("chimica");
  const picked = INDICATION_BOOK.find((item) => item.name === indication) ?? INDICATION_BOOK[0]!;
  const slots = 1 + (hasTech(game, "piattaforma") ? 1 : 0);
  const active = game.pipeline.filter((item) => !["failed", "launched", "licensed"].includes(item.stage)).length;
  const labReady = game.rooms.some((room) => room.type === "discovery" && staffIn(game, room.id, "scientist").length > 0 && hasGear(game, "banco"));
  const rate = scienceRate(game);
  const open = game.pipeline.filter((item) => !["failed", "launched", "licensed"].includes(item.stage)).sort((a, b) => Number(b.waiting) - Number(a.waiting));
  const closed = game.pipeline.filter((item) => ["failed", "launched", "licensed"].includes(item.stage));
  return (
    <div className="mx-auto grid max-w-lg gap-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Quaderno</p>
        <h2 className="font-display text-4xl leading-none">Ricerca</h2>
        <p className="mt-2 text-sm leading-snug text-mist">I contratti pagano il laboratorio. La qualità dei lotti entra nei trial. La scienza sblocca le tecniche, oppure spinge una pagina.</p>
      </div>

      <section className="notebook px-4 py-3 pl-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal">Nuova pagina</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button type="button" className={`min-h-11 rounded-full text-sm ${modality === "chimica" ? "bg-ink text-card" : "bg-card"}`} onClick={() => setModality("chimica")}>Chimica</button>
          <button type="button" className={`min-h-11 rounded-full text-sm ${modality === "biologico" ? "bg-ink text-card" : "bg-card"}`} onClick={() => setModality("biologico")}>Biologico</button>
        </div>
        <p className="mt-2 text-sm text-mist">{modality === "chimica" ? "Il banco che hai. Se sei partito dai biologici, la scoperta è un filo più lenta." : "Più svelta se sei partito dai biologici. In fase II e III chiede 4 flaconi."}</p>
        <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
          {INDICATION_BOOK.map((item) => (
            <button key={item.name} type="button" className={`min-h-11 shrink-0 rounded-full px-3 text-sm ${item.name === picked.name ? "bg-teal text-card" : "bg-card"}`} onClick={() => setIndication(item.name)}>
              {item.name}
            </button>
          ))}
        </div>
        <h3 className="mt-3 font-display text-3xl leading-none">{picked.name}</h3>
        <p className="mt-1 text-sm">{picked.note}</p>
        <p className="mt-1 text-sm text-mist">Trial {picked.risk >= 0.16 ? "alto" : picked.risk >= 0.11 ? "medio" : "basso"} · mercato {picked.pull >= 1.25 ? "grosso" : picked.pull >= 1.05 ? "largo" : "stretto"}</p>
        <p className="mt-2 text-sm text-mist">Pagine {active}/{slots} · scienza {Math.floor(game.science)} · circa {rate.toFixed(1).replace(".", ",")} a settimana</p>
        {!labReady ? <p className="mt-2 text-sm text-amber">Serve il lab di scoperta, il banco chimico e uno scienziato dentro.</p> : null}
        <button type="button" className="mt-3 min-h-12 w-full rounded-full bg-teal font-semibold text-card" onClick={() => apply(startProgram(game, picked.name, modality))}>Apri la pagina · 70 mila €</button>
      </section>

      <section className="grid gap-3">
        <h3 className="font-display text-2xl">Pagine aperte</h3>
        {open.length ? open.map((program) => <StudyPage key={program.id} game={game} program={program} apply={apply} />) : <p className="rounded-2xl border border-dashed border-line px-3 py-4 text-sm text-mist">Il quaderno è vuoto. La prima pagina costa 70 mila €.</p>}
      </section>

      {closed.length ? (
        <section className="grid gap-2">
          <h3 className="font-display text-2xl">Archivio</h3>
          {closed.map((program) => {
            const product = game.products.find((item) => item.code === program.code);
            return (
              <article key={program.id} className="rounded-2xl border border-line bg-card px-3 py-2">
                <p className="font-medium">{program.code} · {program.indication}</p>
                <p className="text-sm text-mist">
                  {program.stage === "licensed" ? "Ceduta. I diritti non sono più tuoi." : program.stage === "failed" ? "Ferma. Il trial non ha retto." : `In commercio${product?.patentLeft ? ` · brevetto ${product.patentLeft} sett.` : ""}. Il prezzo sta in Mondo.`}
                </p>
              </article>
            );
          })}
        </section>
      ) : null}
    </div>
  );
}

function StudyPage({ game, program, apply }: { game: Game; program: Program; apply: (g: Game | string) => void }) {
  const pace = labPace(game, program);
  const step = NEXT_STAGE[program.stage];
  const at = trackAt(program.stage);
  const pct = pace.need > 0 ? Math.max(0, Math.min(100, (program.progress / pace.need) * 100)) : 0;
  const rival = game.rivals.find((item) => item.id === program.rivalId);
  const risk = trialRisk(game, program);
  const gate = researchGate(game, program);
  const cost = researchCost(game, program);
  const canPush = !program.waiting && ["discovery", "lead", "preclinical", "dossier"].includes(program.stage);
  const book = INDICATION_BOOK.find((item) => item.name === program.indication);
  return (
    <article className="notebook px-4 py-3 pl-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal">{STAGE_LABEL[program.stage]} · {(program.modality ?? "chimica") === "biologico" ? "Biologico" : "Chimica"}</p>
          <h4 className="mt-1 font-display text-3xl leading-none">{program.code}</h4>
          <p className="mt-1 text-sm text-mist">{program.indication}{program.patented ? " · brevettata" : ""}</p>
        </div>
        <span className="seal shrink-0" style={{ background: "#1b7a64" }}>{program.code.slice(-3)}</span>
      </div>
      {book ? <p className="mt-2 text-sm">{book.note}</p> : null}
      <div className="mt-3 flex gap-1">
        {TRACK.map((stage, index) => <span key={stage} className={`h-1.5 flex-1 rounded-full ${at > index ? "bg-teal" : at === index ? "bg-amber" : "bg-line"}`} />)}
      </div>
      {program.stage !== "review" && program.stage !== "approved" ? (
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/70">
          <div className={`h-full ${program.waiting ? "bg-amber" : "bg-teal"}`} style={{ width: `${program.waiting ? 100 : pct}%` }} />
        </div>
      ) : null}
      <p className="mt-2 text-sm">{pace.text}</p>
      {rival ? <p className="mt-1 text-sm text-amber">{rival.name} è sulla stessa indicazione · pressione {program.heat ?? 0}/3</p> : null}
      {program.stage === "approved" ? <button type="button" className="mt-3 min-h-12 w-full rounded-full bg-teal font-semibold text-card" onClick={() => apply(launchProduct(game, program.id))}>Metti in commercio</button> : null}
      {program.waiting && step && program.stage !== "dossier" ? (
        <div className="mt-3 grid gap-2">
          {risk > 0 ? <p className="text-sm">Rischio di fermarsi {Math.round(risk * 100)}%. La qualità dei lotti lo abbassa.</p> : null}
          {(program.modality ?? "chimica") === "biologico" && (program.stage === "phase1" || program.stage === "phase2") ? <p className="text-sm text-mist">Il passaggio chiede 4 flaconi.</p> : null}
          {gate ? <p className="text-sm text-amber">{gate}</p> : null}
          <button type="button" className="min-h-12 rounded-full bg-ink font-semibold text-card" onClick={() => apply(advanceProgram(game, program.id))}>
            {step.label}{cost ? ` · ${euro(cost)}` : ""}
          </button>
        </div>
      ) : null}
      {program.waiting && program.stage === "dossier" ? (
        <div className="mt-3 grid gap-2">
          {gate ? <p className="text-sm text-amber">{gate}</p> : <p className="text-sm text-mist">Un regolatorio in stanza e il dossier a livello 2 accorciano l'attesa. Costo {euro(cost)}.</p>}
          {AUTHORITIES.map((authority) => (
            <button key={authority.id} type="button" className="min-h-14 rounded-xl bg-card px-3 text-left" onClick={() => apply(advanceProgram(game, program.id, authority.id))}>
              <span className="block text-sm font-medium">{authority.name} · {authority.weeks} sett.</span>
              <span className="block text-xs text-mist">{authority.blurb}</span>
              {authority.id === "fda" && !hasGear(game, "serial") ? <span className="block text-xs text-amber">Prima la serializzazione.</span> : null}
            </button>
          ))}
        </div>
      ) : null}
      {canPush ? (
        <button type="button" className="mt-3 min-h-11 w-full rounded-full bg-card text-sm" onClick={() => apply(pushScience(game, program.id))}>Spingi con 4 scienza</button>
      ) : null}
      {program.patented && !["failed", "launched", "licensed", "approved"].includes(program.stage) ? (
        <button type="button" className="mt-2 min-h-11 w-full rounded-full bg-paper text-sm" onClick={() => apply(licenseOut(game, program.id))}>Cedi · {euro(licenseValue(program))}</button>
      ) : null}
    </article>
  );
}

function TechTree({ game, apply }: { game: Game; apply: (g: Game | string) => void }) {
  const eras = ["early", "mid", "late", "oltre"] as const;
  return (
    <div className="mx-auto grid max-w-lg gap-4">
      <h2 className="font-display text-3xl">Tecniche</h2>
      <p className="text-sm text-mist">Scienza {Math.floor(game.science)}. Gli scienziati la producono anche in panchina.</p>
      {eras.map((era) => (
        <section key={era} className="grid gap-2">
          <h3 className="font-display text-2xl">{ERA_LABEL[era]}</h3>
          {TECH.filter((tech) => tech.era === era).map((tech) => {
            const owned = hasTech(game, tech.id as TechId);
            return (
              <article key={tech.id} className="rounded-xl border border-line bg-card p-3">
                <p className="font-medium">{tech.name}</p>
                <p className="text-sm text-mist">{tech.blurb}</p>
                <p className="mt-1 text-sm">{owned ? "In casa" : `${euro(tech.cash)} · scienza ${tech.sci}`}{tech.need.length ? ` · prima ${tech.need.map((id) => TECH.find((t) => t.id === id)?.name).join(", ")}` : ""}</p>
                {owned ? null : (
                  <button type="button" className="mt-2 min-h-11 w-full rounded-full bg-teal text-card" onClick={() => apply(buyTech(game, tech.id))}>Sblocca</button>
                )}
              </article>
            );
          })}
        </section>
      ))}
    </div>
  );
}

function Team({ game, apply }: { game: Game; apply: (g: Game | string) => void }) {
  return (
    <div className="mx-auto grid max-w-lg gap-4">
      <h2 className="font-display text-3xl">Persone</h2>
      {game.staff.map((person) => {
        const home = game.rooms.find((r) => r.id === person.roomId);
        return (
          <article key={person.id} className="rounded-xl border border-line bg-card px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span>
                <span className="block font-medium">{person.name}</span>
                <span className="text-sm text-mist">{ROLE_LABEL[person.role]} · abilità {person.skill} · {euro(person.salary)}/sett.{home ? ` · ${roomDef(home.type).name}` : " · in panchina"}</span>
              </span>
              <button type="button" className="min-h-11 rounded-full px-3 text-sm text-mist" onClick={() => apply(dismiss(game, person.id))}>Esci</button>
            </div>
            {person.skill < 6 ? (
              <button type="button" className="mt-2 min-h-11 w-full rounded-full bg-paper text-sm" onClick={() => apply(train(game, person.id))}>
                Forma · {euro(18_000 + person.skill * 8_000)}
              </button>
            ) : null}
          </article>
        );
      })}
      <h3 className="font-display text-2xl">Candidati</h3>
      {game.candidates.map((person) => (
        <button key={person.id} type="button" className="min-h-14 rounded-xl border border-line bg-card px-3 text-left" onClick={() => apply(hire(game, person.id))}>
          <span className="block font-medium">Assumi {person.name}</span>
          <span className="text-sm text-mist">{ROLE_LABEL[person.role]} · abilità {person.skill} · {euro(person.salary)}/sett. · ingresso 12 mila €</span>
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
      <p className="text-sm text-mist">Reputazione {Math.round(game.reputation)} · qualità {Math.round(game.quality)} · quota {Math.round(game.playerShare)}% · copertura {Math.round(coverage(game))}</p>
      <p className="text-sm text-mist">Materie {euro(matPrice(game, "api"))} l'API · domanda {Math.round(demandOf(game))}{game.mod ? ` · ${game.mod.label}` : ""}</p>
      <div className="flex h-16 items-end gap-1 rounded-xl bg-card px-3 py-2">
        {game.history.map((value, index) => {
          const height = max === min ? 50 : ((value - min) / (max - min)) * 100;
          return <div key={index} className="flex-1 rounded-sm bg-teal" style={{ height: `${Math.max(8, height)}%` }} />;
        })}
      </div>
      {game.products.map((product) => (
        <article key={product.id} className="rounded-xl border border-line bg-card p-3">
          <p className="font-medium">{product.code} · {product.indication}</p>
          <p className="text-sm text-mist">Prezzo {product.price}{product.patentLeft ? ` · brevetto ${product.patentLeft} sett.` : ""}</p>
          <div className="mt-2 flex gap-2">
            <button type="button" className="min-h-11 flex-1 rounded-full bg-paper" onClick={() => apply(setPrice(game, product.id, product.price - 5))}>Abbassa</button>
            <button type="button" className="min-h-11 flex-1 rounded-full bg-paper" onClick={() => apply(setPrice(game, product.id, product.price + 5))}>Alza</button>
          </div>
        </article>
      ))}
      {game.rivals.map((rival) => (
        <article key={rival.id} className="rounded-xl bg-card px-3 py-2">
          <div className="flex justify-between"><p className="font-medium">{rival.name}</p><p className="font-display">{Math.round(rival.share)}%</p></div>
          <p className="text-sm text-mist">{rival.note}</p>
        </article>
      ))}
      <h3 className="font-display text-2xl">Registro</h3>
      <ul className="grid gap-2">
        {game.log.slice(0, 14).map((item, index) => (
          <li key={index} className="text-sm leading-snug"><span className="text-mist">s{item.week} · </span>{item.text}</li>
        ))}
      </ul>
      <button type="button" className="min-h-11 rounded-full border border-line text-mist" onClick={reset}>
        {armReset ? "Conferma: chiudi l'azienda" : "Nuova azienda"}
      </button>
    </div>
  );
}
