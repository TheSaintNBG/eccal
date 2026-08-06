import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Upload,
  Loader2,
  FileText,
  CheckCircle2,
  AlertCircle,
  Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FlightPlanUpload({ onImport }) {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);

  const handleFile = (e) => {
    setPreview(null);
    setError("");
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      setError("Bitte eine PDF-Datei wählen.");
      setFile(null);
      return;
    }
    setFile(f);
  };

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setError("");
    setPreview(null);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            waypoints: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  ident: {
                    type: "string",
                    description: "Wegpunkt-Identifikator (z.B. ANSAD)",
                  },
                  latitude: {
                    type: "string",
                    description:
                      "Breitengrad genau wie im PDF angegeben (z.B. N5234.5 oder 52.575)",
                  },
                  longitude: {
                    type: "string",
                    description:
                      "Längengrad genau wie im PDF angegeben (z.B. E00956.7 oder 9.945)",
                  },
                  line: {
                    type: "string",
                    description:
                      "Vollständige Textzeile dieses Wegpunkteintrags inkl. aller Koordinaten",
                  },
                },
              },
            },
          },
        },
      });

      const out = extracted?.output;
      const rawList =
        (out && out.waypoints) || (Array.isArray(out) ? out : []) || [];

      if (!rawList.length) {
        setError("Im PDF wurden keine Wegpunkte gefunden (Abschnitt WAYPOINT).");
        return;
      }

      const lines = rawList
        .map(
          (w, i) =>
            `${i + 1}. IDENT=${w.ident || ""} LAT=${w.latitude || ""} LON=${
              w.longitude || ""
            } LINE=${w.line || ""}`
        )
        .join("\n");

      const parsed = await base44.integrations.Core.InvokeLLM({
        prompt: `Aus einem Flugplan sind Wegpunkte aus dem Abschnitt WAYPOINT aufgelistet. Jeder Eintrag enthält IDENT, ggf. LAT/LON und die vollständige Zeile (LINE). Wandle die Koordinaten in Dezimalgrad um. Typische Flugplan-Formate: N5234.5 = 52°34.5' = 52.575, E00956.7 = 9°56.7' = 9.945. N/S = +/- Breitengrad, E/W = +/- Längengrad. Nutze LAT/LON, falls vorhanden, sonst parse aus LINE. Gib für jeden Wegpunkt ident, latitude und longitude zurück. Lass Wegpunkte ohne erkennbare Koordinaten weg.\n\n${lines}`,
        response_json_schema: {
          type: "object",
          properties: {
            waypoints: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  ident: { type: "string" },
                  latitude: { type: "number" },
                  longitude: { type: "number" },
                },
              },
            },
          },
        },
      });

      const wps = (parsed?.waypoints || []).filter(
        (w) =>
          w.ident &&
          w.latitude != null &&
          w.longitude != null &&
          Math.abs(w.latitude) <= 90 &&
          Math.abs(w.longitude) <= 180
      );

      if (!wps.length) {
        setError("Die Wegpunkt-Koordinaten konnten nicht ermittelt werden.");
        return;
      }

      const stops = wps.map((w) => ({
        type: "waypoint",
        code: w.ident,
        sub: "",
        name: "Wegpunkt (PDF)",
        country: "",
        lat: w.latitude,
        lng: w.longitude,
        key: Math.random().toString(36).slice(2),
      }));

      setPreview(stops);
    } catch (e) {
      setError("Verarbeitung fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-2xl">
      <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-2">
        <FileText className="w-4 h-4 text-rose-500" />
        Flugplan aus PDF importieren
      </h2>
      <p className="text-xs text-slate-500 mb-4">
        Lade einen Flugplan als PDF hoch. Die Wegpunkte aus dem Abschnitt{" "}
        <span className="font-mono font-medium">WAYPOINT</span> werden automatisch
        ausgelesen.
      </p>

      <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-xl py-8 px-4 cursor-pointer hover:border-rose-400 hover:bg-rose-50/30 transition-colors">
        <Upload className="w-6 h-6 text-slate-400" />
        <span className="text-sm text-slate-600">
          {file ? file.name : "PDF-Datei auswählen"}
        </span>
        <input
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={handleFile}
        />
      </label>

      <div className="flex flex-wrap items-center gap-3 mt-4">
        <Button
          onClick={run}
          disabled={!file || busy}
          className="bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white"
        >
          {busy ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <FileText className="w-4 h-4 mr-2" />
          )}
          {busy ? "Wird ausgelesen…" : "Wegpunkte auslesen"}
        </Button>
        {preview && (
          <Button
            variant="outline"
            onClick={() => onImport(preview)}
            className="border-green-300 text-green-700 hover:bg-green-50"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {preview.length} Wegpunkte übernehmen
          </Button>
        )}
      </div>

      {error && (
        <p className="text-sm text-rose-600 mt-4 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </p>
      )}

      {preview && (
        <div className="mt-5 pt-4 border-t border-slate-200">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Gefundene Wegpunkte ({preview.length})
          </h3>
          <div className="max-h-72 overflow-y-auto space-y-1">
            {preview.map((s, i) => (
              <div
                key={s.key}
                className="flex items-center gap-2 text-sm rounded-md border border-slate-100 px-2.5 py-1.5"
              >
                <span className="w-6 text-center font-semibold text-slate-400">
                  {i + 1}
                </span>
                <Navigation className="w-3.5 h-3.5 text-rose-500" />
                <span className="font-mono font-medium text-slate-800">
                  {s.code}
                </span>
                <span className="text-xs text-slate-400 tabular-nums">
                  {s.lat.toFixed(4)}, {s.lng.toFixed(4)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}