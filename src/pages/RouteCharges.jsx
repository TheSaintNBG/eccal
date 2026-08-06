import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { ArrowLeft, Coins, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function RouteCharges() {
  const [charges, setCharges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await base44.entities.RouteCharge.list("-national_unit_rate_eur", 200);
        setCharges(data);
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const q = search.trim().toLowerCase();
  const filtered = q
    ? charges.filter((c) =>
        [c.zone, c.zone_label, c.currency_code, c.valid_month]
          .filter(Boolean)
          .some((v) => v.toLowerCase().includes(q))
      )
    : charges;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50">
      <header className="border-b border-slate-200/60 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link
            to="/"
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Coins className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-slate-900">
              Streckengebühren
            </h1>
            <p className="text-xs text-slate-500">
              EUROCONTROL Route Charges · August 2026
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-500" />
              Zonen
            </h2>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 rounded-full px-3 py-1">
              {filtered.length} / {charges.length}
            </span>
          </div>

          <div className="relative mb-4">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Zone, Währung oder Monat suchen…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-slate-50 border-slate-200"
            />
          </div>

          <div className="max-h-[600px] overflow-auto rounded-lg border border-slate-200">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">
                Keine Einträge gefunden.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0">
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-2.5 font-medium">Zone</th>
                    <th className="px-3 py-2.5 font-medium text-right">National (EUR)</th>
                    <th className="px-3 py-2.5 font-medium text-right">Global (EUR)</th>
                    <th className="px-3 py-2.5 font-medium">Währung</th>
                    <th className="px-3 py-2.5 font-medium text-right">Kurs</th>
                    <th className="px-3 py-2.5 font-medium">Monat</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-3 py-2 text-slate-800">
                        <div className="font-medium">{c.zone}</div>
                        {c.zone_label && c.zone_label !== c.zone && (
                          <div className="text-xs text-slate-400 truncate max-w-[220px]">
                            {c.zone_label}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-slate-800 tabular-nums">
                        {c.national_unit_rate_eur?.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-slate-600 tabular-nums">
                        {c.global_unit_rate_eur?.toFixed(2)}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {c.currency_code || "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-slate-500 tabular-nums">
                        {c.exchange_rate != null ? c.exchange_rate.toFixed(4) : "—"}
                      </td>
                      <td className="px-3 py-2 text-slate-500 font-mono">
                        {c.valid_month || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}