import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Route as RouteIcon,
  Globe2,
  Navigation,
  Plane,
  Coins,
  PlaneTakeoff,
  ShieldCheck,
} from "lucide-react";

const NAV = [
  { to: "/", label: "Flugplan", icon: RouteIcon },
  { to: "/geofinder", label: "GeoFinder", icon: Globe2 },
  { to: "/waypoints", label: "Wegpunkte", icon: Navigation },
  { to: "/airports", label: "Flughäfen", icon: Plane },
  { to: "/routecharges", label: "Gebühren", icon: Coins },
  { to: "/aircraft", label: "Flugzeuge", icon: PlaneTakeoff },
  { to: "/admin", label: "Admin", icon: ShieldCheck },
];

function isActive(pathname, to) {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(to);
}

export default function AppNav({ title, subtitle, icon: Icon, accent = "from-rose-500 to-orange-500" }) {
  const { pathname } = useLocation();

  const renderItem = (item, mobile = false) => {
    const active = isActive(pathname, item.to);
    const I = item.icon;
    return (
      <Link
        key={item.to}
        to={item.to}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          mobile ? "shrink-0 " : ""
        }${active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
      >
        <I className="w-4 h-4" />
        {item.label}
      </Link>
    );
  };

  return (
    <header className="border-b border-slate-200/60 bg-white/85 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 h-14">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-md shadow-rose-500/20">
              <span className="text-white font-bold text-sm tracking-tight">E</span>
            </span>
            <span className="font-semibold tracking-tight text-slate-900">ECCAL</span>
          </Link>
          <nav className="ml-auto hidden md:flex items-center gap-1">
            {NAV.map((i) => renderItem(i))}
          </nav>
        </div>
        <nav className="md:hidden flex items-center gap-1 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
          {NAV.map((i) => renderItem(i, true))}
        </nav>
        {title && (
          <div className="flex items-center gap-3 py-3 border-t border-slate-100">
            <span className={`w-9 h-9 rounded-lg bg-gradient-to-br ${accent} flex items-center justify-center shadow-md`}>
              {Icon && <Icon className="w-5 h-5 text-white" />}
            </span>
            <div>
              <h1 className="text-base font-semibold tracking-tight text-slate-900 leading-tight">
                {title}
              </h1>
              {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}