import React, { useRef, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function findMatch(ident, airports, waypoints) {
  const id = ident.toUpperCase();
  const ap = airports.find(
    (a) => (a.icao && a.icao.toUpperCase() === id) || (a.iata && a.iata.toUpperCase() === id)
  );
  if (ap)
    return {
      type: "airport",
      id: ap.id,
      code: ap.icao,
      sub: ap.iata || "",
      name: ap.name,
      country: ap.country,
      lat: ap.latitude,
      lng: ap.longitude,
    };
  const wp = waypoints.find((w) => w.ident && w.ident.toUpperCase() === id);
  if (wp)
    return {
      type: "waypoint",
      id: wp.id,
      code: wp.ident,
      sub: "",
      name: "Wegpunkt",
      country: "",
      lat: wp.latitude,
      lng: wp.longitude,
    };
  return null;
}

export default function FplImporter({ airports = [], waypoints = [], onImport }) {
  const inputRef = useRef(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleFile = async (file) => {
    setError("");
    if (!file) return;
    setBusy(true);
    try {
      const text = await file.text();
      const doc = new DOMParser().parseFromString(text, "application/xml");
      const wpEls = [...doc.querySelectorAll("waypoint")];
      if (wpEls.length === 0) {
        setError("Keine <waypoint>-Einträge in der Datei gefunden.");
        return;
      }
      const stops = [];
      wpEls.forEach((el) => {
        const identifier = el.querySelector("identifier")?.textContent?.trim();
        const lat = parseFloat(el.querySelector("lat")?.textContent);
        const lon = parseFloat(el.querySelector("lon")?.textContent);
        if (!identifier) return;
        const match = findMatch(identifier, airports, waypoints);
        if (match) {
          stops.push({ ...match, key: Math.random().toString(36).slice(2) });
        } else if (!isNaN(lat) && !isNaN(lon)) {
          const type = el.querySelector("type")?.textContent?.trim();
          const desc = el.querySelector("description")?.textContent?.trim();
          const country = el.querySelector("country")?.textContent?.trim() || "";
          stops.push({
            type: type === "AIRPORT" ? "airport" : "waypoint",
            code: identifier,
            sub: "",
            name: desc || (type === "AIRPORT" ? "Flughafen" : "Wegpunkt"),
            country,
            lat,
            lng: lon,
            key: Math.random().toString(36).slice(2),
          });
        }
      });
      if (stops.length === 0) {
        setError("Keine verwertbaren Wegpunkte mit Koordinaten gefunden.");
        return;
      }
      onImport(stops);
    } catch (e) {
      setError("Datei konnte nicht gelesen werden.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="mb-4">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <Button
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="w-full border-dashed"
      >
        {busy ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <FileUp className="w-4 h-4 mr-2" />
        )}
        ForeFlight FPL importieren
      </Button>
      {error && <p className="text-xs text-rose-600 mt-2">{error}</p>}
    </div>
  );
}