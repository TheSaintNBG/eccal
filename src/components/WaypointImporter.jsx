import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RotateCw,
} from "lucide-react";

export default function WaypointImporter({ onDone }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [diag, setDiag] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    setResult(null);
    setDiag(null);
    try {
      const up = await base44.integrations.Core.UploadFile({ file });
      const res = await base44.functions.invoke("importWaypoints", {
        file_url: up.file_url,
      });
      const data = res.data;
      if (data?.error) throw new Error(data.error);
      setResult(data);
      onDone?.();
    } catch (err) {
      const d = err?.response?.data;
      setError(d?.error || err?.message || "Import fehlgeschlagen");
      setDiag(d || null);
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  return (
    <div className="rounded-xl border-2 border-dashed border-slate-200 p-5 bg-slate-50/50">
      <div className="flex items-start gap-3">
        <span className="w-10 h-10 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
          <Upload className="w-5 h-5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-800">
            Wegpunkte neu importieren
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            .xlsx mit Tabellenblatt „FRA Points" — Spalten:{" "}
            <span className="font-mono">FRA Point</span>,{" "}
            <span className="font-mono">FRA Point Latitude</span>,{" "}
            <span className="font-mono">FRA Point Longitude</span>. Alle
            bestehenden Wegpunkte werden ersetzt.
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="inline-flex items-center gap-2 cursor-pointer rounded-lg bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-sm font-medium px-4 py-2 shadow-sm">
          {busy ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RotateCw className="w-4 h-4" />
          )}
          {busy ? "Importiere…" : "Datei auswählen & importieren"}
          <input
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={handleFile}
            disabled={busy}
          />
        </label>
        {result && (
          <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
            {result.imported} Wegpunkte importiert
          </span>
        )}
        {error && (
          <span className="inline-flex items-center gap-1.5 text-sm text-rose-600">
            <AlertCircle className="w-4 h-4" />
            {error}
          </span>
        )}
      </div>
      {diag && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600 overflow-x-auto">
          {diag.matchedSheet != null && (
            <div className="mb-1">
              <span className="text-slate-400">Erkanntes Blatt: </span>
              <span className="font-mono">{String(diag.matchedSheet)}</span>
            </div>
          )}
          {Array.isArray(diag.sheetNames) && (
            <div className="mb-1">
              <span className="text-slate-400">Blätter in Datei: </span>
              <span className="font-mono">{diag.sheetNames.join(", ")}</span>
            </div>
          )}
          {diag.rowCount != null && (
            <div className="mb-1">
              <span className="text-slate-400">Zeilen: </span>
              <span className="font-mono">{diag.rowCount}</span>
            </div>
          )}
          {Array.isArray(diag.headerKeys) && diag.headerKeys.length > 0 && (
            <div className="mb-1">
              <span className="text-slate-400">Spaltenköpfe: </span>
              <span className="font-mono">{diag.headerKeys.join(" | ")}</span>
            </div>
          )}
          {diag.sampleRow && (
            <div>
              <span className="text-slate-400">Beispielzeile: </span>
              <pre className="mt-1 whitespace-pre-wrap break-all font-mono text-[11px] text-slate-500">
                {JSON.stringify(diag.sampleRow)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}