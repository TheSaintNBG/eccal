import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Route as RouteIcon,
  Plus,
  X,
  ChevronUp,
  ChevronDown,
  Search,
  Loader2,
  Plane,
  Navigation,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import FlightPlanMap from "@/components/FlightPlanMap";
import FlightPlanSaver from "@/components/FlightPlanSaver";
import RouteChargeCalculator from "@/components/RouteChargeCalculator";
import AircraftSelector from "@/components/AircraftSelector";
import { useAviationData } from "@/hooks/useAviationData";

// Großkreis-Entfernung (Haversine) in km
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export default function FlightPlan() {
  const { airports, waypoints, loading } = useAviationData();
  const [stops, setStops] = useState([]);
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [aircraft, setAircraft] = useState(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const am = airports
      .filter((a) =>
        [a.icao, a.iata, a.name, a.city]
          .filter(Boolean)
          .some((v) => v.toLowerCase().includes(q))
      )
      .slice(0, 12)
      .map((a) => ({
        type: "airport",
        id: a.id,
        code: a.icao,
        sub: a.iata || "",
        name: a.name,
        country: a.country,
        lat: a.latitude,
        lng: a.longitude,
      }));
    const wm = waypoints
      .filter((w) => w.ident && w.ident.toLowerCase().includes(q))
      .slice(0, 8)
      .map((w) => ({
        type: "waypoint",
        id: w.id,
        code: w.ident,
        sub: "",
        name: "Wegpunkt",
        country: "",
        lat: w.latitude,
        lng: w.longitude,
      }));
    return [...am, ...wm];
  }, [query, airports, waypoints]);

  const addStop = (m) => {
    setStops((prev) => [
      ...prev,
      { ...m, key: Math.random().toString(36).slice(2) },
    ]);
    setQuery("");
    setShowDropdown(false);
  };

  const removeStop = (key) =>
    setStops((prev) => prev.filter((s) => s.key !== key));

  const move = (idx, dir) => {
    setStops((prev) => {
      const j = idx + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  };

  const role = (i) =>
    i === 0 ? "Start" : i === stops.length - 1 ? "Ziel" : "Wegpunkt";

  const legs = [];
  let total = 0;
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    let km = null;
    if (a.lat != null && a.lng != null && b.lat != null && b.lng != null) {
      km = haversineKm(a.lat, a.lng, b.lat, b.lng);
      total += km;
    }
    legs.push({ i, from: a, to: b, km });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-rose-50">
      <header className="border-b border-slate-200/60 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link
            to="/"
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <RouteIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-slate-900">
              Flugplan
            </h1>
            <p className="text-xs text-slate-500">
              Start, Wegpunkte & Ziel – Entfernungen in km
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Linke Spalte: Eingabe + Liste + Entfernungen */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-4">
              <Plus className="w-4 h-4 text-rose-500" />
              Station hinzufügen
            </h2>

            <div className="relative mb-4">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Flughafen oder Wegpunkt (ICAO, IATA, Name)…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                className="pl-9 pr-9 bg-slate-50 border-slate-200"
                disabled={loading}
              />
              {loading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                </div>
              )}
              {showDropdown && matches.length > 0 && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
                  {matches.map((m) => (
                    <button
                      key={m.type + m.id}
                      onClick={() => addStop(m)}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-0 flex items-center gap-2"
                    >
                      <span
                        className={`w-7 h-7 rounded flex items-center justify-center shrink-0 ${
                          m.type === "airport"
                            ? "bg-sky-100 text-sky-600"
                            : "bg-rose-100 text-rose-600"
                        }`}
                      >
                        {m.type === "airport" ? (
                          <Plane className="w-3.5 h-3.5" />
                        ) : (
                          <Navigation className="w-3.5 h-3.5" />
                        )}
                      </span>
                      <span className="font-mono text-sm text-slate-800">
                        {m.code}
                      </span>
                      {m.sub && (
                        <span className="text-xs text-slate-400">({m.sub})</span>
                      )}
                      <span className="text-sm text-slate-500 truncate">
                        {m.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              {stops.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">
                  Noch keine Stationen. Füge Start, Wegpunkte und Ziel hinzu.
                </p>
              ) : (
                <ul className="space-y-2">
                  {stops.map((s, i) => (
                    <li
                      key={s.key}
                      className="flex items-center gap-3 rounded-lg border border-slate-200 p-2.5"
                    >
                      <span className="w-6 text-center font-semibold text-slate-400">
                        {i + 1}
                      </span>
                      <div
                        className={`w-2 h-8 rounded-full ${
                          i === 0
                            ? "bg-green-500"
                            : i === stops.length - 1
                            ? "bg-red-500"
                            : "bg-sky-400"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium text-slate-800">
                            {s.code}
                          </span>
                          <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                            {role(i)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">
                          {s.name}
                          {s.country ? ` · ${s.country}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => move(i, -1)}
                          className="w-7 h-7 rounded hover:bg-slate-100 flex items-center justify-center"
                          title="Nach oben"
                        >
                          <ChevronUp className="w-4 h-4 text-slate-500" />
                        </button>
                        <button
                          onClick={() => move(i, 1)}
                          className="w-7 h-7 rounded hover:bg-slate-100 flex items-center justify-center"
                          title="Nach unten"
                        >
                          <ChevronDown className="w-4 h-4 text-slate-500" />
                        </button>
                        <button
                          onClick={() => removeStop(s.key)}
                          className="w-7 h-7 rounded hover:bg-rose-50 flex items-center justify-center"
                          title="Entfernen"
                        >
                          <X className="w-4 h-4 text-rose-500" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {legs.length > 0 && (
              <div className="mt-5 pt-4 border-t border-slate-200">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Abschnitte
                </h3>
                <div className="space-y-1.5 mb-3">
                  {legs.map((l) => (
                    <div
                      key={l.i}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-slate-600 font-mono">
                        {l.from.code} → {l.to.code}
                      </span>
                      <span className="font-medium text-slate-800 tabular-nums">
                        {l.km != null ? `${l.km.toFixed(1)} km` : "—"}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-900 px-4 py-3">
                  <span className="text-sm font-medium text-white/80">
                    Gesamtstrecke
                  </span>
                  <span className="text-xl font-bold text-white tabular-nums">
                    {total.toFixed(1)} km
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Rechte Spalte: Karte */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-4">
              <RouteIcon className="w-4 h-4 text-rose-500" />
              Route
            </h2>
            <FlightPlanMap stops={stops} />
            <p className="text-xs text-slate-400 mt-3">
              Grün = Start, Blau = Wegpunkt, Rot = Ziel. Entfernungen als
              Großkreis (Haversine).
            </p>

            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mt-6 mb-3">
              <Plane className="w-4 h-4 text-indigo-500" />
              Flugzeug
            </h2>
            <AircraftSelector value={aircraft} onChange={setAircraft} />
          </div>
        </div>

        <RouteChargeCalculator stops={stops} aircraft={aircraft} />

        <FlightPlanSaver
          stops={stops}
          total={total}
          aircraft={aircraft}
          onLoad={(loadedStops, loadedAircraft) => {
            setStops(loadedStops);
            setAircraft(loadedAircraft);
          }}
        />
      </main>
    </div>
  );
}