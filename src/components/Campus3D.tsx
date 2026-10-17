import React, { useEffect, useRef, useState } from "react";
import { ThreeCampus } from "@/tycoon/threeCampus";
import { type Game } from "@/tycoon/model";
import {
  Box,
  Layers,
  ZoomIn,
  ZoomOut,
  Focus,
  Sparkles,
  Cpu,
  Info,
} from "lucide-react";

export interface Campus3DProps {
  game: Game;
  selectedRoomId: string | null;
  selectedCell: { c: number; r: number } | null;
  onSelectRoom: (roomId: string) => void;
  onSelectTile: (cell: { c: number; r: number }) => void;
  onSelectParcel: (parcelId: string) => void;
  onToggle2D?: () => void;
}

export const Campus3D: React.FC<Campus3DProps> = ({
  game,
  selectedRoomId,
  selectedCell,
  onSelectRoom,
  onSelectTile,
  onSelectParcel,
  onToggle2D,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const campusRef = useRef<ThreeCampus | null>(null);
  const [showControlsHint, setShowControlsHint] = useState(true);

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
    });

    campusRef.current = campus;
    campus.update(game, selectedRoomId, selectedCell);

    // Resize observer for responsive canvas sizing
    const ro = new ResizeObserver(() => {
      campus.resize();
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      campus.destroy();
      campusRef.current = null;
    };
  }, []); // Run on mount

  // Sync game state to ThreeCampus
  useEffect(() => {
    if (campusRef.current) {
      campusRef.current.update(game, selectedRoomId, selectedCell);
    }
  }, [game, selectedRoomId, selectedCell]);

  // Compute telemetry metrics for 3D HUD
  const totalSlots = game.rooms.reduce((acc, r) => acc + r.slots.length, 0);
  const totalProps = game.rooms.reduce(
    (acc, r) => acc + r.slots.filter((s) => s.item).length,
    0
  );
  const activeRooms = game.rooms.length;

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-paper">
      {/* 3D WebGL Canvas Container */}
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing touch-none"
      />

      {/* Top Floating Telemetry & Mode Switch */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        {/* Campus 3D Status Pill */}
        <div className="flex items-center gap-2 pointer-events-auto bg-card/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-line/60 shadow-md">
          <div className="flex items-center gap-1.5 text-teal font-bold text-xs">
            <Box className="h-4 w-4 text-emerald-600 animate-pulse" />
            <span className="tracking-wide">CAMPUS 3D</span>
          </div>
          <span className="text-line/80">|</span>
          <div className="flex items-center gap-2 text-[11px] font-medium text-ink">
            <span className="inline-flex items-center gap-1">
              <Cpu className="h-3 w-3 text-amber" />
              <strong className="text-teal font-semibold">{totalProps}</strong>/{totalSlots} Impianti 3D
            </span>
            <span className="hidden sm:inline text-mist">·</span>
            <span className="hidden sm:inline text-mist">
              {activeRooms} Cleanroom attive
            </span>
          </div>
        </div>

        {/* 2D / 3D Mode Switcher */}
        {onToggle2D && (
          <button
            type="button"
            onClick={onToggle2D}
            className="pointer-events-auto flex items-center gap-1.5 bg-card/95 hover:bg-paper text-ink px-3 py-1.5 rounded-2xl border border-line/70 text-xs font-semibold shadow-md cursor-pointer transition-all active:scale-95 hover:border-teal"
            title="Passa alla vista planimetrica 2D"
          >
            <Layers className="h-3.5 w-3.5 text-teal" />
            <span className="hidden xs:inline">Vista 2D</span>
          </button>
        )}
      </div>

      {/* Floating Camera Controls (Bottom Right) */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
        <button
          type="button"
          onClick={() => campusRef.current?.setZoom(0.85)}
          className="grid h-11 w-11 place-items-center rounded-2xl border border-line/70 bg-card/95 text-ink shadow-lg backdrop-blur-md hover:bg-paper hover:border-teal hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="Zoom Avanti (Rotella mouse in su)"
          aria-label="Zoom avanti 3D"
        >
          <ZoomIn className="h-5 w-5 text-teal" />
        </button>
        <button
          type="button"
          onClick={() => campusRef.current?.setZoom(1.15)}
          className="grid h-11 w-11 place-items-center rounded-2xl border border-line/70 bg-card/95 text-ink shadow-lg backdrop-blur-md hover:bg-paper hover:border-teal hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="Zoom Indietro (Rotella mouse in giù)"
          aria-label="Zoom indietro 3D"
        >
          <ZoomOut className="h-5 w-5 text-mist" />
        </button>
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

      {/* Interactive Helper Hint (Fades out or can be dismissed) */}
      {showControlsHint && (
        <div
          onClick={() => setShowControlsHint(false)}
          className="absolute bottom-4 left-4 max-w-[280px] sm:max-w-xs bg-card/90 backdrop-blur-md border border-line/60 rounded-2xl px-3 py-2 text-[11px] text-ink shadow-lg cursor-pointer hover:bg-card transition-all z-10"
          title="Tocca per chiudere questo suggerimento"
        >
          <div className="flex items-center gap-1.5 font-semibold text-teal mb-0.5">
            <Sparkles className="h-3.5 w-3.5 text-amber" />
            <span>Mondo 3D Three.js Attivo</span>
          </div>
          <p className="text-mist leading-tight">
            Trascina per ruotare/panoramare. Rotella o pinch per lo zoom. Tocca qualsiasi stanza o macchinario per gestirlo in tempo reale.
          </p>
        </div>
      )}
    </div>
  );
};
