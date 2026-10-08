import { COLS, ROWS, type Building, type Game, type Kind } from "@/tycoon/model";

export const PAL = {
  ink: "#12262c",
  paper: "#eef3f0",
  teal: "#1b7a64",
  tealDeep: "#0f3d36",
  amber: "#c88812",
  card: "#f7fbf9",
  mist: "#5d726c",
  grass: "#d5e6de",
  pad: "#e4ece8",
  line: "#b7c9c2",
};

export type Cam = { panX: number; panY: number; zoom: number; user: boolean };

export function fitZoom(viewW: number, viewH: number) {
  const gridW = (COLS + ROWS) * 34;
  const gridH = (COLS + ROWS) * 20 + 70;
  return Math.max(0.38, Math.min(1.15, Math.min((viewW - 12) / gridW, (viewH - 20) / gridH)));
}

type Metrics = { TW: number; TH: number; ox: number; oy: number; zoom: number };

function metrics(viewW: number, viewH: number, cam: Cam): Metrics {
  const zoom = cam.user ? cam.zoom : fitZoom(viewW, viewH);
  const TW = 86 * zoom;
  const TH = 43 * zoom;
  const midC = (COLS - 1) / 2;
  const midR = (ROWS - 1) / 2;
  return {
    TW,
    TH,
    zoom,
    ox: viewW / 2 - (midC - midR) * (TW / 2) + cam.panX,
    oy: viewH / 2 - (midC + midR) * (TH / 2) + 10 + cam.panY,
  };
}

function tilePos(c: number, r: number, m: Metrics) {
  return { x: (c - r) * (m.TW / 2) + m.ox, y: (c + r) * (m.TH / 2) + m.oy };
}

export function pickTile(px: number, py: number, viewW: number, viewH: number, cam: Cam) {
  const m = metrics(viewW, viewH, cam);
  const x = px - m.ox;
  const y = py - m.oy;
  const c = (x / (m.TW / 2) + y / (m.TH / 2)) / 2;
  const r = (y / (m.TH / 2) - x / (m.TW / 2)) / 2;
  const cc = Math.round(c);
  const rr = Math.round(r);
  if (cc < 0 || rr < 0 || cc >= COLS || rr >= ROWS) return null;
  if (Math.abs(c - cc) + Math.abs(r - rr) > 0.78) return null;
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

function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, d: number, h: number, top: string, left: string, right: string) {
  ctx.fillStyle = left;
  ctx.beginPath();
  ctx.moveTo(x - w, y);
  ctx.lineTo(x, y + d);
  ctx.lineTo(x, y + d - h);
  ctx.lineTo(x - w, y - h);
  ctx.fill();
  ctx.fillStyle = right;
  ctx.beginPath();
  ctx.moveTo(x + w, y);
  ctx.lineTo(x, y + d);
  ctx.lineTo(x, y + d - h);
  ctx.lineTo(x + w, y - h);
  ctx.fill();
  ctx.fillStyle = top;
  ctx.beginPath();
  ctx.moveTo(x, y - h - d);
  ctx.lineTo(x + w, y - h);
  ctx.lineTo(x, y - h + d);
  ctx.lineTo(x - w, y - h);
  ctx.fill();
}

const ROOF: Record<Kind, [string, string, string]> = {
  hq: ["#d7ebe4", "#1b7a64", "#146454"],
  warehouse: ["#efe6d4", "#8a7358", "#6e5b44"],
  pilot: ["#f3e2c2", "#c88812", "#8d6414"],
  plant: ["#d5ddd8", "#1a3e44", "#102a2e"],
  sterile: ["#e9f4f1", "#1b7a64", "#0f3d36"],
  qc: ["#f3f7e8", "#5d726c", "#3e514c"],
  lab: ["#e5f3ee", "#1b7a64", "#146454"],
  clinical: ["#f7fbf9", "#7f9a93", "#5d726c"],
  regulatory: ["#f8efd8", "#12262c", "#0c1a1e"],
  cold: ["#f4fbff", "#7ea4b8", "#5d8498"],
  pack: ["#f6efe4", "#b08968", "#8a6a4e"],
  utility: ["#e7eef0", "#3d5c66", "#24383e"],
};

function drawBuilding(ctx: CanvasRenderingContext2D, b: Building, x: number, y: number, m: Metrics, t: number, selected: boolean) {
  const tall = b.kind === "pilot" ? 32 : b.kind === "warehouse" ? 36 : b.kind === "utility" ? 28 : 46;
  const h = (tall + b.level * 9) * m.zoom;
  const w = m.TW * (b.kind === "warehouse" || b.kind === "plant" ? 0.4 : 0.32);
  const d = m.TH * 0.34;
  const [top, right, left] = ROOF[b.kind];
  ctx.fillStyle = "rgba(18,38,44,0.12)";
  ctx.beginPath();
  ctx.ellipse(x, y + 6 * m.zoom, w * 1.05, d * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
  if (b.kind === "utility") {
    ctx.fillStyle = left;
    ctx.beginPath();
    ctx.ellipse(x, y - h * 0.45, w * 0.55, d * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = right;
    ctx.fillRect(x - w * 0.55, y - h * 0.45, w * 1.1, h * 0.45);
    ctx.fillStyle = top;
    ctx.beginPath();
    ctx.ellipse(x, y - h * 0.45, w * 0.55, d * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    box(ctx, x, y, w, d, h, top, left, right);
  }
  ctx.fillStyle = "rgba(247,251,249,0.85)";
  const windows = b.kind === "utility" ? 0 : 2 + Math.min(3, b.level);
  for (let i = 0; i < windows; i++) {
    const wy = y + d * 0.35 - h * (0.28 + i * 0.16);
    ctx.fillRect(x - w * 0.62, wy, w * 0.22, h * 0.08);
    ctx.fillRect(x + w * 0.28, wy, w * 0.22, h * 0.08);
  }
  if (b.kind === "plant" || b.kind === "sterile" || b.kind === "pilot") {
    ctx.strokeStyle = PAL.amber;
    ctx.lineWidth = 2 * m.zoom;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.2, y - h);
    ctx.lineTo(x + w * 0.2, y - h - 14 * m.zoom);
    ctx.stroke();
    const puff = ((t * 18 + b.c * 8) % 16) * m.zoom;
    ctx.fillStyle = "rgba(247,251,249,0.75)";
    ctx.beginPath();
    ctx.arc(x + w * 0.2, y - h - 16 * m.zoom - puff * 0.4, 3.5 * m.zoom, 0, Math.PI * 2);
    ctx.fill();
  }
  if (b.kind === "cold") {
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.beginPath();
    ctx.ellipse(x, y - h - d * 0.2, w * 0.7, d * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (b.kind === "pack") {
    ctx.fillStyle = "#c88812";
    ctx.fillRect(x + w * 0.15, y - 8 * m.zoom, 8 * m.zoom, 7 * m.zoom);
    ctx.fillStyle = "#8a6a4e";
    ctx.fillRect(x + w * 0.45, y - 4 * m.zoom, 7 * m.zoom, 6 * m.zoom);
  }
  if (b.kind === "lab" || b.kind === "clinical") {
    ctx.fillStyle = PAL.teal;
    ctx.fillRect(x - 2 * m.zoom, y - h - 8 * m.zoom, 4 * m.zoom, 8 * m.zoom);
  }
  if (selected) {
    ctx.strokeStyle = PAL.amber;
    ctx.lineWidth = 2.5 * m.zoom;
    diamond(ctx, x, y, m);
    ctx.stroke();
  }
  if (b.halt > 0) {
    ctx.fillStyle = PAL.amber;
    ctx.font = `${Math.max(10, 11 * m.zoom)}px Outfit, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("fermo", x, y - h - 8);
  }
}

function drawTree(ctx: CanvasRenderingContext2D, x: number, y: number, m: Metrics) {
  ctx.fillStyle = "#9bb7aa";
  ctx.beginPath();
  ctx.ellipse(x, y + 2, 10 * m.zoom, 5 * m.zoom, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PAL.teal;
  ctx.beginPath();
  ctx.arc(x, y - 10 * m.zoom, 12 * m.zoom, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PAL.tealDeep;
  ctx.beginPath();
  ctx.arc(x - 6 * m.zoom, y - 8 * m.zoom, 7 * m.zoom, 0, Math.PI * 2);
  ctx.fill();
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
  const m = metrics(viewW, viewH, cam);
  const order: { c: number; r: number }[] = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) order.push({ c, r });
  order.sort((a, b) => a.c + a.r - (b.c + b.r));
  for (const { c, r } of order) {
    const cell = game.cells[r]![c]!;
    const { x, y } = tilePos(c, r, m);
    diamond(ctx, x, y, m);
    const south = r >= 4;
    ctx.fillStyle =
      cell.ground === "water"
        ? "#b7d4ce"
        : cell.ground === "road"
          ? "#c5d2cc"
          : cell.ground === "garden"
            ? PAL.grass
            : cell.building
              ? south
                ? "#e3ddd4"
                : "#dfeae4"
              : south
                ? "#e7efe8"
                : PAL.pad;
    ctx.fill();
    ctx.strokeStyle = cell.ground === "road" ? "#aebdb6" : PAL.line;
    ctx.lineWidth = 1;
    ctx.stroke();
    if (cell.ground === "road") {
      ctx.strokeStyle = "rgba(247,251,249,0.7)";
      ctx.beginPath();
      ctx.moveTo(x, y - m.TH * 0.18);
      ctx.lineTo(x, y + m.TH * 0.18);
      ctx.stroke();
    }
    if (cell.ground === "water") {
      ctx.fillStyle = "rgba(247,251,249,0.35)";
      ctx.beginPath();
      ctx.ellipse(x, y, m.TW * 0.18, m.TH * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (cell.ground === "garden") drawTree(ctx, x, y - 4, m);
    if (selected && selected.c === c && selected.r === r && !cell.building) {
      ctx.strokeStyle = PAL.amber;
      ctx.lineWidth = 2.5;
      diamond(ctx, x, y, m);
      ctx.stroke();
    }
  }
  for (const { c, r } of order) {
    const b = game.cells[r]![c]!.building;
    if (!b) continue;
    const { x, y } = tilePos(c, r, m);
    drawBuilding(ctx, b, x, y, m, t, !!selected && selected.c === c && selected.r === r);
  }
  for (const member of game.staff) {
    const home = game.cells.flat().find((cell) => cell.building?.id === member.buildingId)?.building;
    if (!home) continue;
    const { x, y } = tilePos(home.c, home.r, m);
    const bob = Math.sin(t * 3 + home.c) * 2;
    ctx.fillStyle = PAL.ink;
    ctx.beginPath();
    ctx.arc(x + m.TW * 0.22, y + 4 + bob, 3.2 * m.zoom, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = PAL.ink;
  ctx.font = `600 ${Math.max(11, 12 * m.zoom)}px Fraunces, serif`;
  ctx.textAlign = "center";
  const hq = tilePos(1, 1, m);
  ctx.fillText(game.name, hq.x, hq.y - 96 * m.zoom);
}

const ROOM_STATIONS: Record<Kind, string[]> = {
  hq: ["Contratti", "Direzione", "Finanza"],
  warehouse: ["Scaffale", "Quarantena", "Solventi"],
  pilot: ["Reattore", "Campioni"],
  plant: ["Reattore", "Linea B", "Linea C"],
  sterile: ["Isolatore", "Riempimento"],
  qc: ["Cromatografia", "Microbiologia"],
  lab: ["Banco", "Strumenti", "Scale-up"],
  clinical: ["Protocollo", "Monitoraggio"],
  regulatory: ["Dossier", "Brevetti"],
  cold: ["Freezer", "Spedizioni"],
  pack: ["Blister", "Astucci"],
  utility: ["Caldaia", "Quadri"],
};

export function roomStations(kind: Kind, level: number) {
  const names = ROOM_STATIONS[kind];
  const open = kind === "hq" ? Math.min(names.length, level + 1) : Math.min(names.length, level);
  return names.map((name, i) => ({
    id: `${kind}-${i}`,
    name,
    rx: i % 2,
    ry: Math.floor(i / 2),
    open: i < open,
  }));
}

function roomMetrics(viewW: number, viewH: number) {
  const zoom = Math.max(0.85, Math.min(1.35, Math.min(viewW / 420, viewH / 320)));
  return { TW: 120 * zoom, TH: 60 * zoom, ox: viewW / 2, oy: viewH * 0.58, zoom };
}

export function drawInterior(
  ctx: CanvasRenderingContext2D,
  game: Game,
  building: Building,
  viewW: number,
  viewH: number,
  t: number,
  selected: string | null,
) {
  ctx.clearRect(0, 0, viewW, viewH);
  ctx.fillStyle = "#e7f0ec";
  ctx.fillRect(0, 0, viewW, viewH);
  const m = roomMetrics(viewW, viewH);
  for (let ry = 0; ry < 2; ry++) {
    for (let rx = 0; rx < 2; rx++) {
      const x = (rx - ry) * (m.TW / 2) + m.ox;
      const y = (rx + ry) * (m.TH / 2) + m.oy;
      ctx.beginPath();
      ctx.moveTo(x, y - m.TH / 2);
      ctx.lineTo(x + m.TW / 2, y);
      ctx.lineTo(x, y + m.TH / 2);
      ctx.lineTo(x - m.TW / 2, y);
      ctx.closePath();
      ctx.fillStyle = "#f7fbf9";
      ctx.fill();
      ctx.strokeStyle = PAL.line;
      ctx.stroke();
    }
  }
  const stations = roomStations(building.kind, building.level);
  for (const station of stations) {
    const x = (station.rx - station.ry) * (m.TW / 2) + m.ox;
    const y = (station.rx + station.ry) * (m.TH / 2) + m.oy - 8;
    const h = 36 * m.zoom;
    box(ctx, x, y, m.TW * 0.22, m.TH * 0.22, h, station.open ? "#d7ebe4" : "#d5ddd8", station.open ? PAL.tealDeep : "#8aa399", station.open ? PAL.teal : "#9aada6");
    const crew = game.staff.filter((s) => s.buildingId === building.id);
    if (station.open && crew.length) {
      const bob = Math.sin(t * 3 + station.rx) * 2;
      ctx.fillStyle = PAL.ink;
      ctx.beginPath();
      ctx.arc(x, y - h - 10 + bob, 6 * m.zoom, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PAL.teal;
      ctx.fillRect(x - 6 * m.zoom, y - h + bob, 12 * m.zoom, 12 * m.zoom);
    }
    ctx.fillStyle = PAL.ink;
    ctx.font = `600 ${Math.max(11, 12 * m.zoom)}px Outfit, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(station.open ? station.name : "Chiuso", x, y + m.TH * 0.55);
    if (selected === station.id) {
      ctx.strokeStyle = PAL.amber;
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 46 * m.zoom, y - h - 28, 92 * m.zoom, h + 70);
    }
  }
}

export function pickStation(px: number, py: number, viewW: number, viewH: number, kind: Kind, level: number) {
  const m = roomMetrics(viewW, viewH);
  let best: { id: string; d: number } | null = null;
  for (const station of roomStations(kind, level)) {
    const x = (station.rx - station.ry) * (m.TW / 2) + m.ox;
    const y = (station.rx + station.ry) * (m.TH / 2) + m.oy - 24;
    const d = Math.hypot(px - x, py - y);
    if (d < 70 * m.zoom && (!best || d < best.d)) best = { id: station.id, d };
  }
  return best?.id ?? null;
}
