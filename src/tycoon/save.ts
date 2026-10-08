import { type Game } from "@/tycoon/model";

const KEY = "aurelia-cdmo-v1";

export function loadGame(): Game | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Game;
    if (data?.v !== 1 || !data.cells) return null;
    return data;
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
