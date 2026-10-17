import { normalize, type Game } from "@/tycoon/model";

const KEY = "aurelia-cdmo-v1";

export function loadGame(): Game | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return normalize(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveGame(game: Game) {
  try {
    localStorage.setItem(KEY, JSON.stringify(game));
  } catch (e) {
    console.warn("Storage write failed:", e);
  }
}

export function clearGame() {
  try {
    localStorage.removeItem(KEY);
  } catch (e) {
    console.warn("Storage remove failed:", e);
  }
}
