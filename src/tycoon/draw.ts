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
type Look = { floor: string; wall: string; wallDark: string; accent: string };

const LOOK: Record<RoomType, Look> = {
  hq: { floor: "#f4fbf8", wall: "#1b7a64", wallDark: "#0f3d36", accent: "#1b7a64" },
  gown: { floor: "#f7fbf9", wall: "#6d827b", wallDark: "#3e514c", accent: "#5d726c" },
  warehouse: { floor: "#f8f1e6", wall: "#8a7358", wallDark: "#5c4a38", accent: "#c88812" },
  quarantine: { floor: "#f8efe6", wall: "#a67c52", wallDark: "#6e5438", accent: "#c88812" },
  cold: { floor: "#f4fbfe", wall: "#6f9aaf", wallDark: "#3e6474", accent: "#3e6474" },
  shipping: { floor: "#f6f0e6", wall: "#8a7358", wallDark: "#5c4a38", accent: "#8a7358" },
  pilot: { floor: "#fbf6ee", wall: "#c88812", wallDark: "#8d6414", accent: "#c88812" },
  plant: { floor: "#e7eef0", wall: "#1a3e44", wallDark: "#0e2428", accent: "#1a3e44" },
  pack: { floor: "#f8f1e6", wall: "#b08968", wallDark: "#7a5c42", accent: "#b08968" },
  sterile: { floor: "#eef8f5", wall: "#1b7a64", wallDark: "#0f3d36", accent: "#1b7a64" },
  qc: { floor: "#f7faf2", wall: "#4f6b4a", wallDark: "#314430", accent: "#4f6b4a" },
  stability: { floor: "#f7faf2", wall: "#4f6b4a", wallDark: "#314430", accent: "#6d8f62" },
  discovery: { floor: "#eef6f3", wall: "#1b7a64", wallDark: "#0f3d36", accent: "#1b7a64" },
  preclinical: { floor: "#e7f3ef", wall: "#146454", wallDark: "#0c332c", accent: "#146454" },
  phase1: { floor: "#f7fbf9", wall: "#7f9a93", wallDark: "#4d6560", accent: "#7f9a93" },
  phase23: { floor: "#f4f8f6", wall: "#5d726c", wallDark: "#3e514c", accent: "#12262c" },
  regulatory: { floor: "#fbf6ea", wall: "#12262c", wallDark: "#0c1a1e", accent: "#c88812" },
  power: { floor: "#eef2f3", wall: "#3d5c66", wallDark: "#24383e", accent: "#c88812" },
  water: { floor: "#e7f3f4", wall: "#3d6d78", wallDark: "#244850", accent: "#3d6d78" },
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

export function cameraBounds(game: Game): Bounds {
  const raw = ownedBounds(game);
  return {
    c0: Math.max(0, raw.c0 - 1),
    r0: Math.max(0, raw.r0 - 1),
    c1: Math.min(COLS, raw.c1 + 1),
    r1: Math.min(ROWS, raw.r1 + 1),
  };
}

export function fitZoom(viewW: number, viewH: number, bounds: Bounds) {
  const cw = Math.max(1, bounds.c1 - bounds.c0);
  const rh = Math.max(1, bounds.r1 - bounds.r0);
  const gridW = (cw + rh) * 30;
  const gridH = (cw + rh) * 16 + 48;
  return Math.max(0.55, Math.min(1.45, Math.min((viewW - 4) / gridW, (viewH - 8) / gridH)));
}

function metrics(viewW: number, viewH: number, cam: Cam, bounds: Bounds): Metrics {
  const zoom = cam.user ? cam.zoom : fitZoom(viewW, viewH, bounds);
  const TW = 78 * zoom;
  const TH = 39 * zoom;
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

function topFace(ctx: CanvasRenderingContext2D, x: number, y: number, m: Metrics, lift: number) {
  ctx.beginPath();
  ctx.moveTo(x, y - m.TH / 2 - lift);
  ctx.lineTo(x + m.TW / 2, y - lift);
  ctx.lineTo(x, y + m.TH / 2 - lift);
  ctx.lineTo(x - m.TW / 2, y - lift);
  ctx.closePath();
}

function drawWall(ctx: CanvasRenderingContext2D, ax: number, ay: number, bx: number, by: number, lift: number, fill: string, door: boolean) {
  const paint = (x0: number, y0: number, x1: number, y1: number) => {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x1, y1 - lift);
    ctx.lineTo(x0, y0 - lift);
    ctx.closePath();
    ctx.fill();
  };
  if (!door) {
    paint(ax, ay, bx, by);
    return;
  }
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2;
  paint(ax, ay, ax + (mx - ax) * 0.55, ay + (my - ay) * 0.55);
  paint(bx - (bx - mx) * 0.55, by - (by - my) * 0.55, bx, by);
  ctx.fillStyle = "#12262c";
  ctx.fillRect(mx - 3, my - lift * 0.15, 6, lift * 0.55);
}

function drawTree(ctx: CanvasRenderingContext2D, x: number, y: number, z: number) {
  ctx.fillStyle = "#8d6414";
  ctx.fillRect(x - 1.5 * z, y - 8 * z, 3 * z, 10 * z);
  ctx.fillStyle = "#1b7a64";
  ctx.beginPath();
  ctx.arc(x, y - 14 * z, 9 * z, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#146454";
  ctx.beginPath();
  ctx.arc(x - 5 * z, y - 12 * z, 6 * z, 0, Math.PI * 2);
  ctx.fill();
}

function cylinder(ctx: CanvasRenderingContext2D, x: number, y: number, z: number, h: number, top: string, side: string) {
  const w = 7 * z;
  ctx.fillStyle = side;
  ctx.beginPath();
  ctx.ellipse(x, y - 2 * z, w, 3.2 * z, 0, 0, Math.PI);
  ctx.fill();
  ctx.fillRect(x - w, y - h, w * 2, h);
  ctx.fillStyle = top;
  ctx.beginPath();
  ctx.ellipse(x, y - h, w, 3.2 * z, 0, 0, Math.PI * 2);
  ctx.fill();
}

function crate(ctx: CanvasRenderingContext2D, x: number, y: number, z: number, fill: string) {
  ctx.fillStyle = fill;
  ctx.fillRect(x - 6 * z, y - 9 * z, 12 * z, 8 * z);
  ctx.strokeStyle = "rgba(18,38,44,0.25)";
  ctx.strokeRect(x - 6 * z, y - 9 * z, 12 * z, 8 * z);
}

function drawGear(ctx: CanvasRenderingContext2D, id: string, x: number, y: number, z: number, on: boolean, accent: string) {
  const y0 = y - 2 * z;
  if (!on) {
    ctx.fillStyle = PAL.amber;
    ctx.fillRect(x - 2 * z, y0 - 16 * z, 4 * z, 4 * z);
  }
  if (id === "scaffale" || id === "imp" || id === "armadietti") {
    crate(ctx, x - 4 * z, y0, z, "#c4a574");
    crate(ctx, x + 5 * z, y0 + 2 * z, z * 0.8, "#a88858");
    return;
  }
  if (id === "reattore" || id === "reattore-gmp" || id === "bioreattore" || id === "freezer" || id === "wfi" || id === "pw") {
    const tall = id === "bioreattore" || id === "reattore-gmp";
    cylinder(ctx, x, y0, z, (tall ? 18 : 12) * z, on ? "#f7fbf9" : "#e7c98a", id === "freezer" ? "#d5e8f0" : accent);
    return;
  }
  if (id === "hplc" || id === "lcms" || id === "monitor-1" || id === "monitor-2" || id === "sintetizzatore") {
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(x - 7 * z, y0 - 8 * z, 14 * z, 8 * z);
    ctx.fillStyle = on ? "#d7ebe4" : "#e7c98a";
    ctx.fillRect(x - 5 * z, y0 - 6 * z, 10 * z, 4 * z);
    return;
  }
  if (id === "trasformatore" || id === "generatore") {
    ctx.fillStyle = "#24383e";
    ctx.fillRect(x - 8 * z, y0 - 10 * z, 16 * z, 10 * z);
    ctx.fillStyle = PAL.amber;
    ctx.fillRect(x - 2 * z, y0 - 16 * z, 4 * z, 6 * z);
    return;
  }
  ctx.fillStyle = on ? accent : "#c88812";
  ctx.fillRect(x - 6 * z, y0 - 7 * z, 12 * z, 6 * z);
}

function drawRoomIcon(ctx: CanvasRenderingContext2D, type: RoomType, x: number, y: number, z: number, look: Look) {
  if (type === "hq") {
    ctx.fillStyle = look.accent;
    ctx.fillRect(x - 1.5 * z, y - 22 * z, 3 * z, 14 * z);
    ctx.beginPath();
    ctx.moveTo(x, y - 28 * z);
    ctx.lineTo(x + 10 * z, y - 24 * z);
    ctx.lineTo(x, y - 20 * z);
    ctx.fill();
    return;
  }
  if (type === "pilot" || type === "plant" || type === "sterile") {
    cylinder(ctx, x, y - 4 * z, z * 0.9, 16 * z, "#f7fbf9", look.wall);
    ctx.strokeStyle = look.accent;
    ctx.lineWidth = 2 * z;
    ctx.beginPath();
    ctx.moveTo(x + 6 * z, y - 20 * z);
    ctx.lineTo(x + 6 * z, y - 30 * z);
    ctx.stroke();
    return;
  }
  if (type === "warehouse" || type === "shipping" || type === "pack") {
    crate(ctx, x, y - 2 * z, z, "#c88812");
    return;
  }
  if (type === "cold") {
    cylinder(ctx, x, y - 2 * z, z, 12 * z, "#ffffff", "#d5e8f0");
    return;
  }
  if (type === "qc" || type === "stability" || type === "discovery" || type === "preclinical") {
    ctx.fillStyle = look.wall;
    ctx.fillRect(x - 8 * z, y - 8 * z, 16 * z, 3 * z);
    ctx.fillRect(x - 1 * z, y - 18 * z, 2 * z, 10 * z);
    ctx.beginPath();
    ctx.arc(x, y - 20 * z, 4 * z, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (type === "power") {
    ctx.fillStyle = look.wallDark;
    ctx.fillRect(x - 7 * z, y - 10 * z, 14 * z, 8 * z);
    ctx.fillStyle = PAL.amber;
    ctx.beginPath();
    ctx.moveTo(x - 2 * z, y - 18 * z);
    ctx.lineTo(x + 3 * z, y - 12 * z);
    ctx.lineTo(x, y - 12 * z);
    ctx.lineTo(x + 2 * z, y - 6 * z);
    ctx.lineTo(x - 3 * z, y - 12 * z);
    ctx.lineTo(x, y - 12 * z);
    ctx.fill();
    return;
  }
  if (type === "water") {
    ctx.fillStyle = "#7eb8c4";
    ctx.beginPath();
    ctx.ellipse(x, y - 6 * z, 10 * z, 5 * z, 0, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.fillStyle = look.accent;
  ctx.beginPath();
  ctx.arc(x, y - 8 * z, 5 * z, 0, Math.PI * 2);
  ctx.fill();
}

function chip(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, z: number) {
  ctx.font = `600 ${Math.max(11, 12 * z)}px Outfit, sans-serif`;
  const w = ctx.measureText(text).width + 12 * Math.max(1, z);
  const h = Math.max(16, 16 * z);
  ctx.fillStyle = "rgba(247,251,249,0.94)";
  roundRect(ctx, x - w / 2, y - h, w, h, 8);
  ctx.fill();
  ctx.fillStyle = PAL.ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y - h / 2);
  ctx.textBaseline = "alphabetic";
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
  sky.addColorStop(0, "#d5e6df");
  sky.addColorStop(0.45, "#e7f0ec");
  sky.addColorStop(1, "#c9ddd4");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, viewW, viewH);

  const bounds = cameraBounds(game);
  const m = metrics(viewW, viewH, cam, bounds);
  const z = m.zoom;
  const liftRoom = 16 * z;
  const liftPath = 5 * z;
  const power = powerReport(game);
  const roomById = new Map(game.rooms.map((room) => [room.id, room]));
  const selectedRoom = selected ? game.tiles[selected.r]?.[selected.c]?.roomId : null;

  const order: { c: number; r: number }[] = [];
  for (let r = bounds.r0; r < bounds.r1; r++) for (let c = bounds.c0; c < bounds.c1; c++) order.push({ c, r });
  order.sort((a, b) => a.c + a.r - (b.c + b.r) || a.c - b.c);

  for (const { c, r } of order) {
    const tile = game.tiles[r]?.[c];
    if (!tile) continue;
    const parcel = parcelAt(c, r);
    const owned = !!parcel && game.owned.includes(parcel.id);
    const { x, y } = tilePos(c, r, m);
    diamond(ctx, x, y + 3 * z, m);
    ctx.fillStyle = "rgba(18,38,44,0.05)";
    ctx.fill();
    diamond(ctx, x, y, m);
    if (!owned) ctx.fillStyle = "#b7c9c0";
    else if (tile.corridor && !tile.roomId) ctx.fillStyle = "#c5cfc9";
    else if (tile.ground === "garden") ctx.fillStyle = "#9ecfb8";
    else ctx.fillStyle = (c + r) % 2 === 0 ? "#d7ebe3" : "#cfe4da";
    ctx.fill();
    if (!owned) {
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = "rgba(18,38,44,0.08)";
      ctx.beginPath();
      ctx.moveTo(x - m.TW / 2, y);
      ctx.lineTo(x + m.TW / 2, y);
      ctx.stroke();
      ctx.restore();
    }
    if (tile.ground === "garden" && owned) drawTree(ctx, x, y, z);
    if (selected && !selectedRoom && selected.c === c && selected.r === r) {
      ctx.strokeStyle = PAL.amber;
      ctx.lineWidth = 2.5;
      diamond(ctx, x, y, m);
      ctx.stroke();
    }
  }

  const paintTile = (c: number, r: number, room: Room | null) => {
    const tile = game.tiles[r]![c]!;
    const { x, y } = tilePos(c, r, m);
    const corridor = tile.corridor && !room;
    const lift = room ? liftRoom : liftPath;
    const look = room ? LOOK[room.type] : null;
    const frontC = game.tiles[r]?.[c + 1];
    const frontR = game.tiles[r + 1]?.[c];
    const same = (other: typeof tile | undefined) => (room ? other?.roomId === room.id : !!other?.corridor);
    const doorC = !!room && !!frontC?.corridor;
    const doorR = !!room && !!frontR?.corridor;
    if (!same(frontR)) drawWall(ctx, x - m.TW / 2, y, x, y + m.TH / 2, lift, look ? look.wallDark : "#aebdb6", doorR);
    if (!same(frontC)) drawWall(ctx, x + m.TW / 2, y, x, y + m.TH / 2, lift, look ? look.wall : "#c5d0cb", doorC);
    topFace(ctx, x, y, m, lift);
    ctx.fillStyle = room ? look!.floor : "#d5ddd8";
    ctx.fill();
    ctx.strokeStyle = room ? "rgba(18,38,44,0.08)" : "rgba(255,255,255,0.55)";
    ctx.lineWidth = 1;
    topFace(ctx, x, y, m, lift);
    ctx.stroke();
    if (corridor) {
      ctx.strokeStyle = "rgba(247,251,249,0.95)";
      ctx.lineWidth = Math.max(2, 3 * z);
      ctx.beginPath();
      ctx.moveTo(x, y - m.TH * 0.18 - lift);
      ctx.lineTo(x, y + m.TH * 0.18 - lift);
      ctx.stroke();
    }
    if (room && selectedRoom === room.id) {
      ctx.strokeStyle = PAL.amber;
      ctx.lineWidth = 2;
      topFace(ctx, x, y, m, lift);
      ctx.stroke();
    }
  };

  const pathTiles = order.filter(({ c, r }) => game.tiles[r]![c]!.corridor && !game.tiles[r]![c]!.roomId);
  for (const tile of pathTiles) paintTile(tile.c, tile.r, null);

  const rooms = [...game.rooms].sort((a, b) => a.c + a.r - (b.c + b.r));
  for (const room of rooms) {
    const tiles = roomTiles(room).sort((a, b) => a.c + a.r - (b.c + b.r));
    const mid = tiles[Math.floor(tiles.length / 2)]!;
    const shadow = tilePos(mid.c, mid.r, m);
    ctx.fillStyle = "rgba(18,38,44,0.12)";
    ctx.beginPath();
    ctx.ellipse(shadow.x, shadow.y + 8 * z, m.TW * room.w * 0.28, m.TH * room.h * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
    for (const tile of tiles) paintTile(tile.c, tile.r, room);
  }

  for (const room of rooms) {
    const look = LOOK[room.type];
    const spots = anchorTiles(room);
    room.slots.forEach((slot, index) => {
      if (!slot.item) return;
      const at = spots[index];
      if (!at) return;
      const pos = tilePos(at.c, at.r, m);
      const powered = room.halt === 0 && roomOnline(game, room) && !power.off.some((hit) => hit.roomId === room.id && hit.index === index);
      const bob = Math.sin(t * 2 + index) * 0.6;
      drawGear(ctx, slot.item.defId, pos.x, pos.y - liftRoom + bob, z, powered, look.accent);
    });
    const center = roomTiles(room)[Math.floor(roomTiles(room).length / 2)]!;
    const pos = tilePos(center.c, center.r, m);
    drawRoomIcon(ctx, room.type, pos.x, pos.y - liftRoom - 6 * z, z, look);
    const text = room.type === "hq" ? game.name : `${NAME[room.type]} ${room.level}`;
    chip(ctx, pos.x, pos.y - liftRoom - 48 * z, text, z);
    const crew = game.staff.filter((s) => s.roomId === room.id).length;
    if (crew) {
      const px = pos.x + m.TW * 0.22;
      const py = pos.y - liftRoom;
      ctx.fillStyle = PAL.ink;
      ctx.beginPath();
      ctx.arc(px, py - 12 * z, 3.2 * z, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = look.accent;
      ctx.fillRect(px - 3 * z, py - 8 * z, 6 * z, 7 * z);
    }
  }

  ctx.textAlign = "center";
  for (const spec of PARCELS) {
    if (game.owned.includes(spec.id)) continue;
    const visible = spec.c1 > bounds.c0 && spec.c0 < bounds.c1 && spec.r1 > bounds.r0 && spec.r0 < bounds.r1;
    if (!visible) continue;
    const pos = tilePos((spec.c0 + spec.c1 - 1) / 2, (spec.r0 + spec.r1 - 1) / 2, m);
    chip(ctx, pos.x, pos.y, spec.name, z);
  }
}
