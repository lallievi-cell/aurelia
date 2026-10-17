import React, { useEffect, useRef, useState } from "react";
import { ThreeCampus } from "@/tycoon/threeCampus";
import { type Game } from "@/tycoon/model";
import {
  Box,
  Layers,
  ZoomIn,
  ZoomOut,
  Focus,
  RotateCcw,
  RotateCw,
  Trash2,
  Move,
  Zap,
  Award,
  Users,
  Eye,
  X,
  Sparkles,
  Cpu,
} from "lucide-react";

export interface Campus3DProps {
  game: Game;
  selectedRoomId: string | null;
  selectedCell: { c: number; r: number } | null;
  movingRoomId: string | null;
  inspectorOpen?: boolean;
  onSelectRoom: (roomId: string) => void;
  onSelectTile: (cell: { c: number; r: number }) => void;
  onSelectParcel: (parcelId: string) => void;
  onMoveRoom?: (roomId: string, targetCell: { c: number; r: number }) => void;
  onCancelMove?: () => void;
  onDemolishTile?: (cell: { c: number; r: number }) => void;
  onToggle2D?: () => void;
}

export const Campus3D: React.FC<Campus3DProps> = ({
  game,
  selectedRoomId,
  selectedCell,
  movingRoomId,
  inspectorOpen,
  onSelectRoom,
  onSelectTile,
  onSelectParcel,
  onMoveRoom,
  onCancelMove,
  onDemolishTile,
  onToggle2D,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const campusRef = useRef<ThreeCampus | null>(null);
  const [bulldozer, setBulldozer] = useState(false);
  const [overlay, setOverlay] = useState<"normal" | "power" | "quality" | "staff">("normal");

  // Initialize ThreeCampus
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const campus = new ThreeCampus(el, {
      onSelectRoom: (roomId) => {
        onSelectRoom(roomId);
      },
      onSelectTile: (cell) => {
        onSelectTile(cell);
      },
      onSelectParcel: (parcelId) => {
        onSelectParcel(parcelId);
      },
      onMoveRoom: (roomId, targetCell) => {
        onMoveRoom?.(roomId, targetCell);
      },
      onDemolishTile: (cell) => {
        onDemolishTile?.(cell);
      },
    });

    campusRef.current = campus;
    campus.update(game, selectedRoomId, selectedCell);

    // Store state in ref for keyboard handler
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "q" || e.key === "Q") {
        campus.rotateView(-1);
      } else if (e.key === "e" || e.key === "E") {
        campus.rotateView(1);
      } else if (e.key === "Escape") {
        if (stateRef.current.movingRoomId) stateRef.current.onCancelMove?.();
        if (stateRef.current.bulldozer) setBulldozer(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // Resize observer
    const ro = new ResizeObserver(() => {
      campus.resize();
    });
    ro.observe(el);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      ro.disconnect();
      campus.destroy();
      campusRef.current = null;
    };
  }, []);

  // Update stateRef
  const stateRef = useRef({ movingRoomId, bulldozer, onCancelMove });
  stateRef.current = { movingRoomId, bulldozer, onCancelMove };

  // Sync options if callbacks change
  useEffect(() => {
    if (campusRef.current) {
      campusRef.current.setOptions({
        onSelectRoom,
        onSelectTile,
        onSelectParcel,
        onMoveRoom,
        onDemolishTile,
      });
    }
  }, [onSelectRoom, onSelectTile, onSelectParcel, onMoveRoom, onDemolishTile]);

  // Sync game & selection
  useEffect(() => {
    if (campusRef.current) {
      campusRef.current.update(game, selectedRoomId, selectedCell);
    }
  }, [game, selectedRoomId, selectedCell]);

  // Sync moving room state
  useEffect(() => {
    if (campusRef.current) {
      campusRef.current.setMovingRoom(movingRoomId);
    }
  }, [movingRoomId]);

  // Sync bulldozer state
  useEffect(() => {
    if (campusRef.current) {
      campusRef.current.setBulldozerMode(bulldozer);
    }
  }, [bulldozer]);

  // Sync heatmap overlay mode
  useEffect(() => {
    if (campusRef.current) {
      campusRef.current.setOverlayMode(overlay);
    }
  }, [overlay]);

  const totalSlots = game.rooms.reduce((acc, r) => acc + r.slots.length, 0);
  const totalProps = game.rooms.reduce(
    (acc, r) => acc + r.slots.filter((s) => s.item).length,
    0
  );
  const activeRooms = game.rooms.length;
  const movingRoom = game.rooms.find((r) => r.id === movingRoomId);

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-paper">
      {/* 3D WebGL Canvas */}
      <div
        ref={containerRef}
        className={`absolute inset-0 w-full h-full touch-none ${
          bulldozer
            ? "cursor-crosshair"
            : movingRoomId
            ? "cursor-copy"
            : "cursor-grab active:cursor-grabbing"
        }`}
      />

      {/* Top Floating Telemetry & Controls Bar */}
      <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none z-10">
        {/* Campus 3D Info Pill */}
        <div className="flex items-center gap-2 pointer-events-auto bg-card/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-line/60 shadow-md">
          <div className="flex items-center gap-1.5 text-teal font-bold text-xs">
            <Box className="h-4 w-4 text-emerald-600 animate-pulse" />
            <span className="tracking-wide">CAMPUS 3D</span>
          </div>
          <span className="text-line/80">|</span>
          <div className="flex items-center gap-2 text-[11px] font-medium text-ink">
            <span className="inline-flex items-center gap-1">
              <Cpu className="h-3 w-3 text-amber" />
              <strong className="text-teal font-semibold">{totalProps}</strong>/{totalSlots} Impianti
            </span>
            <span className="hidden sm:inline text-mist">·</span>
            <span className="hidden sm:inline text-mist">
              {activeRooms} Cleanroom
            </span>
          </div>
        </div>

        {/* Thematic Overlays (Tycoon Heatmaps) */}
        <div className="flex items-center gap-1 pointer-events-auto bg-card/90 backdrop-blur-md p-1 rounded-2xl border border-line/60 shadow-md">
          <button
            type="button"
            onClick={() => setOverlay("normal")}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              overlay === "normal"
                ? "bg-teal text-white shadow-xs"
                : "text-mist hover:text-ink hover:bg-paper"
            }`}
            title="Vista 3D realistica standard"
          >
            <Eye className="h-3 w-3" />
            <span className="hidden md:inline">Normale</span>
          </button>
          <button
            type="button"
            onClick={() => setOverlay("power")}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              overlay === "power"
                ? "bg-amber text-ink font-bold shadow-xs"
                : "text-mist hover:text-ink hover:bg-paper"
            }`}
            title="Mappa Rete Elettrica: stanze alimentate (ciano) vs senza corrente (rosso)"
          >
            <Zap className="h-3 w-3 text-amber-500" />
            <span className="hidden md:inline">Rete kW</span>
          </button>
          <button
            type="button"
            onClick={() => setOverlay("quality")}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              overlay === "quality"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-mist hover:text-ink hover:bg-paper"
            }`}
            title="Mappa Qualità: classificazione e finiture GMP"
          >
            <Award className="h-3 w-3 text-emerald-400" />
            <span className="hidden md:inline">Qualità</span>
          </button>
          <button
            type="button"
            onClick={() => setOverlay("staff")}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              overlay === "staff"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-mist hover:text-ink hover:bg-paper"
            }`}
            title="Mappa Personale: stanze presidiate vs in attesa di operatori"
          >
            <Users className="h-3 w-3 text-indigo-400" />
            <span className="hidden md:inline">Personale</span>
          </button>
        </div>

        {/* Quick Tools: Demolish / 2D Toggle */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* Bulldozer / Demolish Mode */}
          <button
            type="button"
            onClick={() => {
              if (movingRoomId) onCancelMove?.();
              setBulldozer((v) => !v);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border text-xs font-semibold shadow-md cursor-pointer transition-all active:scale-95 ${
              bulldozer
                ? "bg-red-600 text-white border-red-500 ring-2 ring-red-400 animate-pulse shadow-red-500/30"
                : "bg-card/95 hover:bg-paper text-ink border-line/70 hover:border-red-400 hover:text-red-600"
            }`}
            title="Modalità Demolizione: tocca corridoi o stanze vuote per rimuoverli"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{bulldozer ? "Demolizione Attiva" : "Demolisci"}</span>
          </button>

          {/* 2D Planimetric Toggle */}
          {onToggle2D && (
            <button
              type="button"
              onClick={onToggle2D}
              className="flex items-center gap-1.5 bg-card/95 hover:bg-paper text-ink px-3 py-1.5 rounded-2xl border border-line/70 text-xs font-semibold shadow-md cursor-pointer transition-all active:scale-95 hover:border-teal"
              title="Passa alla vista planimetrica 2D"
            >
              <Layers className="h-3.5 w-3.5 text-teal" />
              <span className="hidden xs:inline">Vista 2D</span>
            </button>
          )}
        </div>
      </div>

      {/* Moving Room Mode Banner Notification */}
      {movingRoomId && movingRoom && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 max-w-lg w-[92%] pointer-events-auto bg-amber/95 backdrop-blur-md border border-amber-600 text-ink px-4 py-2.5 rounded-2xl shadow-xl flex items-center justify-between gap-3 z-30 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 min-w-0">
            <Move className="h-5 w-5 text-ink shrink-0 animate-bounce" />
            <div className="text-xs">
              <p className="font-bold">Spostamento Stanza Attivo</p>
              <p className="text-[11px] text-ink/80 truncate">
                Tocca una casella libera per posizionare la stanza conservando tutti i macchinari.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancelMove}
            className="shrink-0 px-3 py-1 bg-ink text-white rounded-xl text-xs font-bold hover:bg-ink/80 transition-all cursor-pointer flex items-center gap-1"
          >
            <X className="h-3.5 w-3.5" />
            <span>Annulla</span>
          </button>
        </div>
      )}

      {/* Bulldozer Active Notification */}
      {bulldozer && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 max-w-md w-[90%] pointer-events-auto bg-red-600/95 backdrop-blur-md border border-red-500 text-white px-4 py-2 rounded-2xl shadow-xl flex items-center justify-between gap-3 z-30 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 text-xs">
            <Trash2 className="h-4 w-4 shrink-0" />
            <span>Tocca un corridoio o una stanza vuota per rimuoverli con rimborso.</span>
          </div>
          <button
            type="button"
            onClick={() => setBulldozer(false)}
            className="shrink-0 px-2.5 py-1 bg-white text-red-600 rounded-xl text-xs font-bold hover:bg-white/90 transition-all cursor-pointer"
          >
            Fine
          </button>
        </div>
      )}

      {/* Floating Camera Controls: 360 Rotation, Zoom, Focus (Bottom Right) */}
      <div
        className={`absolute bottom-4 flex flex-col gap-2 z-10 pointer-events-auto transition-all duration-300 ease-out ${
          inspectorOpen ? "right-4 md:right-[432px]" : "right-4"
        }`}
      >
        {/* Rotate Left (Q) */}
        <button
          type="button"
          onClick={() => campusRef.current?.rotateView(-1)}
          className="grid h-11 w-11 place-items-center rounded-2xl border border-line/70 bg-card/95 text-ink shadow-lg backdrop-blur-md hover:bg-paper hover:border-teal hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="Ruota visuale a sinistra (Tasto Q)"
          aria-label="Ruota 3D a sinistra"
        >
          <RotateCcw className="h-5 w-5 text-teal" />
        </button>

        {/* Rotate Right (E) */}
        <button
          type="button"
          onClick={() => campusRef.current?.rotateView(1)}
          className="grid h-11 w-11 place-items-center rounded-2xl border border-line/70 bg-card/95 text-ink shadow-lg backdrop-blur-md hover:bg-paper hover:border-teal hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="Ruota visuale a destra (Tasto E)"
          aria-label="Ruota 3D a destra"
        >
          <RotateCw className="h-5 w-5 text-teal" />
        </button>

        {/* Zoom In */}
        <button
          type="button"
          onClick={() => campusRef.current?.setZoom(0.85)}
          className="grid h-11 w-11 place-items-center rounded-2xl border border-line/70 bg-card/95 text-ink shadow-lg backdrop-blur-md hover:bg-paper hover:border-teal hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="Zoom Avanti (Rotella mouse o pinch dita)"
          aria-label="Zoom avanti 3D"
        >
          <ZoomIn className="h-5 w-5 text-teal" />
        </button>

        {/* Zoom Out */}
        <button
          type="button"
          onClick={() => campusRef.current?.setZoom(1.15)}
          className="grid h-11 w-11 place-items-center rounded-2xl border border-line/70 bg-card/95 text-ink shadow-lg backdrop-blur-md hover:bg-paper hover:border-teal hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="Zoom Indietro (Rotella mouse o pinch dita)"
          aria-label="Zoom indietro 3D"
        >
          <ZoomOut className="h-5 w-5 text-mist" />
        </button>

        {/* Reset / Center Camera */}
        <button
          type="button"
          onClick={() => campusRef.current?.resetView()}
          className="grid h-11 w-11 place-items-center rounded-2xl border border-line/70 bg-card/95 text-ink shadow-lg backdrop-blur-md hover:bg-paper hover:border-teal hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="Centra vista sul campus"
          aria-label="Ricentra vista 3D"
        >
          <Focus className="h-5 w-5 text-amber" />
        </button>
      </div>
    </div>
  );
};
