import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { MapPin, Loader2, Globe2, Search, Navigation, Plane, Route } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ResultCard from "@/components/ResultCard";
import "leaflet/dist/leaflet.css";

// Eigenes Marker-Icon
const markerIcon = L.divIcon({
  className: "custom-marker",
  html: `<div style="
    width: 28px; height: 28px; border-radius: 50% 50% 50% 0;
    background: hsl(0 84% 60%); transform: rotate(-45deg);
    box-shadow: 0 4px 12px rgba(0,0,0,0.35);
    border: 2px solid white;
  "></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

function MapClickHandler({ onClick }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function Home() {
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [marker, setMarker] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const setCoords = (latitude, longitude) => {
    setLat(latitude.toFixed(4));
    setLng(longitude.toFixed(4));
    setMarker([latitude, longitude]);
  };

  const handleLookup = async () => {
    setError("");
    setResult(null);
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (isNaN(latNum) || isNaN(lngNum)) {
      setError("Bitte gültige Zahlen für Breiten- und Längengrad eingeben.");
      return;
    }
    if (latNum < -90 || latNum > 90) {
      setError("Breitengrad muss zwischen -90 und 90 liegen.");
      return;
    }
    if (lngNum < -180 || lngNum > 180) {
      setError("Längengrad muss zwischen -180 und 180 liegen.");
      return;
    }
    setLoading(true);
    try {
      const prompt = `Bestimme das Land sowie die nächstgelegene Stadt und Region/Provinz für die geografischen Koordinaten: Breitengrad ${latNum}, Längengrad ${lngNum}. Antworte ausschließlich als JSON im angegebenen Schema. Verwende den offiziellen Ländernamen in Deutsch und den ISO 3166-1 Alpha-2 Ländercode (z.B. DE, FR, US).`;
      const schema = {
        type: "object",
        properties: {
          country: { type: "string", description: "Offizieller Ländername auf Deutsch" },
          country_code: { type: "string", description: "ISO 3166-1 Alpha-2 Code" },
          city: { type: "string", description: "Nächstgelegene Stadt auf Deutsch" },
          region: { type: "string", description: "Region/Bundesland/Provinz auf Deutsch" },
          continent: { type: "string", description: "Kontinent auf Deutsch" },
          in_ocean: { type: "boolean", description: "true, wenn der Punkt im Meer/Ozean liegt (kein Land)" },
        },
        required: ["country", "country_code", "city", "region", "continent", "in_ocean"],
      };
      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: schema,
      });
      setResult(res);
      setMarker([latNum, lngNum]);
    } catch (e) {
      setError("Die Abfrage konnte nicht durchgeführt werden. Bitte erneut versuchen.");
    } finally {
      setLoading(false);
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolokalisierung wird von diesem Browser nicht unterstützt.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords(pos.coords.latitude, pos.coords.longitude),
      () => setError("Standort konnte nicht ermittelt werden.")
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200/60 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <Globe2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-slate-900">GeoFinder</h1>
            <p className="text-xs text-slate-500">Land anhand von Koordinaten bestimmen</p>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <Link to="/waypoints" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-rose-500 transition-colors">
              <Navigation className="w-4 h-4" />
              Wegpunkte
            </Link>
            <Link to="/airports" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-sky-500 transition-colors">
              <Plane className="w-4 h-4" />
              Flughäfen
            </Link>
            <Link to="/flightplan" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-rose-500 transition-colors">
              <Route className="w-4 h-4" />
              Flugplan
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Linke Spalte: Eingabe + Karte */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-500" />
                Koordinaten eingeben
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="lat" className="text-xs text-slate-500">Breitengrad (Lat)</Label>
                  <Input
                    id="lat"
                    type="number"
                    step="any"
                    placeholder="z.B. 52.5200"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className="bg-slate-50 border-slate-200 focus:bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lng" className="text-xs text-slate-500">Längengrad (Lng)</Label>
                  <Input
                    id="lng"
                    type="number"
                    step="any"
                    placeholder="z.B. 13.4050"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    className="bg-slate-50 border-slate-200 focus:bg-white"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-3 mt-5">
                <Button
                  onClick={handleLookup}
                  disabled={loading}
                  className="bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white shadow-md shadow-rose-500/20"
                >
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                  Land bestimmen
                </Button>
                <Button variant="outline" onClick={useMyLocation} disabled={loading}>
                  <MapPin className="w-4 h-4 mr-2" />
                  Mein Standort
                </Button>
              </div>
              {error && (
                <p className="text-sm text-rose-600 mt-4 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 pt-5 pb-3">
                <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-rose-500" />
                  Karte – klicke um zu wählen
                </h2>
              </div>
              <div className="h-[320px] w-full">
                <MapContainer
                  center={[20, 0]}
                  zoom={2}
                  scrollWheelZoom
                  className="h-full w-full"
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap'
                  />
                  <MapClickHandler onClick={setCoords} />
                  {marker && <Marker position={marker} icon={markerIcon} />}
                </MapContainer>
              </div>
            </div>
          </div>

          {/* Rechte Spalte: Ergebnis */}
          <div>
            <ResultCard result={result} loading={loading} />
          </div>
        </div>
      </main>
    </div>
  );
}