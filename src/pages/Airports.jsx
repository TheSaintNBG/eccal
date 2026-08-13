import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Search, Loader2, Plane, ArrowLeft, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import AirportMap from "@/components/AirportMap";
import AppNav from "@/components/AppNav";

export default function Airports() {
  const [airports, setAirports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        // SDK liefert max. 5000 pro Aufruf -> Cursor-Paginierung über icao
        const LIMIT = 5000;
        let all = [];
        let cursor = null;
        for (let i = 0; i < 5; i++) {
          const batch =
            cursor === null
              ? await base44.entities.Airport.list("-icao", LIMIT)
              : await base44.entities.Airport.filter({ icao: { $lt: cursor } }, "-icao", LIMIT);
          all = all.concat(batch);
          if (batch.length < LIMIT) break;
          cursor = batch[batch.length - 1].icao;
        }
        setAirports(all);
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const q = search.trim().toLowerCase();
  const filtered = q
    ? airports.filter((a) =>
        [a.icao, a.iata, a.name, a.city, a.country]
          .filter(Boolean)
          .some((v) => v.toLowerCase().includes(q))
      )
    : airports;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
      <AppNav
        title="Flughäfen der Welt"
        subtitle="Quelle: Global Airport Database"
        icon={Plane}
        accent="from-sky-500 to-cyan-500"
      />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Globe className="w-4 h-4 text-sky-500" />
                Flughäfen
              </h2>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 rounded-full px-3 py-1">
                {filtered.length} / {airports.length}
              </span>
            </div>
            <div className="relative mb-4">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Suche ICAO, IATA, Name, Stadt oder Land"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-slate-50 border-slate-200"
              />
            </div>
            <div className="max-h-[520px] overflow-y-auto rounded-lg border border-slate-200">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-sky-500 animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400">
                  Keine Flughäfen gefunden.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-3 py-2.5 font-medium">ICAO</th>
                      <th className="px-3 py-2.5 font-medium">IATA</th>
                      <th className="px-3 py-2.5 font-medium">Name</th>
                      <th className="px-3 py-2.5 font-medium">Land</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.slice(0, 500).map((a) => (
                      <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-3 py-2 font-mono font-medium text-slate-800">{a.icao}</td>
                        <td className="px-3 py-2 font-mono text-slate-500">{a.iata || "—"}</td>
                        <td className="px-3 py-2 text-slate-700 truncate max-w-[180px]">{a.name}</td>
                        <td className="px-3 py-2 text-slate-500 truncate max-w-[120px]">{a.country}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-4">
              <Plane className="w-4 h-4 text-sky-500" />
              Kartenansicht
            </h2>
            <AirportMap airports={filtered} />
            <p className="text-xs text-slate-400 mt-3">
              Es werden maximal 300 Marker angezeigt. Verfeinere die Suche, um bestimmte Regionen zu sehen.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}