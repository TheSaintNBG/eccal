import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Search, Loader2, Navigation, Database, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import WaypointMap from "@/components/WaypointMap";
import WaypointImporter from "@/components/WaypointImporter";
import AppNav from "@/components/AppNav";

export default function Waypoints() {
  const [waypoints, setWaypoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const LIMIT = 5000;
      let all = [];
      let cursor = null;
      for (let i = 0; i < 20; i++) {
        const batch =
          cursor === null
            ? await base44.entities.Waypoint.list("-ident", LIMIT)
            : await base44.entities.Waypoint.filter({ ident: { $lt: cursor } }, "-ident", LIMIT);
        all = all.concat(batch);
        if (batch.length < LIMIT) break;
        cursor = batch[batch.length - 1].ident;
      }
      setWaypoints(all);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const q = search.trim().toLowerCase();
  const filtered = q
    ? waypoints.filter((w) => w.ident && w.ident.toLowerCase().includes(q))
    : waypoints;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <AppNav
        title="Wegpunkte Deutschland"
        subtitle="Quelle: opennav.com/waypoint/DE"
        icon={Navigation}
        accent="from-rose-500 to-pink-500"
      />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <WaypointImporter onDone={load} />

        <div className="grid lg:grid-cols-2 gap-8 mt-6">
          {/* Tabelle + Suche */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Database className="w-4 h-4 text-rose-500" />
                Wegpunkte
              </h2>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 rounded-full px-3 py-1">
                {filtered.length} / {waypoints.length}
              </span>
            </div>
            <div className="relative mb-4">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Ident suchen (z.B. ABAMI)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-slate-50 border-slate-200"
              />
            </div>
            <div className="max-h-[520px] overflow-y-auto rounded-lg border border-slate-200">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400">
                  Keine Wegpunkte gefunden.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-2.5 font-medium">Ident</th>
                      <th className="px-4 py-2.5 font-medium">Lat</th>
                      <th className="px-4 py-2.5 font-medium">Lng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.slice(0, 500).map((w) => (
                      <tr key={w.id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-2 font-mono font-medium text-slate-800">{w.ident}</td>
                        <td className="px-4 py-2 text-slate-600 tabular-nums">{w.latitude.toFixed(4)}</td>
                        <td className="px-4 py-2 text-slate-600 tabular-nums">{w.longitude.toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Karte */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-4">
              <Navigation className="w-4 h-4 text-rose-500" />
              Kartenansicht
            </h2>
            <WaypointMap waypoints={filtered} />
            <p className="text-xs text-slate-400 mt-3">
              Es werden maximal 300 Marker angezeigt. Verfeinere die Suche, um bestimmte Regionen zu sehen.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}