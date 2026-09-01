import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, Loader2, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RouteChargeUploader({ onUpdated }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState("");
  const [status, setStatus] = useState(null); // { type, msg }
  const [extracted, setExtracted] = useState(null);

  const pick = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setStatus(null);
      setExtracted(null);
    }
  };

  const reset = () => {
    setFile(null);
    setExtracted(null);
    setStatus(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const process = async () => {
    if (!file) return;
    setBusy(true);
    setStatus(null);
    try {
      setStage("PDF wird hochgeladen…");
      const up = await base44.integrations.Core.UploadFile({ file });
      const fileUrl = up?.file_url;
      if (!fileUrl) throw new Error("Upload fehlgeschlagen.");

      setStage("Gebühren werden aus dem PDF extrahiert…");
      const res = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: fileUrl,
        json_schema: {
          type: "object",
          properties: {
            charges: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  zone: { type: "string" },
                  zone_label: { type: "string" },
                  national_unit_rate_eur: { type: "number" },
                  global_unit_rate_eur: { type: "number" },
                  exchange_rate: { type: "number" },
                  currency_code: { type: "string" },
                  valid_month: { type: "string" },
                  emu_member: { type: "boolean" },
                },
                required: ["zone", "national_unit_rate_eur", "global_unit_rate_eur"],
              },
            },
          },
        },
      });

      const rows =
        res?.output?.charges ||
        (Array.isArray(res?.output) ? res.output : null) ||
        [];
      if (!Array.isArray(rows) || rows.length === 0) {
        throw new Error("Keine Gebührendaten im PDF gefunden.");
      }

      const cleaned = rows
        .filter((r) => r && r.zone && r.national_unit_rate_eur != null && r.global_unit_rate_eur != null)
        .map((r) => ({
          zone: String(r.zone).trim(),
          zone_label: r.zone_label ?? String(r.zone).trim(),
          national_unit_rate_eur: Number(r.national_unit_rate_eur),
          global_unit_rate_eur: Number(r.global_unit_rate_eur),
          exchange_rate: r.exchange_rate ?? null,
          currency_code: r.currency_code ?? "EUR",
          valid_month: r.valid_month ?? "",
          emu_member: r.emu_member ?? true,
        }));

      if (cleaned.length === 0) throw new Error("Extrahierte Daten unvollständig.");

      setExtracted(cleaned);
      setStage("");
      setStatus({ type: "info", msg: `${cleaned.length} Zonen erkannt. Jetzt ersetzen?` });
    } catch (e) {
      setStatus({ type: "error", msg: e?.message || "Extraktion fehlgeschlagen." });
    } finally {
      setBusy(false);
    }
  };

  const replaceAll = async () => {
    if (!extracted) return;
    setBusy(true);
    setStage("Bestehende Preise werden gelöscht…");
    try {
      await base44.entities.RouteCharge.deleteMany({});
      setStage("Neue Preise werden gespeichert…");
      await base44.entities.RouteCharge.bulkCreate(extracted);
      setStatus({ type: "success", msg: `${extracted.length} Zonen erfolgreich ersetzt.` });
      setExtracted(null);
      reset();
      onUpdated?.();
    } catch (e) {
      setStatus({ type: "error", msg: e?.message || "Ersetzen fehlgeschlagen." });
    } finally {
      setBusy(false);
      setStage("");
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-4">
        <Upload className="w-4 h-4 text-amber-500" />
        Preise aktualisieren (PDF)
      </h2>

      <p className="text-xs text-slate-500 mb-4">
        Lade das aktuelle EUROCONTROL-Gebühren-PDF hoch. Die erkannten Preise ersetzen
        alle bestehenden Einträge.
      </p>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) {
            setFile(f);
            setStatus(null);
            setExtracted(null);
          }
        }}
        className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/40 transition"
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={pick}
        />
        {file ? (
          <div className="flex items-center justify-center gap-2 text-slate-700">
            <FileText className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-medium truncate max-w-[260px]">{file.name}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 text-slate-400">
            <Upload className="w-6 h-6" />
            <span className="text-sm">PDF hierher ziehen oder klicken zum Auswählen</span>
          </div>
        )}
      </div>

      {stage && (
        <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
          <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
          {stage}
        </div>
      )}

      {status && (
        <div
          className={`mt-4 flex items-center gap-2 text-sm rounded-lg px-3 py-2 border ${
            status.type === "success"
              ? "bg-green-50 border-green-100 text-green-700"
              : status.type === "error"
              ? "bg-rose-50 border-rose-100 text-rose-700"
              : "bg-slate-50 border-slate-100 text-slate-700"
          }`}
        >
          {status.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : status.type === "error" ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : null}
          {status.msg}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          onClick={process}
          disabled={!file || busy}
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
        >
          {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
          PDF auslesen
        </Button>
        {extracted && (
          <Button onClick={replaceAll} disabled={busy} variant="destructive">
            Preise ersetzen ({extracted.length})
          </Button>
        )}
        {file && (
          <Button onClick={reset} variant="ghost" disabled={busy}>
            Abbrechen
          </Button>
        )}
      </div>
    </div>
  );
}