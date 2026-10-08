import { COLS, ROWS, PARCELS, anchorTiles, euro, hasTech, powerReport, roomOnline, roomTiles, type Game, type Room, type RoomType } from "@/tycoon/model";

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
type Look = { floor: string; wall: string; wallDark: string; accent: string; motif: "plank" | "grid" | "clean" | "frost" | "hazard" | "none" };
type Pt = { x: number; y: number };
type Sign = { id: string; x: number; y: number; w: number; h: number };
type TagState = "ok" | "off" | "halt" | "empty";
type Tag = { x: number; y: number; w: number; title: string; level: number; s: number; state: TagState; selected: boolean };

const TILE_W = 74;
const TILE_H = 44;

const LOOK: Record<RoomType, Look> = {
  hq: { floor: "#f7fbf8", wall: "#1b7a64", wallDark: "#0c3f36", accent: "#1b7a64", motif: "none" },
  gown: { floor: "#f3f1ee", wall: "#6a736f", wallDark: "#3e4744", accent: "#6a736f", motif: "grid" },
  warehouse: { floor: "#e7c79a", wall: "#7a5230", wallDark: "#4e321c", accent: "#c88812", motif: "plank" },
  quarantine: { floor: "#f3dd9a", wall: "#a06b28", wallDark: "#6d4818", accent: "#c88812", motif: "hazard" },
  cold: { floor: "#d7f0fa", wall: "#3f7594", wallDark: "#24485c", accent: "#3f7594", motif: "frost" },
  shipping: { floor: "#e6d3bc", wall: "#7d6248", wallDark: "#4e3b2a", accent: "#7d6248", motif: "plank" },
  pilot: { floor: "#f6d48a", wall: "#c88812", wallDark: "#8a5c0c", accent: "#c88812", motif: "none" },
  plant: { floor: "#d5e0e4", wall: "#1a3e44", wallDark: "#0e2428", accent: "#1a3e44", motif: "hazard" },
  pack: { floor: "#f0d2ae", wall: "#8a5a34", wallDark: "#5c3a20", accent: "#8a5a34", motif: "plank" },
  sterile: { floor: "#f4fffb", wall: "#0f6e62", wallDark: "#084840", accent: "#1b7a64", motif: "clean" },
  qc: { floor: "#e4f2d4", wall: "#3d6840", wallDark: "#244028", accent: "#3d6840", motif: "grid" },
  stability: { floor: "#e7f3df", wall: "#4e6d48", wallDark: "#2c4228", accent: "#4e6d48", motif: "grid" },
  discovery: { floor: "#d5efe6", wall: "#146454", wallDark: "#0c3d34", accent: "#146454", motif: "clean" },
  preclinical: { floor: "#c9e6da", wall: "#0f5648", wallDark: "#08362e", accent: "#0f5648", motif: "clean" },
  phase1: { floor: "#e8eef6", wall: "#3d5270", wallDark: "#243248", accent: "#3d5270", motif: "grid" },
  phase23: { floor: "#dce6f2", wall: "#2c415c", wallDark: "#182636", accent: "#2c415c", motif: "grid" },
  regulatory: { floor: "#f6edd4", wall: "#12262c", wallDark: "#0c1a1e", accent: "#c88812", motif: "none" },
  power: { floor: "#d5dbdc", wall: "#24383e", wallDark: "#121c20", accent: "#c88812", motif: "hazard" },
  water: { floor: "#c9e8ef", wall: "#1d5968", wallDark: "#103840", accent: "#1d5968", motif: "none" },
};

const NAME: Record<RoomType, string> = {
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
  qc: "Qualità",
  stability: "Stabilità",
  discovery: "Scoperta",
  preclinical: "Preclinica",
  phase1: "Fase I",
  phase23: "Fase II",
  regulatory: "Regolatorio",
  power: "Energia",
  water: "Acque",
};

const signs: Sign[] = [];

export function pickSign(px: number, py: number) {
  const hit = signs.find((s) => px >= s.x && py >= s.y && px <= s.x + s.w && py <= s.y + s.h);
  return hit?.id ?? null;
}

export function cameraBounds(game: Game): Bounds {
  let c0 = COLS;
  let r0 = ROWS;
  let c1 = 0;
  let r1 = 0;
  let any = false;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const tile = game.tiles[r]?.[c];
      if (!tile?.roomId && !tile?.corridor) continue;
      any = true;
      c0 = Math.min(c0, c);
      r0 = Math.min(r0, r);
      c1 = Math.max(c1, c + 1);
      r1 = Math.max(r1, r + 1);
    }
  }
  if (!any) return { c0: 0, r0: 0, c1: 8, r1: 6 };
  return { c0: Math.max(0, c0 - 2), r0: Math.max(0, r0 - 2), c1: Math.min(COLS, c1 + 2), r1: Math.min(ROWS, r1 + 2) };
}

export function fitZoom(viewW: number, viewH: number, bounds: Bounds) {
  const cw = Math.max(1, bounds.c1 - bounds.c0);
  const rh = Math.max(1, bounds.r1 - bounds.r0);
  const gridW = (cw + rh) * (TILE_W / 2);
  const gridH = (cw + rh) * (TILE_H / 2) + TILE_H * 1.8;
  const zoom = Math.min((viewW - 16) / gridW, (viewH - 24) / gridH);
  return Math.max(0.52, Math.min(1.35, zoom));
}

function metrics(viewW: number, viewH: number, cam: Cam, bounds: Bounds): Metrics {
  const zoom = cam.user ? cam.zoom : fitZoom(viewW, viewH, bounds);
  const TW = TILE_W * zoom;
  const TH = TILE_H * zoom;
  const midC = (bounds.c0 + bounds.c1 - 1) / 2;
  const midR = (bounds.r0 + bounds.r1 - 1) / 2;
  return {
    TW,
    TH,
    zoom,
    ox: viewW / 2 - (midC - midR) * (TW / 2) + cam.panX,
    oy: viewH * 0.54 - (midC + midR) * (TH / 2) + cam.panY,
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
  if (Math.abs(c - cc) + Math.abs(r - rr) > 0.86) return null;
  return { c: cc, r: rr };
}

function diamond(ctx: CanvasRenderingContext2D, x: number, y: number, hw: number, hh: number) {
  ctx.beginPath();
  ctx.moveTo(x, y - hh);
  ctx.lineTo(x + hw, y);
  ctx.lineTo(x, y + hh);
  ctx.lineTo(x - hw, y);
  ctx.closePath();
}

function corners(x: number, y: number, m: Metrics) {
  return {
    n: { x, y: y - m.TH / 2 },
    e: { x: x + m.TW / 2, y },
    s: { x, y: y + m.TH / 2 },
    w: { x: x - m.TW / 2, y },
  };
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function hash(c: number, r: number) {
  let n = Math.imul(c + 3, 374761393) + Math.imul(r + 11, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

function shade(hex: string, amt: number) {
  const n = Number.parseInt(hex.slice(1), 16);
  const ch = (shift: number) => Math.max(0, Math.min(255, ((n >> shift) & 255) + amt));
  return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`;
}

function lerpPt(a: Pt, b: Pt, t: number): Pt {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function outward(a: Pt, b: Pt, cx: number, cy: number) {
  const mx = (a.x + b.x) / 2 - cx;
  const my = (a.y + b.y) / 2 - cy;
  const len = Math.hypot(mx, my) || 1;
  return { x: mx / len, y: my / len };
}

function edgeBand(ctx: CanvasRenderingContext2D, a: Pt, b: Pt, ox: number, oy: number, thick: number, fill: string) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.lineTo(b.x + ox * thick, b.y + oy * thick);
  ctx.lineTo(a.x + ox * thick, a.y + oy * thick);
  ctx.closePath();
  ctx.fill();
}

function strokeRim(ctx: CanvasRenderingContext2D, a: Pt, b: Pt, color: string, width: number, lift: number, door: boolean) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const draw = (p: Pt, q: Pt) => {
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - lift);
    ctx.lineTo(q.x, q.y - lift);
    ctx.stroke();
  };
  if (!door) {
    draw(a, b);
    return;
  }
  draw(a, lerpPt(a, b, 0.22));
  draw(lerpPt(a, b, 0.78), b);
}

function isoBox(ctx: CanvasRenderingContext2D, x: number, y: number, hw: number, hd: number, h: number, top: string, left: string, right: string) {
  ctx.fillStyle = right;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + hw, y - hd);
  ctx.lineTo(x + hw, y - hd - h);
  ctx.lineTo(x, y - h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = left;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - hw, y - hd);
  ctx.lineTo(x - hw, y - hd - h);
  ctx.lineTo(x, y - h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = top;
  ctx.beginPath();
  ctx.moveTo(x, y - h);
  ctx.lineTo(x + hw, y - hd - h);
  ctx.lineTo(x, y - hd * 2 - h);
  ctx.lineTo(x - hw, y - hd - h);
  ctx.closePath();
  ctx.fill();
}

function cylinder(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, h: number, top: string, side: string) {
  ctx.fillStyle = side;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI);
  ctx.fill();
  ctx.fillRect(x - rx, y - h, rx * 2, h);
  ctx.fillStyle = shade(side, -18);
  ctx.fillRect(x, y - h, rx, h);
  ctx.fillStyle = top;
  ctx.beginPath();
  ctx.ellipse(x, y - h, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function vessel(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, level: number, on: boolean, t: number, liquid: string) {
  const h = (16 + level * 4) * s;
  const rx = 8 * s;
  isoBox(ctx, x, y + 2 * s, 10 * s, 3 * s, 5 * s, "#d5dee2", "#8ea0a6", "#6e8288");
  cylinder(ctx, x, y - 2 * s, rx, 3.4 * s, h, "#eef6f4", "#b7d4cf");
  ctx.save();
  ctx.beginPath();
  ctx.rect(x - rx, y - 2 * s - h * 0.78, rx * 2, h * 0.7);
  ctx.clip();
  ctx.fillStyle = on ? liquid : "#e7c98a";
  ctx.globalAlpha = 0.9;
  ctx.fillRect(x - rx, y - 2 * s - h * 0.55, rx * 2, h);
  ctx.restore();
  ctx.strokeStyle = "#8aa0a6";
  ctx.lineWidth = Math.max(1.25, 1.6 * s);
  ctx.beginPath();
  ctx.moveTo(x + rx * 0.2, y - h - 2 * s);
  ctx.lineTo(x + rx * 0.2, y - h - 10 * s);
  ctx.stroke();
  if (on) {
    const bob = (Math.sin(t * 3) * 0.5 + 0.5) * h * 0.35;
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.beginPath();
    ctx.arc(x - 2 * s, y - 8 * s - bob, 1.5 * s, 0, Math.PI * 2);
    ctx.fill();
  }
}

function rack(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, mat: string | undefined, level: number) {
  const tone = mat === "solvent" ? "#3d7ea6" : mat === "eccipient" ? "#f7f1e4" : "#c88812";
  isoBox(ctx, x, y + 4 * s, 11 * s, 3.5 * s, 3 * s, "#8d6a45", "#5c4330", "#3e2c1e");
  ctx.fillStyle = "#6b4e34";
  for (let i = 0; i < 3; i++) ctx.fillRect(x - 10 * s, y - (4 + i * 6) * s, 20 * s, 2 * s);
  const n = mat ? Math.min(3, level + 1) : 0;
  for (let i = 0; i < n; i++) isoBox(ctx, x - 3 * s + (i % 2) * 5 * s, y - i * 5.5 * s, 3.4 * s, 1.4 * s, 3.6 * s, shade(tone, 28), tone, shade(tone, -30));
}

function desk(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, screen: string) {
  isoBox(ctx, x, y + 2 * s, 11 * s, 3.6 * s, 5 * s, "#f4efe6", "#c4b49a", "#a89278");
  ctx.fillStyle = "#12262c";
  ctx.fillRect(x - 5 * s, y - 13 * s, 10 * s, 7 * s);
  ctx.fillStyle = screen;
  ctx.fillRect(x - 4 * s, y - 12 * s, 8 * s, 5 * s);
}

function instrument(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, on: boolean, t: number) {
  isoBox(ctx, x, y + 2 * s, 12 * s, 3.6 * s, 6 * s, "#f7fbf9", "#c5d0d4", "#8ea0a6");
  ctx.fillStyle = "#12262c";
  ctx.fillRect(x - 6 * s, y - 15 * s, 12 * s, 8 * s);
  ctx.fillStyle = on ? "#d7efe4" : "#e7c98a";
  ctx.fillRect(x - 5 * s, y - 14 * s, 10 * s, 6 * s);
  ctx.strokeStyle = on ? "#1b7a64" : "#8d6414";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  const phase = on ? Math.sin(t * 2) * 1.4 * s : 0;
  ctx.moveTo(x - 4 * s, y - 10 * s);
  ctx.lineTo(x - 1 * s, y - 10 * s);
  ctx.lineTo(x + phase, y - 14 * s);
  ctx.lineTo(x + 2 * s, y - 10 * s);
  ctx.lineTo(x + 4 * s, y - 10 * s);
  ctx.stroke();
}

function fridge(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  isoBox(ctx, x, y + 2 * s, 8 * s, 3 * s, 16 * s, "#f7fbfe", "#d5e6f0", "#b7cdd8");
  ctx.fillStyle = "#9fd4ea";
  ctx.fillRect(x - 4 * s, y - 12 * s, 6 * s, 7 * s);
  ctx.strokeStyle = "#3f7594";
  ctx.strokeRect(x - 4 * s, y - 12 * s, 6 * s, 7 * s);
}

function powerUnit(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, on: boolean) {
  isoBox(ctx, x, y + 2 * s, 11 * s, 3.5 * s, 11 * s, "#3d4e54", "#243238", "#121c20");
  ctx.fillStyle = "#c88812";
  for (let i = 0; i < 3; i++) ctx.fillRect(x - 7 * s, y - 3 * s - i * 3 * s, 9 * s, 1.2 * s);
  ctx.fillStyle = on ? "#f2c14e" : "#8d6414";
  ctx.beginPath();
  ctx.moveTo(x + 3 * s, y - 14 * s);
  ctx.lineTo(x + 6 * s, y - 9 * s);
  ctx.lineTo(x + 4 * s, y - 9 * s);
  ctx.lineTo(x + 5 * s, y - 4 * s);
  ctx.lineTo(x + 1 * s, y - 10 * s);
  ctx.lineTo(x + 3 * s, y - 10 * s);
  ctx.closePath();
  ctx.fill();
}

function tank(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, deep: boolean) {
  cylinder(ctx, x, y, 8 * s, 3.2 * s, 14 * s, deep ? "#d7f3f6" : "#e7f6f8", deep ? "#3f8fa0" : "#7eb8c4");
}

function lineMachine(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, t: number) {
  isoBox(ctx, x, y + 3 * s, 13 * s, 3.5 * s, 4 * s, "#d9c3a4", "#b08968", "#8a6848");
  const shift = (t * 8) % 5;
  for (let i = 0; i < 3; i++) isoBox(ctx, x - 7 * s + i * 6 * s + shift, y - 1 * s, 2.2 * s, 1 * s, 2.8 * s, "#f7fbf9", "#d5e6e0", "#8fb8ae");
}

function hood(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  isoBox(ctx, x, y + 2 * s, 11 * s, 3.5 * s, 11 * s, "rgba(214,238,232,0.95)", "rgba(160,198,190,0.95)", "rgba(110,150,142,0.95)");
}

function bed(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  isoBox(ctx, x, y + 2 * s, 12 * s, 4.5 * s, 4 * s, "#f7fbf9", "#d5e0ea", "#b7c5d4");
  ctx.fillStyle = "#3d5270";
  ctx.fillRect(x - 8 * s, y - 5 * s, 8 * s, 3 * s);
  ctx.fillStyle = "#f4efe6";
  ctx.fillRect(x + 2 * s, y - 6 * s, 5 * s, 3 * s);
}

function archive(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  isoBox(ctx, x, y + 2 * s, 7 * s, 2.6 * s, 13 * s, "#f6edd4", "#c4b48a", "#8d7a52");
  ctx.fillStyle = "#c88812";
  ctx.fillRect(x - 4 * s, y - 9 * s, 5 * s, 1.2 * s);
  ctx.fillStyle = "#1b7a64";
  ctx.fillRect(x - 4 * s, y - 6 * s, 5 * s, 1.2 * s);
}

function balance(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  isoBox(ctx, x, y + 2 * s, 7 * s, 2.4 * s, 2 * s, "#f7fbf9", "#d5e6e0", "#8fb8ae");
  ctx.strokeStyle = "#12262c";
  ctx.lineWidth = Math.max(1.2, 1.4 * s);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 11 * s);
  ctx.moveTo(x - 7 * s, y - 11 * s);
  ctx.lineTo(x + 7 * s, y - 9 * s);
  ctx.stroke();
  ctx.fillStyle = "#c88812";
  ctx.beginPath();
  ctx.ellipse(x - 7 * s, y - 7 * s, 2.6 * s, 1.2 * s, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 7 * s, y - 5 * s, 2.6 * s, 1.2 * s, 0, 0, Math.PI * 2);
  ctx.fill();
}

function person(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, coat: string, t: number, phase: number) {
  const bob = Math.sin(t * 3 + phase) * 0.7 * s;
  ctx.fillStyle = "rgba(18,38,44,0.16)";
  ctx.beginPath();
  ctx.ellipse(x, y + 2 * s, 5 * s, 2 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#243038";
  ctx.fillRect(x - 2.6 * s, y - 6 * s + bob, 1.8 * s, 6 * s);
  ctx.fillRect(x + 0.8 * s, y - 6 * s + bob, 1.8 * s, 6 * s);
  ctx.fillStyle = coat;
  roundRect(ctx, x - 4 * s, y - 13 * s + bob, 8 * s, 8 * s, 2 * s);
  ctx.fill();
  ctx.fillStyle = "#f0d2b4";
  ctx.beginPath();
  ctx.arc(x, y - 16 * s + bob, 2.8 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2a211c";
  ctx.beginPath();
  ctx.arc(x, y - 17 * s + bob, 2.8 * s, Math.PI, Math.PI * 2);
  ctx.fill();
}

function drawProp(ctx: CanvasRenderingContext2D, id: string, mat: string | undefined, level: number, x: number, y: number, s: number, on: boolean, t: number) {
  const y0 = y + 2 * s;
  if (id === "scaffale" || id === "imp" || id === "armadietti") return rack(ctx, x, y0, s, id === "scaffale" ? mat : "eccipient", level);
  if (id === "reattore" || id === "reattore-gmp" || id === "bioreattore") {
    const liquid = id === "bioreattore" ? "#7dcaa8" : id === "reattore-gmp" ? "#8fd0c4" : "#e0a33a";
    return vessel(ctx, x, y0, s * (id === "bioreattore" ? 1.08 : 1), level, on, t, liquid);
  }
  if (id === "freezer" || id === "freezer-campioni" || id === "climatica") return fridge(ctx, x, y0, s);
  if (id === "trasformatore" || id === "generatore") return powerUnit(ctx, x, y0, s, on);
  if (id === "pw" || id === "wfi") return tank(ctx, x, y0, s, id === "wfi");
  if (id === "hplc" || id === "lcms" || id === "sintetizzatore" || id === "saggi" || id === "monitor-1" || id === "monitor-2") return instrument(ctx, x, y0, s, on, t);
  if (id === "blister" || id === "astuccio" || id === "riempimento" || id === "fill-sterile" || id === "baia") return lineMachine(ctx, x, y0, s, t);
  if (id === "isolatore" || id === "cappa" || id === "hvac" || id === "hvacb") return hood(ctx, x, y0, s);
  if (id === "letti") return bed(ctx, x, y0, s);
  if (id === "dossier" || id === "tmf" || id === "archivio-stab" || id === "registro" || id === "brevetti-desk") return archive(ctx, x, y0, s);
  if (id === "bilancia") return balance(ctx, x, y0, s);
  if (id === "gabbia") {
    isoBox(ctx, x, y0, 10 * s, 3.4 * s, 9 * s, "rgba(200,136,18,0.28)", "rgba(160,100,30,0.4)", "rgba(90,60,20,0.45)");
    return;
  }
  if (id === "filtro" || id === "filtro-pilota" || id === "cip") {
    cylinder(ctx, x, y0 - 3 * s, 10 * s, 3.4 * s, 5 * s, "#f7fbf9", "#8fb8ae");
    return;
  }
  desk(ctx, x, y0, s, on ? "#d7efe4" : "#f3e2b8");
  if (!on) {
    ctx.fillStyle = PAL.amber;
    ctx.beginPath();
    ctx.arc(x + 9 * s, y0 - 14 * s, 2 * s, 0, Math.PI * 2);
    ctx.fill();
  }
}

function emptySlot(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.save();
  ctx.strokeStyle = "rgba(18,38,44,0.38)";
  ctx.setLineDash([3 * s, 3 * s]);
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.ellipse(x, y, 10 * s, 4.5 * s, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x - 3 * s, y);
  ctx.lineTo(x + 3 * s, y);
  ctx.moveTo(x, y - 2 * s);
  ctx.lineTo(x, y + 2 * s);
  ctx.stroke();
  ctx.restore();
}

function motif(ctx: CanvasRenderingContext2D, x: number, y: number, m: Metrics, look: Look, c: number, r: number) {
  ctx.save();
  diamond(ctx, x, y, m.TW / 2 - 1, m.TH / 2 - 1);
  ctx.clip();
  if (look.motif === "plank") {
    ctx.strokeStyle = "rgba(90,52,24,0.18)";
    ctx.lineWidth = 1;
    for (let i = -4; i <= 4; i++) {
      ctx.beginPath();
      ctx.moveTo(x - m.TW / 2, y + i * 5 * m.zoom);
      ctx.lineTo(x + m.TW / 2, y + i * 5 * m.zoom);
      ctx.stroke();
    }
  } else if (look.motif === "grid" || look.motif === "clean") {
    ctx.strokeStyle = look.motif === "clean" ? "rgba(27,122,100,0.22)" : "rgba(18,38,44,0.1)";
    ctx.beginPath();
    ctx.moveTo(x, y - m.TH / 2);
    ctx.lineTo(x, y + m.TH / 2);
    ctx.moveTo(x - m.TW / 2, y);
    ctx.lineTo(x + m.TW / 2, y);
    ctx.stroke();
  } else if (look.motif === "frost") {
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    for (let i = 0; i < 4; i++) {
      const n = hash(c + i * 5, r + 2);
      ctx.fillRect(x - m.TW * 0.28 + n * m.TW * 0.55, y - 3 * m.zoom + i * 3 * m.zoom, 2, 2);
    }
  } else if (look.motif === "hazard") {
    ctx.fillStyle = "rgba(200,136,18,0.95)";
    ctx.beginPath();
    ctx.moveTo(x, y + m.TH / 2 - 8 * m.zoom);
    ctx.lineTo(x + 7 * m.zoom, y + m.TH / 2 - 2 * m.zoom);
    ctx.lineTo(x - 7 * m.zoom, y + m.TH / 2 - 2 * m.zoom);
    ctx.fill();
  }
  ctx.restore();
}

function plaque(ctx: CanvasRenderingContext2D, x: number, y: number, title: string, level: number, s: number, state: TagState, selected: boolean) {
  const font = Math.round(Math.min(15, Math.max(12, 13 * s)));
  ctx.font = `600 ${font}px Outfit, Trebuchet MS, sans-serif`;
  const note = state === "off" ? "staccata" : state === "halt" ? "ferma" : state === "empty" ? "vuota" : "";
  const text = note ? `${title} · ${note}` : title;
  const extra = !note && level > 0 ? 20 : 0;
  const w = Math.max(68, ctx.measureText(text).width + 20 + extra);
  const h = font + 10;
  const left = x - w / 2;
  const top = y - h / 2;
  ctx.save();
  ctx.shadowColor = "rgba(18,38,44,0.2)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = state === "ok" || state === "empty" ? "rgba(247,251,249,0.97)" : "rgba(255,244,220,0.97)";
  roundRect(ctx, left, top, w, h, 8);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = state === "halt" ? "#8d3b2f" : state === "off" ? PAL.amber : PAL.teal;
  ctx.fillRect(left, top, 5, h);
  if (selected) {
    ctx.strokeStyle = PAL.amber;
    ctx.lineWidth = 2;
    roundRect(ctx, left, top, w, h, 8);
    ctx.stroke();
  }
  ctx.fillStyle = PAL.ink;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(text, left + 11, y + 0.5);
  if (!note && level > 0) {
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.fillStyle = i < level ? PAL.ink : "rgba(18,38,44,0.2)";
      ctx.arc(left + w - 18 + i * 5, y, 1.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.beginPath();
  ctx.fillStyle = state === "ok" || state === "empty" ? "rgba(247,251,249,0.97)" : "rgba(255,244,220,0.97)";
  ctx.moveTo(x - 5, top + h - 1);
  ctx.lineTo(x + 5, top + h - 1);
  ctx.lineTo(x, top + h + 6);
  ctx.fill();
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  return { w, h };
}

function coatOf(role: string) {
  if (role === "operator") return "#e7b15a";
  if (role === "scientist") return "#7ec4b0";
  if (role === "qa") return "#b7d49a";
  if (role === "clinical") return "#f7fbf9";
  if (role === "regulatory") return "#d9c48a";
  return "#f4efe6";
}

function drawTree(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, n: number) {
  const k = 0.85 + n * 0.3;
  ctx.fillStyle = "rgba(18,38,44,0.12)";
  ctx.beginPath();
  ctx.ellipse(x, y + 2 * s, 8 * s * k, 3 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#6b4a2c";
  ctx.fillRect(x - 1.3 * s, y - 9 * s * k, 2.6 * s, 11 * s * k);
  ctx.fillStyle = "#1b7a64";
  ctx.beginPath();
  ctx.arc(x, y - 14 * s * k, 8 * s * k, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#146454";
  ctx.beginPath();
  ctx.arc(x - 4 * s, y - 11 * s * k, 5.5 * s * k, 0, Math.PI * 2);
  ctx.fill();
}

function drawGround(ctx: CanvasRenderingContext2D, game: Game, c: number, r: number, m: Metrics, owned: boolean, selected: boolean) {
  const tile = game.tiles[r]![c]!;
  const { x, y } = tilePos(c, r, m);
  const garden = tile.ground === "garden";
  const n = hash(c, r);
  let fill = garden ? (n > 0.5 ? "#8fbfa6" : "#7eb396") : n > 0.5 ? "#c5e0d2" : "#b7d4c4";
  if (!owned) fill = "#d7dfdb";
  diamond(ctx, x, y, m.TW / 2, m.TH / 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = owned ? "rgba(18,38,44,0.07)" : "rgba(18,38,44,0.05)";
  ctx.lineWidth = 1;
  ctx.stroke();
  if (owned && !garden && n > 0.84) {
    ctx.strokeStyle = "rgba(20,90,70,0.22)";
    ctx.beginPath();
    ctx.moveTo(x - 3, y);
    ctx.lineTo(x - 1, y - 4 * m.zoom);
    ctx.stroke();
  }
  if (garden && owned) {
    if ((c + r) % 2 === 0) drawTree(ctx, x, y - 2 * m.zoom, m.zoom, n);
    else {
      ctx.fillStyle = "#c88812";
      ctx.beginPath();
      ctx.arc(x - 4 * m.zoom, y, 2 * m.zoom, 0, Math.PI * 2);
      ctx.arc(x + 3 * m.zoom, y + 2 * m.zoom, 2 * m.zoom, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (selected) {
    ctx.strokeStyle = PAL.amber;
    ctx.lineWidth = 2.5;
    diamond(ctx, x, y, m.TW / 2, m.TH / 2);
    ctx.stroke();
  }
}

function drawCorridor(ctx: CanvasRenderingContext2D, game: Game, c: number, r: number, m: Metrics) {
  const { x, y } = tilePos(c, r, m);
  diamond(ctx, x, y + 2 * m.zoom, m.TW / 2, m.TH / 2);
  ctx.fillStyle = "rgba(18,38,44,0.08)";
  ctx.fill();
  diamond(ctx, x, y, m.TW / 2, m.TH / 2);
  ctx.fillStyle = "#e7dfd0";
  ctx.fill();
  diamond(ctx, x, y, m.TW / 2 - 5 * m.zoom, m.TH / 2 - 3 * m.zoom);
  ctx.fillStyle = "#f7f3ea";
  ctx.fill();
  const k = corners(x, y, m);
  const edges: [Pt, Pt, number, number][] = [
    [k.n, k.w, -1, 0],
    [k.n, k.e, 0, -1],
    [k.e, k.s, 1, 0],
    [k.w, k.s, 0, 1],
  ];
  for (const [a, b, dc, dr] of edges) {
    const other = game.tiles[r + dr]?.[c + dc];
    const open = !!other && ((other.corridor && !other.roomId) || !!other.roomId);
    if (open) continue;
    const o = outward(a, b, x, y);
    edgeBand(ctx, a, b, o.x, o.y, 2.5 * m.zoom, "#d4cbb8");
  }
  ctx.strokeStyle = "#1b7a64";
  ctx.lineWidth = Math.max(2.5, 3 * m.zoom);
  ctx.lineCap = "round";
  ctx.beginPath();
  for (const [dc, dr] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as const) {
    const other = game.tiles[r + dr]?.[c + dc];
    if (!other?.roomId && !(other?.corridor && !other.roomId)) continue;
    const dx = ((dc - dr) * m.TW) / 2;
    const dy = ((dc + dr) * m.TH) / 2;
    ctx.moveTo(x, y);
    ctx.lineTo(x + dx * 0.5, y + dy * 0.5);
  }
  ctx.stroke();
}

function drawRoom(ctx: CanvasRenderingContext2D, game: Game, room: Room, m: Metrics, selected: boolean, t: number, off: { roomId: string; index: number }[]): Tag {
  const look = LOOK[room.type];
  const tiles = roomTiles(room);
  const s = m.zoom;
  const online = roomOnline(game, room);
  const width = Math.max(5, 6.5 * s);

  for (const tile of tiles) {
    const { x, y } = tilePos(tile.c, tile.r, m);
    diamond(ctx, x + 2 * s, y + 4 * s, m.TW / 2, m.TH / 2);
    ctx.fillStyle = "rgba(18,38,44,0.1)";
    ctx.fill();
  }
  for (const tile of tiles) {
    const { x, y } = tilePos(tile.c, tile.r, m);
    const grad = ctx.createLinearGradient(x, y - m.TH / 2, x, y + m.TH / 2);
    grad.addColorStop(0, shade(look.floor, 12));
    grad.addColorStop(1, shade(look.floor, -16));
    diamond(ctx, x, y, m.TW / 2, m.TH / 2);
    ctx.fillStyle = grad;
    ctx.fill();
    motif(ctx, x, y, m, look, tile.c, tile.r);
    if (!online) {
      ctx.save();
      diamond(ctx, x, y, m.TW / 2, m.TH / 2);
      ctx.clip();
      ctx.fillStyle = "rgba(18,38,44,0.1)";
      ctx.fillRect(x - m.TW, y - m.TH, m.TW * 2, m.TH * 2);
      ctx.restore();
    }
  }

  for (const tile of tiles) {
    const { x, y } = tilePos(tile.c, tile.r, m);
    const k = corners(x, y, m);
    const edges = [
      { a: k.n, b: k.w, nc: tile.c - 1, nr: tile.r, far: true },
      { a: k.n, b: k.e, nc: tile.c, nr: tile.r - 1, far: true },
      { a: k.e, b: k.s, nc: tile.c + 1, nr: tile.r, far: false },
      { a: k.w, b: k.s, nc: tile.c, nr: tile.r + 1, far: false },
    ];
    for (const edge of edges) {
      const other = game.tiles[edge.nr]?.[edge.nc];
      if (other?.roomId === room.id) continue;
      if (other?.roomId && edge.nc + edge.nr > tile.c + tile.r) continue;
      const door = !!other?.corridor && !other.roomId;
      const tone = edge.far ? look.wall : look.wallDark;
      if (selected) strokeRim(ctx, edge.a, edge.b, PAL.amber, width + 3, 0, door);
      strokeRim(ctx, edge.a, edge.b, tone, width, 0, door);
      if (door) {
        const mid = lerpPt(edge.a, edge.b, 0.5);
        ctx.fillStyle = look.accent;
        diamond(ctx, mid.x, mid.y, 5 * s, 2.2 * s);
        ctx.fill();
      }
    }
  }

  const anchor = new Set(anchorTiles(room).map((spot) => `${spot.c},${spot.r}`));
  room.slots.forEach((slot, index) => {
    const at = anchorTiles(room)[index];
    if (!at) return;
    const pos = tilePos(at.c, at.r, m);
    if (!slot.item) {
      emptySlot(ctx, pos.x, pos.y + 2 * s, s);
      return;
    }
    const on = online && room.halt === 0 && !off.some((hit) => hit.roomId === room.id && hit.index === index);
    drawProp(ctx, slot.item.defId, slot.item.mat, slot.item.level, pos.x, pos.y - 2 * s, s, on, t + index);
  });

  const free = tiles.filter((spot) => !anchor.has(`${spot.c},${spot.r}`));
  const labelTile = free.length ? free.reduce((a, b) => (a.c + a.r >= b.c + b.r ? a : b)) : tiles[0]!;
  game.staff
    .filter((member) => member.roomId === room.id)
    .forEach((member, index) => {
      const pool = free.filter((spot) => spot.c !== labelTile.c || spot.r !== labelTile.r);
      const spot = pool[index] ?? labelTile;
      const pos = tilePos(spot.c, spot.r, m);
      const ox = spot.c === labelTile.c && spot.r === labelTile.r ? -12 * s : index * 10 * s;
      person(ctx, pos.x + ox, pos.y + 2 * s, s, coatOf(member.role), t, index);
    });

  const at = tilePos(labelTile.c, labelTile.r, m);
  const gearCount = room.slots.filter((slot) => slot.item).length;
  const state: TagState = !online ? "off" : room.halt > 0 ? "halt" : gearCount === 0 ? "empty" : "ok";
  const title = room.type === "hq" ? game.name : NAME[room.type];
  const font = Math.round(Math.min(15, Math.max(12, 13 * s)));
  ctx.font = `600 ${font}px Outfit, Trebuchet MS, sans-serif`;
  const note = state === "off" ? "staccata" : state === "halt" ? "ferma" : state === "empty" ? "vuota" : "";
  const text = note ? `${title} · ${note}` : title;
  const w = Math.max(68, ctx.measureText(text).width + 36);
  return { x: at.x, y: at.y + 2 * s, w, title, level: room.level, s, state, selected };
}

function placeTags(ctx: CanvasRenderingContext2D, tags: Tag[]) {
  const placed: { x: number; y: number; w: number }[] = [];
  const ordered = [...tags].sort((a, b) => a.y - b.y || a.x - b.x);
  for (const tag of ordered) {
    let y = tag.y;
    for (let n = 0; n < 8; n++) {
      const hit = placed.find((prev) => Math.abs(prev.x - tag.x) < (prev.w + tag.w) / 2 + 6 && Math.abs(prev.y - y) < 22);
      if (!hit) break;
      y = hit.y - 24;
    }
    plaque(ctx, tag.x, y, tag.title, tag.level, tag.s, tag.state, tag.selected);
    placed.push({ x: tag.x, y, w: tag.w });
  }
}

function parcelNote(game: Game, id: string) {
  const spec = PARCELS.find((p) => p.id === id)!;
  if (spec.needBatch && game.stats.batches < 1) return "dopo un lotto";
  if (spec.tech && !hasTech(game, spec.tech)) return "serve tecnica";
  return euro(spec.cost);
}

function drawParcelSigns(ctx: CanvasRenderingContext2D, game: Game, m: Metrics, viewW: number, viewH: number) {
  for (const spec of PARCELS) {
    if (game.owned.includes(spec.id)) continue;
    if (!spec.touch.some((id) => game.owned.includes(id))) continue;
    const pos = tilePos((spec.c0 + spec.c1 - 1) / 2, (spec.r0 + spec.r1 - 1) / 2, m);
    const note = parcelNote(game, spec.id);
    ctx.font = "600 13px Outfit, Trebuchet MS, sans-serif";
    const w = Math.max(124, ctx.measureText(`${spec.name}  ${note}`).width + 28);
    const h = 40;
    const onScreen = pos.x > 36 && pos.x < viewW - 36 && pos.y > 36 && pos.y < viewH - 36;
    let x = onScreen ? pos.x - w / 2 : Math.max(8, Math.min(viewW - w - 8, pos.x - w / 2));
    let y = onScreen ? pos.y - h / 2 : Math.max(8, Math.min(viewH - h - 8, pos.y - h / 2));
    if (!onScreen && x > viewW - 78 && y > viewH - 140) x = Math.max(8, viewW - 78 - w);
    if (!onScreen && y > viewH - 72 && x < viewW * 0.72) y = Math.max(8, viewH - 72 - h);
    ctx.save();
    ctx.shadowColor = "rgba(18,38,44,0.16)";
    ctx.shadowBlur = 8;
    ctx.fillStyle = "rgba(247,251,249,0.96)";
    roundRect(ctx, x, y, w, h, 10);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = PAL.amber;
    ctx.fillRect(x, y, 5, h);
    ctx.fillStyle = PAL.ink;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = "600 13px Outfit, Trebuchet MS, sans-serif";
    ctx.fillText(spec.name, x + 12, y + 13);
    ctx.fillStyle = PAL.mist;
    ctx.font = "500 11px Outfit, Trebuchet MS, sans-serif";
    ctx.fillText(note, x + 12, y + 28);
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    if (!onScreen) signs.push({ id: spec.id, x, y, w, h });
  }
}

export function drawCampus(ctx: CanvasRenderingContext2D, game: Game, viewW: number, viewH: number, cam: Cam, t: number, selected: { c: number; r: number } | null) {
  signs.length = 0;
  ctx.clearRect(0, 0, viewW, viewH);
  const sky = ctx.createLinearGradient(0, 0, 0, viewH);
  sky.addColorStop(0, "#d5e4dc");
  sky.addColorStop(1, "#e8f1ec");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, viewW, viewH);

  const bounds = cameraBounds(game);
  const m = metrics(viewW, viewH, cam, bounds);
  const power = powerReport(game);
  const selectedRoom = selected ? (game.tiles[selected.r]?.[selected.c]?.roomId ?? null) : null;
  const order: { c: number; r: number }[] = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) order.push({ c, r });
  order.sort((a, b) => a.c + a.r - (b.c + b.r) || a.c - b.c);

  for (const { c, r } of order) {
    const tile = game.tiles[r]?.[c];
    if (!tile || tile.roomId) continue;
    const pos = tilePos(c, r, m);
    if (pos.x < -m.TW || pos.x > viewW + m.TW || pos.y < -m.TH * 2 || pos.y > viewH + m.TH) continue;
    const parcel = PARCELS.find((p) => c >= p.c0 && c < p.c1 && r >= p.r0 && r < p.r1);
    const owned = !!parcel && game.owned.includes(parcel.id);
    const hot = !!selected && !selectedRoom && selected.c === c && selected.r === r;
    if (tile.corridor) drawCorridor(ctx, game, c, r, m);
    else drawGround(ctx, game, c, r, m, owned, hot);
  }

  const rooms = [...game.rooms].sort((a, b) => a.c + a.r + a.w + a.h - (b.c + b.r + b.w + b.h));
  const tags = rooms.map((room) => drawRoom(ctx, game, room, m, selectedRoom === room.id, t, power.off));
  placeTags(ctx, tags);

  const seen = new Set<string>();
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const parcel = PARCELS.find((p) => c >= p.c0 && c < p.c1 && r >= p.r0 && r < p.r1);
      if (!parcel || game.owned.includes(parcel.id) || seen.has(parcel.id)) continue;
      seen.add(parcel.id);
      const nw = tilePos(parcel.c0, parcel.r0, m);
      const ne = tilePos(parcel.c1 - 1, parcel.r0, m);
      const se = tilePos(parcel.c1 - 1, parcel.r1 - 1, m);
      const sw = tilePos(parcel.c0, parcel.r1 - 1, m);
      ctx.save();
      ctx.strokeStyle = "rgba(18,38,44,0.2)";
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(nw.x, nw.y - m.TH / 2);
      ctx.lineTo(ne.x + m.TW / 2, ne.y);
      ctx.lineTo(se.x, se.y + m.TH / 2);
      ctx.lineTo(sw.x - m.TW / 2, sw.y);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }
  }
  drawParcelSigns(ctx, game, m, viewW, viewH);
}
