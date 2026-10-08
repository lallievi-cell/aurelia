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
  localStorage.setItem(KEY, JSON.stringify(game));
}

export function clearGame() {
  localStorage.removeItem(KEY);
}
