import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Bug, Loader2, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const RECIPIENT = "jirka.lissewski@icloud.com";

export default function BugReportButton() {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const reset = () => {
    setTitle("");
    setDescription("");
    setError("");
    setDone(false);
  };

  const submit = async () => {
    setError("");
    if (!description.trim()) {
      setError("Bitte beschreibe den Fehler kurz.");
      return;
    }
    setSending(true);
    try {
      const body = [
        `Titel: ${title.trim() || "—"}`,
        "",
        "Beschreibung:",
        description.trim(),
        "",
        `Zeitpunkt: ${new Date().toLocaleString("de-DE")}`,
        `Seite: ${window.location.pathname}`,
      ].join("\n");

      await base44.integrations.Core.SendEmail({
        to: RECIPIENT,
        subject: `Bug-Report: ${title.trim() || "ECCAL"}`,
        body,
      });
      setDone(true);
      setTimeout(() => {
        setOpen(false);
        reset();
      }, 1800);
    } catch (e) {
      setError("Senden fehlgeschlagen. Bitte später erneut versuchen.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-slate-900/30 hover:bg-slate-800 transition-colors"
        title="Bug melden"
      >
        <Bug className="w-4 h-4" />
        Bug melden
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => !sending && setOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                  <Bug className="w-4 h-4" />
                </span>
                <h2 className="text-base font-semibold text-slate-900">
                  Bug melden
                </h2>
              </div>
              <button
                onClick={() => !sending && setOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {done ? (
              <div className="py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 mx-auto flex items-center justify-center mb-3">
                  <Send className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-slate-800">
                  Danke! Bug-Report wurde gesendet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="bug-title">Titel (optional)</Label>
                  <Input
                    id="bug-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Kurze Zusammenfassung"
                    disabled={sending}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bug-desc">Beschreibung *</Label>
                  <Textarea
                    id="bug-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Was ist passiert? Welche Schritte führen zum Fehler?"
                    rows={5}
                    disabled={sending}
                  />
                </div>
                {error && (
                  <p className="text-sm text-rose-600">{error}</p>
                )}
                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    variant="ghost"
                    onClick={() => setOpen(false)}
                    disabled={sending}
                  >
                    Abbrechen
                  </Button>
                  <Button onClick={submit} disabled={sending}>
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    ) : (
                      <Send className="w-4 h-4 mr-1" />
                    )}
                    Senden
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}