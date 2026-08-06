import React from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function FlightPlanMap({ stops }) {
  const points = stops.filter((s) => s.lat != null && s.lng != null);

  if (points.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center text-sm text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
        Füge Stationen hinzu, um die Route zu sehen
      </div>
    );
  }

  const latlngs = points.map((s) => [s.lat, s.lng]);
  const center = latlngs[0];
  const last = points.length - 1;

  return (
    <div className="h-[400px] w-full rounded-xl overflow-hidden border border-slate-200">
      <MapContainer center={center} zoom={5} scrollWheelZoom className="h-full w-full">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />
        <Polyline
          positions={latlngs}
          pathOptions={{ color: "#e11d48", weight: 2.5, dashArray: "6 6" }}
        />
        {points.map((s, i) => {
          const color = i === 0 ? "#16a34a" : i === last ? "#dc2626" : "#0ea5e9";
          return (
            <CircleMarker
              key={s.key}
              center={[s.lat, s.lng]}
              radius={7}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.9 }}
            >
              <Tooltip>
                <b>{i + 1}. {s.code}</b>
                <br />
                {s.name}
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}