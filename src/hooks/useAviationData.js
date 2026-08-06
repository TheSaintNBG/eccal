import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

// Lädt alle Flughäfen (Cursor-Paginierung, da SDK max. 5000 pro Aufruf)
// und alle Wegpunkte einmalig in den Speicher.
export function useAviationData() {
  const [airports, setAirports] = useState([]);
  const [waypoints, setWaypoints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const LIMIT = 5000;
        let allA = [];
        let cursor = null;
        for (let i = 0; i < 5; i++) {
          const batch =
            cursor === null
              ? await base44.entities.Airport.list("-icao", LIMIT)
              : await base44.entities.Airport.filter({ icao: { $lt: cursor } }, "-icao", LIMIT);
          allA = allA.concat(batch);
          if (batch.length < LIMIT) break;
          cursor = batch[batch.length - 1].icao;
        }
        setAirports(allA);

        const wps = await base44.entities.Waypoint.list("-ident", 5000);
        setWaypoints(wps);
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { airports, waypoints, loading };
}