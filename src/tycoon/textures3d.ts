import * as THREE from "three";

/**
 * Procedural, seamless canvas textures generated once at runtime and cached.
 * No image downloads, tiny VRAM footprint (256–512px), safe on mobile GPUs.
 */

type Painter = (ctx: CanvasRenderingContext2D, size: number, rand: () => number) => void;

const cache = new Map<string, THREE.CanvasTexture>();

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Draws a shape at (x,y) and at its wrapped copies so the texture tiles seamlessly. */
function wrapDraw(size: number, x: number, y: number, r: number, draw: (x: number, y: number) => void) {
  for (const ox of [-size, 0, size]) {
    for (const oy of [-size, 0, size]) {
      const px = x + ox;
      const py = y + oy;
      if (px + r < 0 || py + r < 0 || px - r > size || py - r > size) continue;
      draw(px, py);
    }
  }
}

function speckle(
  ctx: CanvasRenderingContext2D,
  size: number,
  rand: () => number,
  count: number,
  colors: string[],
  minR: number,
  maxR: number,
  alpha = 1,
) {
  ctx.globalAlpha = alpha;
  for (let i = 0; i < count; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = minR + rand() * (maxR - minR);
    ctx.fillStyle = colors[Math.floor(rand() * colors.length)]!;
    wrapDraw(size, x, y, r, (px, py) => {
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  ctx.globalAlpha = 1;
}

function make(key: string, size: number, seed: number, paint: Painter, srgb = true): THREE.CanvasTexture {
  const hit = cache.get(key);
  if (hit) return hit;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  paint(ctx, size, mulberry32(seed));
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  cache.set(key, tex);
  return tex;
}

/** Returns a texture sharing the cached image but with its own repeat. */
export function withRepeat(tex: THREE.Texture, rx: number, ry: number): THREE.Texture {
  const key = `${tex.uuid}:${rx}:${ry}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const clone = tex.clone() as THREE.CanvasTexture;
  clone.repeat.set(rx, ry);
  clone.needsUpdate = true;
  cache.set(key, clone);
  return clone;
}

/** Lush lawn: layered greens, clover patches and fine blade strokes. */
export function grassTexture(): THREE.CanvasTexture {
  return make("grass", 512, 11, (ctx, s, rand) => {
    ctx.fillStyle = "#4f8a3c";
    ctx.fillRect(0, 0, s, s);
    // Large soft tonal patches
    speckle(ctx, s, rand, 60, ["#5c9a45", "#467d35", "#62a24b", "#3f7330"], 30, 70, 0.22);
    // Mid clumps
    speckle(ctx, s, rand, 900, ["#6aa851", "#3d6f2e", "#79b65c", "#558f40", "#2f5e25"], 1.5, 4.5, 0.55);
    // Fine blades
    for (let i = 0; i < 5200; i++) {
      const x = rand() * s;
      const y = rand() * s;
      const len = 2 + rand() * 5;
      const ang = -Math.PI / 2 + (rand() - 0.5) * 0.9;
      const shade = rand();
      ctx.strokeStyle = shade > 0.6 ? "#8cc56a" : shade > 0.3 ? "#5f9a46" : "#36652a";
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 1;
      wrapDraw(s, x, y, len, (px, py) => {
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + Math.cos(ang) * len, py + Math.sin(ang) * len);
        ctx.stroke();
      });
    }
    ctx.globalAlpha = 1;
  });
}

/** Pale concrete pavers with grooves — owned building lots. Near-white so it can be tinted. */
export function paverTexture(): THREE.CanvasTexture {
  return make("paver", 256, 23, (ctx, s, rand) => {
    ctx.fillStyle = "#eef1f3";
    ctx.fillRect(0, 0, s, s);
    speckle(ctx, s, rand, 1400, ["#d9dee2", "#f8fafb", "#cfd5da", "#e4e8eb"], 0.6, 1.8, 0.7);
    speckle(ctx, s, rand, 30, ["#dfe4e8", "#f5f7f8"], 12, 28, 0.25);
    // 2x2 paver grid with grooves + soft bevel highlight
    const half = s / 2;
    ctx.fillStyle = "#b9c1c8";
    for (const p of [0, half]) {
      ctx.fillRect(p, 0, 3, s);
      ctx.fillRect(0, p, s, 3);
    }
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    for (const p of [0, half]) {
      ctx.fillRect(p + 3, 0, 1.5, s);
      ctx.fillRect(0, p + 3, s, 1.5);
    }
  });
}

/** Asphalt with aggregate grain. */
export function asphaltTexture(): THREE.CanvasTexture {
  return make("asphalt", 256, 37, (ctx, s, rand) => {
    ctx.fillStyle = "#3a4149";
    ctx.fillRect(0, 0, s, s);
    speckle(ctx, s, rand, 40, ["#353c44", "#414952"], 14, 34, 0.35);
    speckle(ctx, s, rand, 2600, ["#2a3036", "#4b545e", "#5b646e", "#30363d"], 0.5, 1.4, 0.8);
  });
}

/** Glossy cleanroom epoxy with fine flake — near-white so the room theme colour tints it. */
export function epoxyTexture(): THREE.CanvasTexture {
  return make("epoxy", 256, 41, (ctx, s, rand) => {
    ctx.fillStyle = "#f4f6f8";
    ctx.fillRect(0, 0, s, s);
    speckle(ctx, s, rand, 26, ["#eceff2", "#fbfcfd"], 18, 40, 0.35);
    speckle(ctx, s, rand, 900, ["#d5dbe0", "#ffffff", "#c9d0d6", "#e3e7ea"], 0.5, 1.3, 0.65);
  });
}

/** Sanitary vinyl corridor sheet with welded seams. */
export function vinylTexture(): THREE.CanvasTexture {
  return make("vinyl", 256, 53, (ctx, s, rand) => {
    ctx.fillStyle = "#f2f5f7";
    ctx.fillRect(0, 0, s, s);
    speckle(ctx, s, rand, 700, ["#e2e7eb", "#fafbfc", "#d8dee3"], 0.5, 1.6, 0.6);
    ctx.fillStyle = "#cbd3d9";
    ctx.fillRect(0, 0, s, 2);
    ctx.fillRect(0, 0, 2, s);
  });
}

/** Utility-yard concrete. */
export function concreteTexture(): THREE.CanvasTexture {
  return make("concrete", 256, 67, (ctx, s, rand) => {
    ctx.fillStyle = "#c3c9ce";
    ctx.fillRect(0, 0, s, s);
    speckle(ctx, s, rand, 40, ["#b8bfc5", "#ccd2d6"], 14, 36, 0.35);
    speckle(ctx, s, rand, 1800, ["#a9b1b8", "#d6dbdf", "#9aa3ab"], 0.5, 1.5, 0.6);
  });
}

/** Vertical sky gradient used as scene background. */
export function skyTexture(): THREE.CanvasTexture {
  const hit = cache.get("sky");
  if (hit) return hit;
  const canvas = document.createElement("canvas");
  canvas.width = 4;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, "#8fc4e8");
  g.addColorStop(0.55, "#cfe6ef");
  g.addColorStop(1, "#e9efe4");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 256);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set("sky", tex);
  return tex;
}
