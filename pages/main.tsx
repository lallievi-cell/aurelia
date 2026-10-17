import React, { Component, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { AureliaGame } from "@/components/AureliaGame";
import { clearGame } from "@/tycoon/save";
import "../src/styles.css";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Root uncaught error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#12262c] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md bg-[#1a3840] border border-white/20 rounded-3xl p-6 shadow-2xl">
            <h1 className="font-display text-2xl text-amber-400 mb-2">Aurelia CDMO</h1>
            <p className="text-white/80 text-sm mb-4">
              Si è verificato un errore durante l'avvio su questo dispositivo ({this.state.error?.message || "Errore sconosciuto"}).
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full py-3 bg-[#0d9488] hover:bg-[#0f766e] text-white rounded-2xl font-bold text-sm shadow-md transition-all cursor-pointer"
              >
                Ricarica la pagina
              </button>
              <button
                type="button"
                onClick={() => {
                  clearGame();
                  window.location.reload();
                }}
                className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white/90 rounded-2xl text-xs font-semibold transition-all cursor-pointer"
              >
                Ripristina salvataggio e ricarica
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <RootErrorBoundary>
      <AureliaGame />
    </RootErrorBoundary>,
  );
}
