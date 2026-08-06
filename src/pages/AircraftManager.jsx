import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { ArrowLeft, Plane, Plus, Trash2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function AircraftManager() {
  const [aircraft, setAircraft] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reg, setReg] = useState("");
  const [type, setType] = useState("");
  const [mtow, setMtow] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Aircraft.list("-created_date", 200);
      setAircraft(data);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addAircraft = async () => {
    setError("");
    const regTrim = reg.trim();
    const mtowNum = parseFloat(mtow);
    if (!regTrim) {
      setError("Bitte ein Kennzeichen eingeben.");
      return;
    }
    if (isNaN(mtowNum) || mtowNum <= 0) {
      setError("Bitte ein gültiges MTOW (Tonnen) eingeben.");
      return;
    }
    setSaving(true);
    try {
      await base44.entities.Aircraft.create({
        registration: regTrim.toUpperCase(),
        type: type.trim() || undefined,
        mtow_tonnes: mtowNum,
      });
      setReg("");
      setType("");
      setMtow("");
      await load();
    } catch (e) {
      setError("Speichern fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    try {
      await base44.entities.Aircraft.delete(id);
      await load();
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <header className="border-b border-slate-200/60 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link
            to="/"
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Plane className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-slate-900">
              Flugzeuge
            </h1>
            <p className="text-xs text-slate-500">Kennzeichen & MTOW (Tonnen)</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Eingabeformular */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-4">
              <Plus className="w-4 h-4 text-indigo-500" />
              Flugzeug hinzufügen
            </h2>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="reg" className="text-xs text-slate-500">
                  Kennzeichen
                </Label>
                <Input
                  id="reg"
                  placeholder="z.B. D-ABCD"
                  value={reg}
                  onChange={(e) => setReg(e.target.value)}
                  className="bg-slate-50 border-slate-200 font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="type" className="text-xs text-slate-500">
                  Typ (optional)
                </Label>
                <Input
                  id="type"
                  placeholder="z.B. A320, B738"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="bg-slate-50 border-slate-200"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mtow" className="text-xs text-slate-500">
                  MTOW (Tonnen)
                </Label>
                <Input
                  id="mtow"
                  type="number"
                  step="any"
                  placeholder="z.B. 78.0"
                  value={mtow}
                  onChange={(e) => setMtow(e.target.value)}
                  className="bg-slate-50 border-slate-200"
                />
              </div>
              {error && (
                <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
              <Button
                onClick={addAircraft}
                disabled={saving}
                className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Speichern
              </Button>
            </div>
          </div>

          {/* Liste */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Plane className="w-4 h-4 text-indigo-500" />
                Flugzeugliste
              </h2>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 rounded-full px-3 py-1">
                {aircraft.length}
              </span>
            </div>
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                </div>
              ) : aircraft.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400">
                  Noch keine Flugzeuge angelegt.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-3 py-2.5 font-medium">Kennzeichen</th>
                      <th className="px-3 py-2.5 font-medium">Typ</th>
                      <th className="px-3 py-2.5 font-medium text-right">MTOW (t)</th>
                      <th className="px-3 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {aircraft.map((a) => (
                      <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-3 py-2 font-mono font-medium text-slate-800">
                          {a.registration}
                        </td>
                        <td className="px-3 py-2 text-slate-500">{a.type || "—"}</td>
                        <td className="px-3 py-2 text-right font-mono text-slate-800 tabular-nums">
                          {a.mtow_tonnes}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            onClick={() => remove(a.id)}
                            className="w-7 h-7 rounded hover:bg-rose-50 inline-flex items-center justify-center"
                            title="Löschen"
                          >
                            <Trash2 className="w-4 h-4 text-rose-500" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}