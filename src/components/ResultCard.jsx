import React from "react";
import { Loader2, MapPin, Building2, Map as MapIcon, Globe2, Waves } from "lucide-react";

function CountryFlag({ countryCode }) {
  if (!countryCode || countryCode.length !== 2) return null;
  const code = countryCode.toUpperCase();
  return (
    <img
      src={`https://flagcdn.com/w160/${code.toLowerCase()}.png`}
      alt={`Flagge ${code}`}
      className="w-20 h-14 object-cover rounded-lg shadow-md border border-white/30"
      onError={(e) => { e.currentTarget.style.display = "none"; }}
    />
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-white/10 last:border-0">
      <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-white/70" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-white/50 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-white truncate">{value || "—"}</p>
      </div>
    </div>
  );
}

export default function ResultCard({ result, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm h-full min-h-[400px] flex flex-col items-center justify-center gap-4 p-8">
        <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
        <p className="text-sm text-slate-500">Land wird ermittelt…</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm h-full min-h-[400px] flex flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
          <MapPin className="w-7 h-7 text-slate-300" />
        </div>
        <p className="text-sm text-slate-400 max-w-xs">
          Gib Koordinaten ein oder klicke auf die Karte, um das zugehörige Land zu bestimmen.
        </p>
      </div>
    );
  }

  const inOcean = result.in_ocean;
  const gradient = inOcean
    ? "from-blue-600 to-cyan-500"
    : "from-slate-800 to-slate-600";

  return (
    <div className={`rounded-2xl shadow-xl overflow-hidden bg-gradient-to-br ${gradient}`}>
      <div className="p-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs text-white/60 uppercase tracking-wider mb-1">
            {inOcean ? "Gewässer" : "Ergebnis"}
          </p>
          <h3 className="text-3xl font-bold text-white tracking-tight">
            {inOcean ? "Offenes Meer" : result.country}
          </h3>
          {result.country_code && !inOcean && (
            <span className="inline-block mt-2 text-xs font-mono text-white/80 bg-white/10 rounded px-2 py-1">
              {result.country_code}
            </span>
          )}
        </div>
        {!inOcean && <CountryFlag countryCode={result.country_code} />}
      </div>

      <div className="bg-black/20 backdrop-blur-sm px-6 py-2">
        <InfoRow icon={MapPin} label="Stadt" value={result.city} />
        <InfoRow icon={MapIcon} label="Region" value={result.region} />
        <InfoRow icon={Globe2} label="Kontinent" value={result.continent} />
        {inOcean && <InfoRow icon={Waves} label="Hinweis" value="Diese Koordinate liegt im Meer / Ozean." />}
      </div>
    </div>
  );
}