import { COLS, ROWS, PARCELS, anchorTiles, ownedBounds, parcelAt, powerReport, roomOnline, roomTiles, type Game, type Room, type RoomType } from "@/tycoon/model";

export const PAL = {
  ink: "#12262c",
  paper: "#eef3f0",
  teal: "#1b7a64",
  tealDeep: "#0f3d36",
  amber: "#c88812",
  mist: "#5d726c",
  line: "#b7c9c2",
};

export type Cam = { panX: number; panY: number; zoom: number; user: boolean };
type Bounds = { c0: number; r0: number; c1: number; r1: number };
type Metrics = { TW: number; TH: number; ox: number; oy: number; zoom: number };

const FLOOR: Record<RoomType, string> = {
  hq: "#d7ebe4",
  gown: "#e7eef0",
  warehouse: "#efe6d4",
  quarantine: "#f3e7d8",
  cold: "#e4f1f6",
  shipping: "#efe6d4",
  pilot: "#f3e2c2",
  plant: "#d5ddd8",
  pack: "#f6efe4",
  sterile: "#d5ebe4",
  qc: "#e7f0d8",
  stability: "#e7f0d8",
  discovery: "#d7ebe4",
  preclinical: "#d7ebe4",
  phase1: "#f4f7f6",
  phase23: "#f4f7f6",
  regulatory: "#f8efd8",
  power: "#d5ddd8",
  water: "#d5e6ea",
};

export function cameraBounds(game: Game): Bounds {
  const raw = ownedBounds(game);
  return {
    c0: raw.c0,
    r0: raw.r0,
    c1: Math.min(COLS, raw.c1 + 3),
    r1: Math.min(ROWS, raw.r1 + 3),
  };
}

export function fitZoom(viewW: number, viewH: number, bounds: Bounds) {
  const cw = Math.max(1, bounds.c1 - bounds.c0);
  const rh = Math.max(1, bounds.r1 - bounds.r0);
  const gridW = (cw + rh) * 34;
  const gridH = (cw + rh) * 18 + 36;
  return Math.max(0.42, Math.min(1.35, Math.min((viewW - 8) / gridW, (viewH - 12) / gridH)));
}

function metrics(viewW: number, viewH: number, cam: Cam, bounds: Bounds): Metrics {
  const zoom = cam.user ? cam.zoom : fitZoom(viewW, viewH, bounds);
  const TW = 72 * zoom;
  const TH = 36 * zoom;
  const midC = (bounds.c0 + bounds.c1 - 1) / 2;
  const midR = (bounds.r0 + bounds.r1 - 1) / 2;
  return {
    TW,
    TH,
    zoom,
    ox: viewW / 2 - (midC - midR) * (TW / 2) + cam.panX,
    oy: viewH / 2 - (midC + midR) * (TH / 2) + cam.panY,
  };
}

function tilePos(c: number, r: number, m: Metrics) {
  return { x: (c - r) * (m.TW / 2) + m.ox, y: (c + r) * (m.TH / 2) + m.oy };
}

export function pickTile(px: number, py: number, viewW: number, viewH: number, cam: Cam, game: Game) {
  const m = metrics(viewW, viewH, cam, cameraBounds(game));
  const x = px - m.ox;
  const y = py - m.oy;
  const c = (x / (m.TW / 2) + y / (m.TH / 2)) / 2;
  const r = (y / (m.TH / 2) - x / (m.TW / 2)) / 2;
  const cc = Math.round(c);
  const rr = Math.round(r);
  if (cc < 0 || rr < 0 || cc >= COLS || rr >= ROWS) return null;
  if (Math.abs(c - cc) + Math.abs(r - rr) > 0.82) return null;
  return { c: cc, r: rr };
}

function diamond(ctx: CanvasRenderingContext2D, x: number, y: number, m: Metrics) {
  ctx.beginPath();
  ctx.moveTo(x, y - m.TH / 2);
  ctx.lineTo(x + m.TW / 2, y);
  ctx.lineTo(x, y + m.TH / 2);
  ctx.lineTo(x - m.TW / 2, y);
  ctx.closePath();
}

function gearDot(ctx: CanvasRenderingContext2D, x: number, y: number, m: Metrics, on: boolean) {
  ctx.fillStyle = on ? PAL.tealDeep : "#c88812";
  ctx.fillRect(x - 5 * m.zoom, y - 10 * m.zoom, 10 * m.zoom, 7 * m.zoom);
}

export function drawCampus(
  ctx: CanvasRenderingContext2D,
  game: Game,
  viewW: number,
  viewH: number,
  cam: Cam,
  t: number,
  selected: { c: number; r: number } | null,
) {
  ctx.clearRect(0, 0, viewW, viewH);
  const sky = ctx.createLinearGradient(0, 0, 0, viewH);
  sky.addColorStop(0, "#e7f0ec");
  sky.addColorStop(1, "#d5e3dc");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, viewW, viewH);
  const bounds = cameraBounds(game);
  const m = metrics(viewW, viewH, cam, bounds);
  const power = powerReport(game);
  const order: { c: number; r: number }[] = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) order.push({ c, r });
  order.sort((a, b) => a.c + a.r - (b.c + b.r));
  const roomById = new Map(game.rooms.map((room) => [room.id, room]));
  for (const { c, r } of order) {
    const tile = game.tiles[r]![c]!;
    const parcel = parcelAt(c, r);
    const owned = !!parcel && game.owned.includes(parcel.id);
    const { x, y } = tilePos(c, r, m);
    diamond(ctx, x, y, m);
    const room = tile.roomId ? roomById.get(tile.roomId) : undefined;
    ctx.fillStyle = !owned ? "#c5d5ce" : tile.ground === "garden" ? "#b7d3c6" : tile.corridor ? "#d5ddd8" : room ? FLOOR[room.type] : "#e7efe8";
    ctx.fill();
    ctx.strokeStyle = tile.corridor ? "#9aada6" : PAL.line;
    ctx.lineWidth = 1;
    ctx.stroke();
    if (tile.ground === "garden" && owned) {
      ctx.fillStyle = PAL.teal;
      ctx.beginPath();
      ctx.arc(x, y - 6 * m.zoom, 7 * m.zoom, 0, Math.PI * 2);
      ctx.fill();
    }
    if (selected && selected.c === c && selected.r === r) {
      ctx.strokeStyle = PAL.amber;
      ctx.lineWidth = 2.5;
      diamond(ctx, x, y, m);
      ctx.stroke();
    }
  }
  for (const room of game.rooms) {
    const tiles = anchorTiles(room);
    room.slots.forEach((slot, index) => {
      if (!slot.item) return;
      const at = tiles[index];
      if (!at) return;
      const { x, y } = tilePos(at.c, at.r, m);
      const bob = Math.sin(t * 2 + index) * 0.4;
      const powered = room.halt === 0 && roomOnline(game, room) && !power.off.some((hit) => hit.roomId === room.id && hit.index === index);
      gearDot(ctx, x, y + bob, m, powered);
    });
    const center = roomTiles(room)[Math.floor(roomTiles(room).length / 2)]!;
    const pos = tilePos(center.c, center.r, m);
    ctx.fillStyle = PAL.ink;
    ctx.font = `600 ${Math.max(9, 11 * m.zoom)}px Outfit, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(room.type === "hq" ? game.name : label(room), pos.x, pos.y - 16 * m.zoom);
  }
  ctx.fillStyle = PAL.mist;
  ctx.font = `600 ${Math.max(10, 12 * m.zoom)}px Fraunces, serif`;
  ctx.textAlign = "center";
  for (const spec of PARCELS) {
    if (spec.id === "fondazione" || game.owned.includes(spec.id)) continue;
    const pos = tilePos((spec.c0 + spec.c1 - 1) / 2, (spec.r0 + spec.r1 - 1) / 2, m);
    ctx.fillText(spec.name, pos.x, pos.y);
  }
}

function label(room: Room) {
  const names: Record<RoomType, string> = {
    hq: "Direzione",
    gown: "Spogliatoio",
    warehouse: "Magazzino",
    quarantine: "Quarantena",
    cold: "Frigo",
    shipping: "Spedizioni",
    pilot: "Pilota",
    plant: "Impianto",
    pack: "Pack",
    sterile: "Suite",
    qc: "QC",
    stability: "Stabilità",
    discovery: "Scoperta",
    preclinical: "Preclinica",
    phase1: "Fase I",
    phase23: "Fase II/III",
    regulatory: "Regolatorio",
    power: "Centralina",
    water: "Acque",
  };
  return names[room.type];
}
