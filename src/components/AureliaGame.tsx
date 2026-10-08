import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, FlaskConical, GitBranch, Globe2, Map as MapIcon, Minus, Pause, Play, Plus, ScrollText, Users, X } from "lucide-react";
import { blip, unlockAudio } from "@/tycoon/audio";
import { drawCampus, fitZoom, pickTile, cameraBounds, type Cam } from "@/tycoon/draw";
import {
  AUTHORITIES,
  CHAPTER_BLURB,
  ERA_LABEL,
  GEAR,
  GOAL_TEXT,
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
  demandOf,
  dismiss,
  euro,
  expandRoom,
  gearDef,
  gearOn,
  hasGear,
  hasTech,
  hire,
  installGear,
  launchProduct,
  licenseOut,
  matPrice,
  newGame,
  orderMat,
  parcelAt,
  placeCorridor,
  placeRoom,
  powerReport,
  removeCorridor,
  removeGear,
  removeRoom,
  roomDef,
  roomOnline,
  setAutoBuy,
  setPrice,
  slotsFor,
  staffIn,
  startProgram,
  techDef,
  tick,
  train,
  upgradeGear,
  upgradeRoom,
  upgradeRoomCost,
  waitingProgram,
  yearOf,
  type Focus,
  type Game,
  type MatKey,
  type ParcelId,
  type RoomType,
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
    const hit = pickTile(e.clientX - rect.left, e.clientY - rect.top, rect.width, rect.height, cam.current, game);
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
          <div className="pointer-events-none absolute left-3 right-16 top-3 rounded-xl bg-card/95 px-3 py-2 shadow-sm">
            <p className="text-sm text-mist">Prossimo passo · {game.chapter}</p>
            <p className="font-medium">{goal.label}</p>
            <p className="text-sm text-mist">{CHAPTER_BLURB[game.chapter]}</p>
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
        <Nav icon={<ScrollText />} label="Contratti" on={tab === "deals"} click={() => setTab("deals")} />
        <Nav icon={<FlaskConical />} label="Ricerca" on={tab === "research"} click={() => setTab("research")} />
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
  cam.zoom = Math.max(0.36, Math.min(1.8, base * factor));
}

function Nav({ icon, label, on, click }: { icon: ReactNode; label: string; on: boolean; click: () => void }) {
  return (
    <button type="button" onClick={click} className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[10px] leading-none ${on ? "text-teal" : "text-mist"}`}>
      <span className="[&_svg]:h-5 [&_svg]:w-5">{icon}</span>
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

function Deals({ game, apply }: { game: Game; apply: (g: Game | string) => void }) {
  const active = game.jobs;
  return (
    <div className="mx-auto grid max-w-lg gap-4">
      <h2 className="font-display text-3xl">Contratti</h2>
      <p className="text-sm text-mist">
        API {game.api}/{capOf(game, "api")} · solvente {game.solvent}/{capOf(game, "solvent")} · eccipiente {game.eccipient}/{capOf(game, "eccipient")} · flaconi {game.vials}/{capOf(game, "vials")}
      </p>
      <button type="button" className="min-h-11 rounded-full bg-paper" onClick={() => apply(setAutoBuy(game, !game.autoBuy))}>
        {game.autoBuy ? "Riordino automatico acceso" : "Riordino spento"}
      </button>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="min-h-11 rounded-full bg-teal text-card" onClick={() => apply(orderMat(game, "api", 8))}>API +8</button>
        <button type="button" className="min-h-11 rounded-full bg-teal text-card" onClick={() => apply(orderMat(game, "solvent", 8))}>Solvente +8</button>
        <button type="button" className="min-h-11 rounded-full bg-paper" onClick={() => apply(orderMat(game, "eccipient", 8))}>Eccipiente +8</button>
        <button type="button" className="min-h-11 rounded-full bg-paper" onClick={() => apply(orderMat(game, "vials", 6))}>Flaconi +6</button>
      </div>
      {game.offers.map((offer) => (
        <article key={offer.id} className="rounded-xl border border-line bg-card p-3">
          <p className="font-medium">{offer.title}</p>
          <p className="text-sm text-mist">
            {offer.tier} · {offer.batches} lotti · qualità chiesta {offer.quality} · API {offer.api} solvente {offer.solvent} flaconi {offer.vials}
          </p>
          <p className="mt-1 font-display text-xl text-teal">{euro(offer.pay)}</p>
          <button type="button" className="mt-2 min-h-11 w-full rounded-full bg-teal text-card" onClick={() => apply(acceptOffer(game, offer.id))}>
            Firma
          </button>
        </article>
      ))}
      <h3 className="font-display text-2xl">In corso</h3>
      {active.length ? active.map((job) => (
        <p key={job.id} className="rounded-xl bg-card px-3 py-2 text-sm">
          {job.client} · {job.status === "queued" ? "in cerca di una linea collegata, accesa e con operatore" : `lotto ${job.done}/${job.batches}`}
        </p>
      )) : <p className="text-sm text-mist">Nessun contratto aperto.</p>}
    </div>
  );
}

function Research({ game, apply, indication, setIndication }: { game: Game; apply: (g: Game | string) => void; indication: string; setIndication: (v: string) => void }) {
  return (
    <div className="mx-auto grid max-w-lg gap-4">
      <h2 className="font-display text-3xl">Ricerca</h2>
      <div className="rounded-xl border border-line bg-card p-3">
        <label className="text-sm text-mist">
          Indicazione
          <select value={indication} onChange={(e) => setIndication(e.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-line bg-paper px-2">
            {INDICATIONS.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <button type="button" className="mt-3 min-h-11 w-full rounded-full bg-teal text-card" onClick={() => apply(startProgram(game, indication))}>
          Nuova molecola · 70 mila €
        </button>
      </div>
      {game.pipeline.map((program) => {
        const step = NEXT_STAGE[program.stage];
        return (
          <article key={program.id} className="rounded-xl border border-line bg-card p-3">
            <p className="font-display text-xl">{program.code}</p>
            <p className="text-sm text-mist">{program.indication} · {STAGE_LABEL[program.stage]}{program.patented ? " · brevettata" : ""}</p>
            {program.waiting && step && program.stage !== "dossier" ? (
              <button type="button" className="mt-3 min-h-11 w-full rounded-full bg-ink text-card" onClick={() => apply(advanceProgram(game, program.id))}>
                {step.label}{step.cost ? ` · ${euro(step.cost)}` : ""}
              </button>
            ) : null}
            {program.waiting && program.stage === "dossier" ? (
              <div className="mt-3 grid gap-2">
                {AUTHORITIES.map((authority) => (
                  <button key={authority.id} type="button" className="min-h-11 rounded-full bg-ink text-card" onClick={() => apply(advanceProgram(game, program.id, authority.id))}>
                    Invia a {authority.name}
                  </button>
                ))}
              </div>
            ) : null}
            {program.stage === "review" ? <p className="mt-2 text-sm">{program.authority}: {program.reviewLeft} sett.</p> : null}
            {program.stage === "approved" ? (
              <button type="button" className="mt-3 min-h-11 w-full rounded-full bg-teal text-card" onClick={() => apply(launchProduct(game, program.id))}>Lancia</button>
            ) : null}
            {program.patented && !["failed", "launched", "licensed", "approved"].includes(program.stage) ? (
              <button type="button" className="mt-2 min-h-11 w-full rounded-full bg-paper" onClick={() => apply(licenseOut(game, program.id))}>Cedi in licenza</button>
            ) : null}
          </article>
        );
      })}
    </div>
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
