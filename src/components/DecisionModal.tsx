import React from "react";
import { AlertTriangle, Award, Building, DollarSign, FileCheck, FlaskConical, Users } from "lucide-react";
import { euro, type Game, type PendingDecisionState } from "@/tycoon/model";
import type { DecisionEvent } from "@/tycoon/events";

interface DecisionModalProps {
  game: Game;
  decision: DecisionEvent | PendingDecisionState;
  onSelect: (choiceId: string) => void;
}

const CATEGORY_META: Record<
  DecisionEvent["category"],
  { label: string; bg: string; text: string; icon: React.ReactNode }
> = {
  regulatory: {
    label: "Regolatorio & Qualità",
    bg: "bg-red-500/10 border-red-500/30",
    text: "text-red-700",
    icon: <AlertTriangle className="h-4 w-4 text-red-600" />,
  },
  science: {
    label: "Ricerca & Sviluppo",
    bg: "bg-teal/10 border-teal/30",
    text: "text-teal",
    icon: <FlaskConical className="h-4 w-4 text-teal" />,
  },
  market: {
    label: "Mercato & Concorrenza",
    bg: "bg-amber/10 border-amber/30",
    text: "text-amber",
    icon: <DollarSign className="h-4 w-4 text-amber" />,
  },
  staff: {
    label: "Personale & Talento",
    bg: "bg-purple-500/10 border-purple-500/30",
    text: "text-purple-700",
    icon: <Users className="h-4 w-4 text-purple-600" />,
  },
  production: {
    label: "Impianti & Operazioni",
    bg: "bg-blue-500/10 border-blue-500/30",
    text: "text-blue-700",
    icon: <Building className="h-4 w-4 text-blue-600" />,
  },
  opportunity: {
    label: "Opportunità Strategica",
    bg: "bg-amber-500/10 border-amber-500/30",
    text: "text-amber-700",
    icon: <Award className="h-4 w-4 text-amber-600" />,
  },
};

export function DecisionModal({ game, decision, onSelect }: DecisionModalProps) {
  const meta = CATEGORY_META[decision.category] ?? {
    label: "Dilemma Aziendale",
    bg: "bg-teal/10 border-teal/30",
    text: "text-teal",
    icon: <FileCheck className="h-4 w-4" />,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-cocoa/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-card border border-line shadow-2xl p-5 md:p-6 overflow-hidden">
        {/* Top category pill */}
        <div className="flex items-center justify-between gap-2">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${meta.bg} ${meta.text}`}>
            {meta.icon}
            <span>{meta.label}</span>
          </div>
          <span className="text-[11px] font-semibold text-mist tracking-widest uppercase">
            Settimana {game.week}
          </span>
        </div>

        {/* Title */}
        <h2 className="mt-3 font-display text-2xl md:text-3xl text-ink leading-tight">
          {decision.title}
        </h2>

        {/* Description */}
        <p className="mt-3 text-sm md:text-base text-mist leading-relaxed bg-paper/60 p-3.5 rounded-2xl border border-line/60">
          {decision.description}
        </p>

        {/* Choices */}
        <div className="mt-4 space-y-2.5">
          {decision.choices.map((choice) => {
            const hasCost = Boolean(choice.cost && choice.cost > 0);
            const canAfford = !hasCost || game.cash >= (choice.cost ?? 0);

            return (
              <button
                key={choice.id}
                type="button"
                disabled={!canAfford}
                onClick={() => onSelect(choice.id)}
                className={`group w-full text-left p-3.5 rounded-2xl border transition-all ${
                  canAfford
                    ? "border-line bg-card hover:border-teal hover:bg-teal/5 active:scale-[0.99] cursor-pointer"
                    : "border-line/40 bg-paper/40 opacity-50 cursor-not-allowed"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-ink group-hover:text-teal text-sm md:text-base">
                    {choice.label}
                  </span>
                  {hasCost && (
                    <span
                      className={`shrink-0 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        canAfford
                          ? "bg-amber/15 text-amber"
                          : "bg-red-500/15 text-red-600"
                      }`}
                    >
                      Cost: {euro(choice.cost!)}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs md:text-sm text-mist leading-snug">
                  {choice.blurb}
                </p>
                {!canAfford && (
                  <p className="mt-1 text-[11px] font-medium text-red-600">
                    Fondi insufficienti (cassa attuale: {euro(game.cash)})
                  </p>
                )}
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-center text-[11px] text-mist italic">
          Le tue scelte plasmano la cultura, i bilanci e il destino industriale della tua CDMO.
        </p>
      </div>
    </div>
  );
}
