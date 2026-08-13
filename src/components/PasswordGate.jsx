import React, { useState } from "react";
import { Lock, Loader2, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "eccal_admin_auth";

export default function PasswordGate({ children }) {
  const [authorized, setAuthorized] = useState(
    () => sessionStorage.getItem(STORAGE_KEY) === "1"
  );
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await base44.functions.invoke("verifyAdminPassword", {
        password: password.trim(),
      });
      if (res?.data?.authorized) {
        sessionStorage.setItem(STORAGE_KEY, "1");
        setAuthorized(true);
      } else {
        setError("Falsches Passwort.");
      }
    } catch (err) {
      setError("Falsches Passwort.");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setAuthorized(false);
    setPassword("");
  };

  if (authorized) {
    return (
      <>
        {children}
        <div className="max-w-6xl mx-auto px-6 pb-8">
          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
          >
            <ShieldCheck className="w-4 h-4" />
            Admin-Sitzung beenden
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-md mx-auto mb-4">
          <Lock className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900">Admin-Bereich</h2>
        <p className="text-sm text-slate-500 mt-1 mb-6">
          Bitte Passwort eingeben, um fortzufahren.
        </p>
        <form onSubmit={submit} className="space-y-3 text-left">
          <Input
            type="password"
            placeholder="Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            className="bg-slate-50 border-slate-200"
          />
          {error && (
            <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <Button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-slate-950 text-white"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Lock className="w-4 h-4 mr-2" />
            )}
            Entsperren
          </Button>
        </form>
      </div>
    </div>
  );
}