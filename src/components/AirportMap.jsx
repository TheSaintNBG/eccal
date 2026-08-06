import React from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function AirportMap({ airports, maxMarkers = 300 }) {
  const withCoords = airports.filter((a) => a.latitude != null && a.longitude != null);
  const shown = withCoords.slice(0, maxMarkers);

  if (!shown.length) {
    return (
      <div className="h-[300px] flex items-center justify-center text-sm text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
        Keine Flughäfen mit Koordinaten zum Anzeigen
      </div>
    );
  }

  return (
    <div className="h-[400px] w-full rounded-xl overflow-hidden border border-slate-200">
      <MapContainer center={[20, 0]} zoom={2} scrollWheelZoom className="h-full w-full">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />
        {shown.map((a) => (
          <CircleMarker
            key={a.id}
            center={[a.latitude, a.longitude]}
            radius={4}
            pathOptions={{ color: "#0ea5e9", fillColor: "#0ea5e9", fillOpacity: 0.7 }}
          >
            <Tooltip>
              <b>{a.icao}</b> {a.iata ? `(${a.iata})` : ""}
              <br />
              {a.name}
              <br />
              {a.latitude.toFixed(4)}, {a.longitude.toFixed(4)}
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}