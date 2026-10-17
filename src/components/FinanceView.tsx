import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  Compass,
  CreditCard,
  FileText,
  TrendingUp,
  Trophy,
} from "lucide-react";
import {
  euro,
  setPrice,
  type Game,
  borrowMoney,
  repayMoney,
  acceptInvestmentRound,
  acquireRival,
  extendPatent,
} from "@/tycoon/model";
import { soundCash, soundClick, soundSuccess } from "@/tycoon/audio";
import { fireConfetti } from "@/tycoon/celebrate";
import {
  type CreditRating,
  type InvestmentRound,
  calculateCreditRating,
} from "@/tycoon/finance";
import {
  calculateEnterpriseValuation,
  currentRank,
  nextRank,
  RANKS,
} from "@/tycoon/valuation";
import { ACHIEVEMENTS_LIST, type Achievement } from "@/tycoon/achievements";
import { analyzeFinancialHealth, type WeekLedger } from "@/tycoon/ledger";

interface FinanceViewProps {
  game: Game;
  apply: (g: Game | string) => void;
  armReset: boolean;
  reset: () => void;
}

type SubTab = "pnl" | "bank" | "equity" | "mna" | "achievements" | "log";

export function FinanceView({ game, apply, armReset, reset }: FinanceViewProps) {
  const [subTab, setSubTab] = useState<SubTab>("pnl");
  const [achFilter, setAchFilter] = useState<Achievement["category"] | "tutti">("tutti");

  // Valuation & Corporate Rank
  const valInfo = useMemo(() => calculateEnterpriseValuation(game), [game]);
  const cRank = useMemo(() => currentRank(valInfo.total), [valInfo.total]);
  const nRank = useMemo(() => nextRank(valInfo.total), [valInfo.total]);

  // Credit Rating & Debt
  const loan = game.finance?.loan ?? 0;
  const equityPct = game.finance?.equityOwned ?? 100;
  const ratingInfo = useMemo(() => {
    const annualRev = (game.ledger ?? []).slice(-52).reduce((s, l) => s + l.revenue.total, 0);
    return calculateCreditRating(annualRev, game.cash, loan, game.reputation);
  }, [game.ledger, game.cash, loan, game.reputation]);

  const availableCredit = Math.max(0, ratingInfo.maxLoan - loan);
  const weeklyRatePct = (ratingInfo.interestRate * 100).toFixed(2);

  // Financial Health & Ledger
  const ledgerHistory = game.ledger ?? [];
  const health = useMemo(
    () => analyzeFinancialHealth(game.cash, ledgerHistory),
    [game.cash, ledgerHistory]
  );

  const lastWeek = game.lastWeekSummary ?? {
    week: game.week,
    revenue: { batches: 0, commerce: 0, licenses: 0, goals: 0, grants: 0, finance: 0, total: 0 },
    expenses: { payroll: 0, upkeep: 0, materials: 0, penalties: 0, research: 0, interest: 0, total: 0 },
    net: 0,
    cashEnd: game.cash,
  };

  // Chart Data (Past 24 weeks)
  const chartData = useMemo(() => {
    const list = ledgerHistory.length > 0
      ? ledgerHistory.slice(-24)
      : [lastWeek];
    return list.map((item) => ({
      name: `s.${item.week}`,
      settimana: item.week,
      Ricavi: item.revenue.total,
      Costi: item.expenses.total,
      Netto: item.net,
      Cassa: item.cashEnd,
    }));
  }, [ledgerHistory, lastWeek]);

  // Achievements
  const unlockedAchievements = game.achievements ?? [];
  const unlockedCount = unlockedAchievements.length;

  // Investment rounds from state
  const rounds = game.finance?.rounds ?? [];

  return (
    <div className="mx-auto grid max-w-2xl gap-4">
      {/* Top Corporate Rank Banner */}
      <div className="rounded-3xl border border-line bg-card p-4 md:p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-teal/15 px-2.5 py-0.5 text-xs font-bold text-teal">
                <Building2 className="h-3.5 w-3.5" />
                {cRank.title}
              </span>
              <span className="text-xs font-medium text-mist">
                Quota Fondatore: {equityPct}%
              </span>
            </div>
            <h2 className="mt-1 font-display text-2xl md:text-3xl text-ink">
              Valutazione: {euro(valInfo.total)}
            </h2>
            <p className="text-xs text-mist mt-0.5">
              Impianti: {euro(valInfo.facilitiesVal)} · Pipeline: {euro(valInfo.pipelineVal)} · Prodotti: {euro(valInfo.commercialVal)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-mist">Cassa disponibile</p>
            <p className="font-display text-xl text-ink">{euro(game.cash)}</p>
            <p
              className={`text-xs font-semibold ${
                lastWeek.net >= 0 ? "text-teal" : "text-amber"
              }`}
            >
              {lastWeek.net >= 0 ? "+" : ""}
              {euro(lastWeek.net)} /sett
            </p>
          </div>
        </div>

        {/* Corporate Rank Progress */}
        <div className="mt-3">
          <div className="flex justify-between text-[11px] text-mist mb-1">
            <span>Grado d'Impresa: {cRank.title}</span>
            <span>
              {nRank
                ? `Prossimo: ${nRank.title} (${euro(nRank.minValuation)})`
                : "Vertice dell'Industria: Big Pharma Globale!"}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-teal transition-all duration-500"
              style={{
                width: nRank
                  ? `${Math.min(100, Math.max(5, (valInfo.total / nRank.minValuation) * 100))}%`
                  : "100%",
              }}
            />
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <SubTabBtn
          active={subTab === "pnl"}
          onClick={() => setSubTab("pnl")}
          icon={<TrendingUp className="h-4 w-4" />}
          label="Bilancio P&L"
        />
        <SubTabBtn
          active={subTab === "bank"}
          onClick={() => setSubTab("bank")}
          icon={<CreditCard className="h-4 w-4" />}
          label="Banca & Fido"
        />
        <SubTabBtn
          active={subTab === "equity"}
          onClick={() => setSubTab("equity")}
          icon={<CircleDollarSign className="h-4 w-4" />}
          label="Round Azionari"
        />
        <SubTabBtn
          active={subTab === "mna"}
          onClick={() => setSubTab("mna")}
          icon={<Compass className="h-4 w-4" />}
          label="Rivali & Mercato"
        />
        <SubTabBtn
          active={subTab === "achievements"}
          onClick={() => setSubTab("achievements")}
          icon={<Trophy className="h-4 w-4" />}
          label={`Traguardi (${unlockedCount}/${ACHIEVEMENTS_LIST.length})`}
        />
        <SubTabBtn
          active={subTab === "log"}
          onClick={() => setSubTab("log")}
          icon={<FileText className="h-4 w-4" />}
          label="Registro"
        />
      </div>

      {/* SUBTAB 1: BILANCIO P&L */}
      {subTab === "pnl" && (
        <div className="grid gap-4">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            <div className="rounded-2xl border border-line bg-card p-3">
              <span className="text-[11px] font-medium text-mist uppercase">Ricavi Ultima Sett.</span>
              <p className="mt-1 font-display text-lg text-teal">+{euro(lastWeek.revenue.total)}</p>
              <span className="text-[11px] text-mist">da lotti e prodotti</span>
            </div>
            <div className="rounded-2xl border border-line bg-card p-3">
              <span className="text-[11px] font-medium text-mist uppercase">Costi Operativi</span>
              <p className="mt-1 font-display text-lg text-amber">-{euro(lastWeek.expenses.total)}</p>
              <span className="text-[11px] text-mist">stipendi e impianti</span>
            </div>
            <div className="rounded-2xl border border-line bg-card p-3">
              <span className="text-[11px] font-medium text-mist uppercase">Margine Medio</span>
              <p className={`mt-1 font-display text-lg ${health.marginPercent >= 0 ? "text-teal" : "text-red-600"}`}>
                {health.marginPercent > 0 ? `+${health.marginPercent}%` : `${health.marginPercent}%`}
              </p>
              <span className="text-[11px] text-mist">{health.statusLabel}</span>
            </div>
            <div className="rounded-2xl border border-line bg-card p-3">
              <span className="text-[11px] font-medium text-mist uppercase">Autonomia Cassa</span>
              <p className="mt-1 font-display text-lg text-ink">
                {health.runwayWeeks === Infinity ? "Illimitata" : `${health.runwayWeeks} sett.`}
              </p>
              <span className="text-[11px] text-mist">
                {health.burnRate > 0 ? `Burn: ${euro(health.burnRate)}/sett` : "Flusso positivo"}
              </span>
            </div>
          </div>

          {/* Recharts Area Chart */}
          <div className="rounded-3xl border border-line bg-card p-4">
            <h3 className="font-display text-base text-ink mb-1">Andamento Economico (Ultime 24 sett.)</h3>
            <p className="text-xs text-mist mb-3">Confronto tra ricavi (verde) e uscite operative (ambra).</p>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1b7a64" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#1b7a64" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c88812" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#c88812" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d3e0da" opacity={0.6} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#5d726c" }} />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#5d726c" }}
                    tickFormatter={(val) => `${Math.round(val / 1000)}k`}
                  />
                  <Tooltip
                    formatter={(val: any) => euro(Number(val) || 0)}
                    contentStyle={{ backgroundColor: "#f7fbf9", borderColor: "#d3e0da", borderRadius: "0.75rem", fontSize: "12px" }}
                  />
                  <Area type="monotone" dataKey="Ricavi" stroke="#1b7a64" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                  <Area type="monotone" dataKey="Costi" stroke="#c88812" strokeWidth={2} fillOpacity={1} fill="url(#colorExp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Revenue breakdown */}
            <div className="rounded-2xl border border-line bg-card p-4">
              <h4 className="font-semibold text-sm text-teal flex items-center gap-1.5 mb-2">
                <ArrowDownRight className="h-4 w-4" /> Voci di Entrata (Ultima Sett.)
              </h4>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-1 border-b border-line/40">
                  <span className="text-mist">Lotti Conto Terzi (CDMO)</span>
                  <span className="font-semibold text-ink">+{euro(lastWeek.revenue.batches)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-line/40">
                  <span className="text-mist">Vendita Farmaci Propri</span>
                  <span className="font-semibold text-ink">+{euro(lastWeek.revenue.commerce)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-line/40">
                  <span className="text-mist">Licenze Out Ricerca</span>
                  <span className="font-semibold text-ink">+{euro(lastWeek.revenue.licenses)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-mist">Bandi Pubblici / Grants</span>
                  <span className="font-semibold text-ink">+{euro(lastWeek.revenue.grants)}</span>
                </div>
              </div>
            </div>

            {/* Expenses breakdown */}
            <div className="rounded-2xl border border-line bg-card p-4">
              <h4 className="font-semibold text-sm text-amber flex items-center gap-1.5 mb-2">
                <ArrowUpRight className="h-4 w-4" /> Voci di Uscita (Ultima Sett.)
              </h4>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-1 border-b border-line/40">
                  <span className="text-mist">Stipendi Personale</span>
                  <span className="font-semibold text-ink">-{euro(lastWeek.expenses.payroll)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-line/40">
                  <span className="text-mist">Mantenimento Stanze & Energia</span>
                  <span className="font-semibold text-ink">-{euro(lastWeek.expenses.upkeep)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-line/40">
                  <span className="text-mist">Materie Prime & Reagenti</span>
                  <span className="font-semibold text-ink">-{euro(lastWeek.expenses.materials)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-line/40">
                  <span className="text-mist">Interessi Passivi sul Debito</span>
                  <span className="font-semibold text-ink">-{euro(lastWeek.expenses.interest)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-mist">Penali di Ritardo / Sanzioni</span>
                  <span className="font-semibold text-ink">-{euro(lastWeek.expenses.penalties)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: BANCA & FIDO */}
      {subTab === "bank" && (
        <div className="grid gap-4">
          <div className="rounded-3xl border border-line bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-mist uppercase tracking-wider">
                  Sportello Bancario Industriale
                </span>
                <h3 className="font-display text-2xl text-ink">Linea di Credito</h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-mist block">Rating Creditizio</span>
                <span className="inline-block px-3 py-1 rounded-xl bg-ink text-card font-display text-lg">
                  {ratingInfo.rating}
                </span>
              </div>
            </div>

            <p className="mt-2 text-sm text-mist leading-relaxed">
              Il rating creditizio dipende dalla tua reputazione, dal fatturato e dal debito.
              Un rating elevato permette di accedere a fidi più alti con tassi agevolati.
            </p>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-paper/60 p-3 rounded-2xl border border-line/60">
              <div>
                <span className="text-[11px] text-mist block">Tasso Settimanale</span>
                <span className="font-semibold text-ink">{weeklyRatePct}% /sett</span>
              </div>
              <div>
                <span className="text-[11px] text-mist block">Fido Massimo</span>
                <span className="font-semibold text-ink">{euro(ratingInfo.maxLoan)}</span>
              </div>
              <div>
                <span className="text-[11px] text-mist block">Debito Residuo</span>
                <span className={`font-semibold ${loan > 0 ? "text-amber" : "text-teal"}`}>
                  {euro(loan)}
                </span>
              </div>
            </div>

            {/* Borrow Actions */}
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-mist uppercase mb-2">
                Accedi al Credito (Fido disponibile: {euro(availableCredit)})
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={availableCredit < 10000}
                  onClick={() => {
                    soundCash();
                    apply(borrowMoney(game, 10000));
                  }}
                  className="min-h-11 rounded-xl bg-card border border-line font-medium text-xs hover:border-teal disabled:opacity-40 cursor-pointer transition-colors active:scale-95"
                >
                  +10.000 €
                </button>
                <button
                  type="button"
                  disabled={availableCredit < 50000}
                  onClick={() => {
                    soundCash();
                    apply(borrowMoney(game, 50000));
                  }}
                  className="min-h-11 rounded-xl bg-card border border-line font-medium text-xs hover:border-teal disabled:opacity-40 cursor-pointer transition-colors active:scale-95"
                >
                  +50.000 €
                </button>
                <button
                  type="button"
                  disabled={availableCredit < 200000}
                  onClick={() => {
                    soundCash();
                    apply(borrowMoney(game, 200000));
                  }}
                  className="min-h-11 rounded-xl bg-card border border-line font-medium text-xs hover:border-teal disabled:opacity-40 cursor-pointer transition-colors active:scale-95"
                >
                  +200.000 €
                </button>
              </div>
            </div>

            {/* Repay Actions */}
            {loan > 0 && (
              <div className="mt-4">
                <h4 className="text-xs font-semibold text-mist uppercase mb-2">
                  Rimborsa Debito (Interessi settimanali: {euro(Math.round(loan * ratingInfo.interestRate))})
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    disabled={game.cash < 10000}
                    onClick={() => {
                      soundClick();
                      apply(repayMoney(game, 10000));
                    }}
                    className="min-h-11 rounded-xl bg-card border border-line font-medium text-xs hover:border-amber disabled:opacity-40 cursor-pointer transition-colors active:scale-95"
                  >
                    -10.000 €
                  </button>
                  <button
                    type="button"
                    disabled={game.cash < 50000}
                    onClick={() => {
                      soundClick();
                      apply(repayMoney(game, 50000));
                    }}
                    className="min-h-11 rounded-xl bg-card border border-line font-medium text-xs hover:border-amber disabled:opacity-40 cursor-pointer transition-colors active:scale-95"
                  >
                    -50.000 €
                  </button>
                  <button
                    type="button"
                    disabled={game.cash < 1000}
                    onClick={() => {
                      soundClick();
                      apply(repayMoney(game, loan));
                    }}
                    className="min-h-11 rounded-xl bg-teal text-card font-medium text-xs hover:opacity-90 disabled:opacity-40 cursor-pointer transition-all active:scale-95 shadow-sm"
                  >
                    Estingui Debito
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 3: ROUND AZIONARI & IPO */}
      {subTab === "equity" && (
        <div className="grid gap-3">
          <div className="rounded-3xl border border-line bg-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-mist uppercase tracking-wider">
                  Cap Table & Investitori
                </span>
                <h3 className="font-display text-2xl text-ink">Finanziamenti Equity</h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-mist block">Quota Fondatore</span>
                <span className="font-display text-2xl text-teal">{equityPct}%</span>
              </div>
            </div>
            <p className="mt-2 text-sm text-mist leading-relaxed">
              Cedere quote societarie porta liquidità immediata senza debito né interessi,
              ma diluisce il tuo controllo sul capitale dell'azienda.
              L'IPO sui mercati pubblici consacra Aurelia tra le grandi Big Pharma mondiali.
            </p>
          </div>

          {/* Investment Rounds List */}
          <div className="space-y-2.5">
            {rounds.map((round) => {
              const alreadyTaken = round.completed;
              const meetsBatches = game.stats.batches >= (round.needBatches ?? 0);
              const canTake = !alreadyTaken && meetsBatches;

              return (
                <div
                  key={round.id}
                  className={`rounded-2xl border p-4 transition-all ${
                    alreadyTaken
                      ? "border-teal/30 bg-teal/5 opacity-75"
                      : canTake
                      ? "border-line bg-card hover:border-teal"
                      : "border-line/40 bg-paper/40 opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-lg text-ink">{round.name}</span>
                        {alreadyTaken && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-teal/15 px-2 py-0.5 text-[10px] font-bold text-teal">
                            <CheckCircle2 className="h-3 w-3" /> Completato
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-mist mt-0.5">{round.investor} · {round.blurb}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-display text-base text-teal block">
                        +{euro(round.cashRaised)}
                      </span>
                      <span className="text-[11px] text-amber">
                        -{round.equityPercent}% quote
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-line/40">
                    <span className="text-mist">
                      {round.needBatches ? `Richiede ${round.needBatches} lotti consegnati` : "Nessun prerequisito"}
                    </span>

                    {alreadyTaken ? (
                      <span className="font-medium text-teal text-xs">Capitale incassato</span>
                    ) : (
                      <button
                        type="button"
                        disabled={!canTake}
                        onClick={() => {
                          if (round.id === "ipo") {
                            soundSuccess();
                            fireConfetti();
                          } else {
                            soundCash();
                          }
                          apply(acceptInvestmentRound(game, round.id));
                        }}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                          canTake
                            ? "bg-teal text-card hover:opacity-90 cursor-pointer shadow-sm active:scale-95"
                            : "bg-line text-mist cursor-not-allowed"
                        }`}
                      >
                        {round.id === "ipo" ? "Lancia IPO! 🚀" : "Accetta Round"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 4: RIVALI & MERCATO (M&A) */}
      {subTab === "mna" && (
        <div className="grid gap-3">
          {/* Products & Pricing */}
          <div className="rounded-2xl border border-line bg-card p-4">
            <h3 className="font-display text-lg text-ink mb-1">Listino Farmaci Propri</h3>
            <p className="text-xs text-mist mb-3">
              Modifica il prezzo dei tuoi farmaci per bilanciare margine e volume di mercato.
              I brevetti proteggono i tuoi ricavi: alla scadenza entrano i generici concorrenti.
            </p>
            {game.products.length === 0 ? (
              <p className="text-xs text-mist italic">
                Nessun farmaco ancora approvato sul mercato. Sviluppa un programma clinico nella scheda Ricerca.
              </p>
            ) : (
              <div className="space-y-2">
                {game.products.map((product) => (
                  <div key={product.id} className="rounded-xl border border-line/70 bg-paper/60 p-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-sm text-ink">{product.code} · {product.indication}</p>
                      <p className="text-xs text-mist">
                        Prezzo unitario: {euro(product.price)}
                        {product.patentLeft
                          ? ` · Brevetto attivo (${product.patentLeft} sett. rimaste)`
                          : " · Brevetto scaduto (competizione generici)"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          soundClick();
                          apply(setPrice(game, product.id, product.price - 5));
                        }}
                        className="h-8 px-2.5 rounded-lg border border-line bg-card text-xs font-medium hover:border-teal cursor-pointer active:scale-95 transition-all"
                      >
                        -5 €
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          soundClick();
                          apply(setPrice(game, product.id, product.price + 5));
                        }}
                        className="h-8 px-2.5 rounded-lg border border-line bg-card text-xs font-medium hover:border-teal cursor-pointer active:scale-95 transition-all"
                      >
                        +5 €
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          soundCash();
                          apply(extendPatent(game, product.id));
                        }}
                        className="h-8 px-2.5 rounded-lg bg-teal/10 border border-teal/30 text-teal text-xs font-semibold hover:bg-teal hover:text-card transition-colors cursor-pointer active:scale-95"
                        title="Deposita nuova formulazione: estende il brevetto di 120 settimane (+10 € prezzo, costo: 75.000 € e 3 scienza)"
                      >
                        Nuova Formulazione
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Competitors & M&A */}
          <div className="rounded-2xl border border-line bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display text-lg text-ink">Concorrenti & Acquisizioni (M&A)</h3>
              <span className="text-xs font-semibold text-teal">
                La tua quota: {Math.round(game.playerShare)}%
              </span>
            </div>
            <p className="text-xs text-mist mb-3">
              I rivali investono ed erodono quote. Con una valutazione superiore a 1.5x rispetto a loro,
              puoi lanciare un'acquisizione societaria per incorporarne gli impianti e le quote di mercato.
            </p>

            <div className="space-y-2.5">
              {game.rivals.map((rival) => {
                const estVal = Math.round(rival.share * 1_500_000);
                const cost = Math.round(estVal * 0.45);
                const isAcquired = Boolean((rival as any).acquired);
                const canAcquire = !isAcquired && valInfo.total >= estVal * 1.5 && game.cash >= cost;

                return (
                  <div key={rival.id} className="rounded-xl border border-line bg-paper/50 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-ink">{rival.name}</span>
                          <span className="text-xs font-display text-mist">
                            Quota: {Math.round(rival.share)}%
                          </span>
                          {isAcquired && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-teal/15 px-2 py-0.5 text-[10px] font-bold text-teal">
                              Acquisita
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-mist mt-0.5">{rival.note}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs text-mist block">Valutazione stimata</span>
                        <span className="font-display text-sm text-ink">{euro(estVal)}</span>
                      </div>
                    </div>

                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line">
                      <div
                        className="h-full rounded-full bg-ink"
                        style={{ width: `${Math.min(100, (rival.share / 50) * 100)}%` }}
                      />
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-xs pt-2 border-t border-line/40">
                      <span className="text-mist">
                        {isAcquired
                          ? "Azienda fusa nel gruppo Aurelia"
                          : `Richiede valutazione >= ${euro(Math.round(estVal * 1.5))}`}
                      </span>

                      {!isAcquired && (
                        <button
                          type="button"
                          disabled={!canAcquire}
                          onClick={() => {
                            soundSuccess();
                            fireConfetti();
                            apply(acquireRival(game, rival.id));
                          }}
                          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                            canAcquire
                              ? "bg-amber text-ink hover:opacity-90 cursor-pointer shadow-sm active:scale-95"
                              : "bg-line/60 text-mist cursor-not-allowed"
                          }`}
                        >
                          Acquisisci e Fondi ({euro(cost)})
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 5: TRAGUARDI (ACHIEVEMENTS) */}
      {subTab === "achievements" && (
        <div className="grid gap-3">
          <div className="rounded-3xl border border-line bg-card p-4 md:p-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-mist uppercase tracking-wider">
                  Sala dei Trofei Aziendali
                </span>
                <h3 className="font-display text-2xl text-ink">
                  Traguardi ({unlockedCount} / {ACHIEVEMENTS_LIST.length})
                </h3>
              </div>
              <Trophy className="h-8 w-8 text-amber" />
            </div>
            <p className="mt-1 text-xs text-mist">
              Ogni traguardo raggiunto testimonia l'eccellenza industriale, scientifica e finanziaria della tua CDMO.
            </p>

            {/* Category filter pills */}
            <div className="mt-3 flex gap-1.5 overflow-x-auto no-scrollbar">
              {(["tutti", "produzione", "scienza", "finanza", "qualita", "impero"] as const).map(
                (cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setAchFilter(cat)}
                    className={`min-h-8 shrink-0 rounded-full px-3 text-xs font-medium transition-all ${
                      achFilter === cat
                        ? "bg-ink text-card"
                        : "bg-paper border border-line text-mist hover:text-ink"
                    }`}
                  >
                    {cat === "tutti"
                      ? "Tutti"
                      : cat === "produzione"
                      ? "Produzione"
                      : cat === "scienza"
                      ? "Scienza"
                      : cat === "finanza"
                      ? "Finanza"
                      : cat === "qualita"
                      ? "Qualità"
                      : "Impero"}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Achievement cards list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {ACHIEVEMENTS_LIST.filter(
              (ach) => achFilter === "tutti" || ach.category === achFilter
            ).map((ach) => {
              const unlocked = unlockedAchievements.includes(ach.id);

              return (
                <div
                  key={ach.id}
                  className={`rounded-2xl border p-3.5 transition-all ${
                    unlocked
                      ? "border-amber/40 bg-card shadow-sm"
                      : "border-line/60 bg-paper/50 opacity-60"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="text-2xl shrink-0 mt-0.5">{ach.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-sm text-ink truncate">
                          {ach.title}
                        </span>
                        {unlocked ? (
                          <span className="text-[10px] font-bold text-amber px-2 py-0.5 rounded-full bg-amber/10 shrink-0">
                            Sbloccato
                          </span>
                        ) : (
                          <span className="text-[10px] text-mist shrink-0">
                            In corso
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-mist mt-0.5 leading-snug">
                        {ach.description}
                      </p>
                      {ach.rewardCash && (
                        <p className="text-[11px] text-teal font-medium mt-1">
                          Premio: +{euro(ach.rewardCash)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 6: REGISTRO NOTIZIE & RESET */}
      {subTab === "log" && (
        <div className="grid gap-3">
          <div className="rounded-2xl border border-line bg-card p-4">
            <h3 className="font-display text-lg text-ink mb-2">Registro Storico delle Notizie</h3>
            <ul className="grid gap-2">
              {game.log.slice(0, 24).map((item, index) => (
                <li key={index} className="text-xs md:text-sm leading-snug py-1 border-b border-line/30 last:border-0">
                  <span className="font-semibold text-mist">s.{item.week} · </span>
                  <span className="text-ink">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-line bg-card p-4 text-center">
            <p className="text-xs text-mist mb-2">
              Vuoi fondare una nuova azienda da zero? Cancellerà tutti i dati di questa sessione.
            </p>
            <button
              type="button"
              className="min-h-11 px-5 rounded-full border border-line text-xs font-semibold text-mist hover:text-red-600 hover:border-red-400"
              onClick={reset}
            >
              {armReset ? "Conferma: azzera e fonda una nuova azienda" : "Ricomincia da capo"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SubTabBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        soundClick();
        onClick();
      }}
      className={`min-h-10 shrink-0 flex items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition-all cursor-pointer ${
        active
          ? "bg-ink text-card shadow-sm scale-[1.02]"
          : "bg-card border border-line text-mist hover:text-ink hover:border-teal/40"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
