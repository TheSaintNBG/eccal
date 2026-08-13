import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Globe2,
  Navigation,
  Plane,
  Coins,
  PlaneTakeoff,
  LayoutGrid,
} from "lucide-react";
import AppNav from "@/components/AppNav";

const cards = [
  {
    to: "/geofinder",
    icon: Globe2,
    title: "Koordinaten-Suche",
    desc: "Land anhand von Koordinaten bestimmen",
    color: "from-rose-500 to-orange-500",
  },
  {
    to: "/waypoints",
    icon: Navigation,
    title: "Wegpunkte",
    desc: "Flug-Wegpunkte verwalten",
    color: "from-rose-500 to-pink-500",
  },
  {
    to: "/airports",
    icon: Plane,
    title: "Flughäfen",
    desc: "Flughafen-Datenbank",
    color: "from-sky-500 to-cyan-500",
  },
  {
    to: "/routecharges",
    icon: Coins,
    title: "Streckengebühren",
    desc: "EUROCONTROL-Gebührensätze",
    color: "from-amber-500 to-orange-500",
  },
  {
    to: "/aircraft",
    icon: PlaneTakeoff,
    title: "Flugzeuge",
    desc: "Kennzeichen & MTOW",
    color: "from-indigo-500 to-violet-500",
  },
];

export default function Admin() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <AppNav
        title="Admin"
        subtitle="Datenverwaltung"
        icon={LayoutGrid}
        accent="from-slate-500 to-slate-700"
      />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <Link
                key={c.to}
                to={c.to}
                className="group bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center shadow-md mb-3`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-base font-semibold text-slate-900 group-hover:text-slate-700">
                  {c.title}
                </h2>
                <p className="text-sm text-slate-500 mt-1">{c.desc}</p>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}