import React from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function WaypointMap({ waypoints, maxMarkers = 300 }) {
  const shown = waypoints.slice(0, maxMarkers);

  if (!shown.length) {
    return (
      <div className="h-[300px] flex items-center justify-center text-sm text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
        Keine Wegpunkte zum Anzeigen
      </div>
    );
  }

  return (
    <div className="h-[400px] w-full rounded-xl overflow-hidden border border-slate-200">
      <MapContainer center={[51.16, 10.45]} zoom={6} scrollWheelZoom className="h-full w-full">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />
        {shown.map((w) => (
          <CircleMarker
            key={w.id}
            center={[w.latitude, w.longitude]}
            radius={5}
            pathOptions={{ color: "#e11d48", fillColor: "#e11d48", fillOpacity: 0.7 }}
          >
            <Tooltip>
              <b>{w.ident}</b>
              <br />
              {w.latitude.toFixed(4)}, {w.longitude.toFixed(4)}
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}