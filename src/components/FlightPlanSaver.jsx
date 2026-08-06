import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Save, FolderOpen, Trash2, Loader2, Route as RouteIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function FlightPlanSaver({ stops, total, aircraft, onLoad }) {
  const [name, setName] = useState("");
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.SavedFlightPlan.list("-created_date", 100);
      setPlans(data);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const canSave = stops.length >= 2 && !saving;

  const save = async () => {
    if (!canSave) return;
    const n = name.trim() || `Plan ${new Date().toLocaleString("de-DE")}`;
    setSaving(true);
    try {
      await base44.entities.SavedFlightPlan.create({
        name: n,
        total_km: Math.round(total * 10) / 10,
        stop_count: stops.length,
        aircraft_id: aircraft?.id || "",
        aircraft_registration: aircraft?.registration || "",
        aircraft_mtow_tonnes: aircraft?.mtow_tonnes ?? null,
        stops: stops.map((s) => ({
          type: s.type,
          code: s.code,
          sub: s.sub,
          name: s.name,
          country: s.country,
          lat: s.lat,
          lng: s.lng,
        })),
      });
      setName("");
      await load();
    } catch (e) {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const open = (plan) => {
    const loadedStops = (plan.stops || []).map((s) => ({
      ...s,
      key: Math.random().toString(36).slice(2),
    }));
    const loadedAircraft =
      plan.aircraft_registration
        ? {
            id: plan.aircraft_id || null,
            registration: plan.aircraft_registration,
            mtow_tonnes: plan.aircraft_mtow_tonnes ?? null,
          }
        : null;
    onLoad(loadedStops, loadedAircraft);
  };

  const remove = async (id) => {
    try {
      await base44.entities.SavedFlightPlan.delete(id);
      await load();
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-4">
        <Save className="w-4 h-4 text-rose-500" />
        Plan speichern & laden
      </h2>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <Input
          placeholder="Name für diesen Flugplan…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-slate-50 border-slate-200"
        />
        <Button
          onClick={save}
          disabled={!canSave}
          className="bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white whitespace-nowrap"
        >
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Speichern
        </Button>
      </div>
      {stops.length < 2 && (
        <p className="text-xs text-slate-400 -mt-3 mb-4">
          Mindestens 2 Stationen nötig, um zu speichern.
        </p>
      )}

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Gespeicherte Pläne
        </h3>
        <span className="text-xs font-medium text-slate-500 bg-slate-100 rounded-full px-3 py-1">
          {plans.length}
        </span>
      </div>

      <div className="rounded-lg border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
          </div>
        ) : plans.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-400">
            Noch keine Flugpläne gespeichert.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {plans.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50">
                <RouteIcon className="w-4 h-4 text-rose-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 truncate">{p.name}</p>
                  <p className="text-xs text-slate-500">
                    {p.stop_count ?? (p.stops?.length || 0)} Stationen
                    {p.total_km != null ? ` · ${p.total_km.toFixed(1)} km` : ""}
                    {p.aircraft_registration ? ` · ${p.aircraft_registration}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => open(p)}
                  className="w-8 h-8 rounded hover:bg-slate-100 inline-flex items-center justify-center"
                  title="Laden"
                >
                  <FolderOpen className="w-4 h-4 text-slate-500" />
                </button>
                <button
                  onClick={() => remove(p.id)}
                  className="w-8 h-8 rounded hover:bg-rose-50 inline-flex items-center justify-center"
                  title="Löschen"
                >
                  <Trash2 className="w-4 h-4 text-rose-500" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}