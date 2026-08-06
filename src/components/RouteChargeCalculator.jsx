import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Coins, Loader2, Calculator, MapPin, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

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

// Lineare Interpolation entlang der Strecke
function interpolate(from, to, count) {
  const pts = [];
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    pts.push({
      lat: from.lat + (to.lat - from.lat) * t,
      lng: from.lng + (to.lng - from.lng) * t,
    });
  }
  return pts;
}

export default function RouteChargeCalculator({ stops, aircraft }) {
  const [charges, setCharges] = useState([]);
  const [zones, setZones] = useState({});
  const [loadingData, setLoadingData] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await base44.entities.RouteCharge.list();
        const map = {};
        data.forEach((r) => {
          if (r.zone) map[r.zone.trim()] = r.national_unit_rate_eur;
        });
        setZones(map);
      } catch (e) {
        // ignore
      } finally {
        setLoadingData(false);
      }
    })();
  }, []);

  const weightFactor =
    aircraft && aircraft.mtow_tonnes != null
      ? Math.sqrt(aircraft.mtow_tonnes / 50)
      : null;

  // gültige Abschnitte
  const legs = [];
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    if (a.lat != null && a.lng != null && b.lat != null && b.lng != null) {
      legs.push({ i, from: a, to: b, km: haversineKm(a.lat, a.lng, b.lat, b.lng) });
    }
  }

  const calculate = async () => {
    setError("");
    setCharges([]);
    if (!weightFactor) {
      setError("Bitte zuerst ein Flugzeug auswählen (für den Gewichtsfaktor).");
      return;
    }
    if (legs.length === 0) {
      setError("Mindestens zwei Stationen mit Koordinaten nötig.");
      return;
    }
    setCalculating(true);
    try {
      // Pro Abschnitt Stichproben erzeugen
      const legSamples = legs.map((l) => {
        const count = Math.min(40, Math.max(2, Math.ceil(l.km / 40)));
        return interpolate(l.from, l.to, count);
      });
      const flat = [];
      legSamples.forEach((s, li) =>
        s.forEach((p, si) => flat.push({ leg: li, si, ...p }))
      );

      const zoneNames = Object.keys(zones);
      const coordList = flat
        .map((p, idx) => `${idx + 1}. ${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`)
        .join("\n");

      const prompt = `Für jeden der folgenden geografischen Punkte (Breitengrad, Längengrad) bestimme das Land, in dem er liegt. Verwende AUSSCHLIESSLICH einen dieser Zonennamen, falls er passt: ${zoneNames.join(
        ", "
      )}. Wenn der Punkt in keinem dieser Länder liegt oder über See liegt, antworte mit einem leeren String. Gib die Zonen in exakt der gleichen Reihenfolge zurück.\n\nPunkte:\n${coordList}`;

      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            results: {
              type: "array",
              items: { type: "object", properties: { zone: { type: "string" } } },
            },
          },
        },
      });

      const resultZones = (res?.results || []).map((r) =>
        (r?.zone || "").trim()
      );

      // pro Abschnitt auswerten
      const perLeg = legSamples.map((samples, li) => {
        const sz = samples.map((_, si) => resultZones[flat.findIndex((f) => f.leg === li && f.si === si)] || "");
        // Gruppen gleicher Zone bilden
        const groups = [];
        let cur = null;
        sz.forEach((z, idx) => {
          if (!cur || cur.zone !== z) {
            cur = { zone: z, points: [samples[idx]] };
            groups.push(cur);
          } else {
            cur.points.push(samples[idx]);
          }
        });
        // pro Gruppe Distanz + Gebühr
        const segs = [];
        groups.forEach((g) => {
          let dist = 0;
          for (let k = 1; k < g.points.length; k++) {
            dist += haversineKm(
              g.points[k - 1].lat,
              g.points[k - 1].lng,
              g.points[k].lat,
              g.points[k].lng
            );
          }
          const rate = g.zone ? zones[g.zone] ?? 0 : 0;
          const charge = weightFactor * (dist / 100) * rate;
          segs.push({ zone: g.zone, km: dist, rate, charge });
        });
        // Grenzübertritte = erster Punkt jeder Folgegruppe
        const crossings = [];
        for (let k = 1; k < groups.length; k++) {
          crossings.push({
            from: groups[k - 1].zone || "—",
            to: groups[k].zone || "—",
            lat: groups[k].points[0].lat,
            lng: groups[k].points[0].lng,
          });
        }
        const legTotal = segs.reduce((s, x) => s + x.charge, 0);
        const legChargeable = segs.filter((s) => s.zone);
        return { leg: li, from: legs[li].from.code, to: legs[li].to.code, segs: legChargeable, crossings, legTotal };
      });

      setCharges(perLeg);
    } catch (e) {
      setError("Berechnung fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setCalculating(false);
    }
  };

  const grandTotal = charges.reduce((s, l) => s + l.legTotal, 0);
  const hasResult = charges.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-4">
        <Coins className="w-4 h-4 text-amber-500" />
        Streckengebühr berechnen
      </h2>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Button
          onClick={calculate}
          disabled={calculating || loadingData}
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
        >
          {calculating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Calculator className="w-4 h-4 mr-2" />
          )}
          Berechnen
        </Button>
        {weightFactor != null && (
          <span className="text-xs text-slate-500 bg-slate-100 rounded-full px-3 py-1">
            Gewichtsfaktor {weightFactor.toFixed(3)} · {aircraft.registration}
          </span>
        )}
      </div>

      {error && (
        <p className="text-sm text-rose-600 mb-4 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </p>
      )}

      {!hasResult && !error && (
        <p className="text-xs text-slate-400">
          Formel: Gebühr = Gewichtsfaktor × (Strecke/100) × Landessatz. Grenzübertritte
          werden pro Abschnitt ermittelt.
        </p>
      )}

      {hasResult && (
        <div className="space-y-4">
          {charges.map((l) => (
            <div key={l.leg} className="rounded-lg border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-3 py-2 flex items-center justify-between">
                <span className="font-mono text-sm font-medium text-slate-800">
                  {l.from} → {l.to}
                </span>
                <span className="text-sm font-semibold text-amber-600 tabular-nums">
                  {l.legTotal.toFixed(2)} €
                </span>
              </div>
              {l.segs.length === 0 ? (
                <p className="px-3 py-2 text-xs text-slate-400">
                  Keine Gebührenzone auf diesem Abschnitt.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-400 border-b border-slate-100">
                      <th className="px-3 py-1.5 text-left font-medium">Land</th>
                      <th className="px-3 py-1.5 text-right font-medium">km</th>
                      <th className="px-3 py-1.5 text-right font-medium">Satz (€)</th>
                      <th className="px-3 py-1.5 text-right font-medium">Gebühr (€)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {l.segs.map((s, idx) => (
                      <tr key={idx} className="border-b border-slate-50 last:border-0">
                        <td className="px-3 py-1.5 text-slate-700">{s.zone}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums text-slate-600">
                          {s.km.toFixed(1)}
                        </td>
                        <td className="px-3 py-1.5 text-right tabular-nums text-slate-600">
                          {s.rate.toFixed(2)}
                        </td>
                        <td className="px-3 py-1.5 text-right tabular-nums font-medium text-slate-800">
                          {s.charge.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {l.crossings.length > 0 && (
                <div className="px-3 py-2 bg-slate-50/50 border-t border-slate-100 flex flex-wrap gap-2">
                  {l.crossings.map((c, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 text-xs text-slate-500 bg-white border border-slate-200 rounded-full px-2 py-1"
                      title={`${c.lat.toFixed(4)}, ${c.lng.toFixed(4)}`}
                    >
                      <MapPin className="w-3 h-3 text-rose-400" />
                      {c.from} → {c.to} ({c.lat.toFixed(3)}, {c.lng.toFixed(3)})
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className="flex items-center justify-between rounded-lg bg-amber-500 px-4 py-3">
            <span className="text-sm font-medium text-white/90">Gesamte Streckengebühr</span>
            <span className="text-xl font-bold text-white tabular-nums">
              {grandTotal.toFixed(2)} €
            </span>
          </div>
        </div>
      )}
    </div>
  );
}