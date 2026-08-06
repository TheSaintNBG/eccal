import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { PlaneTakeoff, Loader2, ChevronDown } from "lucide-react";

export default function AircraftSelector({ value, onChange }) {
  const [aircraft, setAircraft] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await base44.entities.Aircraft.list();
        setAircraft(data);
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        className="w-full flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-left hover:bg-white transition-colors disabled:opacity-50"
      >
        <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
          <PlaneTakeoff className="w-4 h-4" />
        </span>
        <div className="min-w-0 flex-1">
          {loading ? (
            <span className="text-sm text-slate-400">Flugzeuge werden geladen…</span>
          ) : value ? (
            <>
              <span className="font-mono text-sm font-medium text-slate-800">
                {value.registration}
              </span>
              {value.type ? (
                <span className="text-xs text-slate-500 ml-2">{value.type}</span>
              ) : null}
              {value.mtow_tonnes != null ? (
                <span className="text-xs text-slate-400 ml-2">
                  · {value.mtow_tonnes} t · Faktor {Math.sqrt(value.mtow_tonnes / 50).toFixed(3)}
                </span>
              ) : null}
            </>
          ) : (
            <span className="text-sm text-slate-400">Flugzeug auswählen…</span>
          )}
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
      </button>

      {open && !loading && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
          <button
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            className="w-full text-left px-3 py-2 hover:bg-slate-50 border-b border-slate-100 text-sm text-slate-500"
          >
            Kein Flugzeug
          </button>
          {aircraft.length === 0 ? (
            <div className="px-3 py-3 text-sm text-slate-400 text-center">
              Keine Flugzeuge gespeichert.
            </div>
          ) : (
            aircraft.map((a) => (
              <button
                key={a.id}
                onClick={() => {
                  onChange(a);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-0 flex items-center gap-2"
              >
                <span className="font-mono text-sm font-medium text-slate-800">
                  {a.registration}
                </span>
                {a.type ? (
                  <span className="text-xs text-slate-500">{a.type}</span>
                ) : null}
                {a.mtow_tonnes != null ? (
                  <span className="text-xs text-slate-400 ml-auto">
                    {a.mtow_tonnes} t · √(MTOW/50) {Math.sqrt(a.mtow_tonnes / 50).toFixed(3)}
                  </span>
                ) : null}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}